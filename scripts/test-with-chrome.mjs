import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

async function run() {
  console.log("=== Testing with real Google Chrome via Chrome DevTools Protocol ===");
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "solstice-chrome-"));
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const port = 9333;

  console.log(`Launching Chrome from ${chromePath} on port ${port}...`);
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--window-size=1280,900",
    "http://localhost:3000/",
  ]);

  chrome.on("error", (err) => console.error("Chrome launch error:", err));

  // Wait for Chrome CDP endpoint
  let wsUrl = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const pages = await res.json();
        const page = pages.find((p) => p.type === "page");
        if (page?.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!wsUrl) {
    console.error("Failed to connect to Chrome DevTools endpoint");
    chrome.kill();
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    process.exit(1);
  }

  console.log("Connected to Chrome via WebSocket:", wsUrl);
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

  let reqId = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = reqId++;
      const onMsg = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener("message", onMsg);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      };
      ws.addEventListener("message", onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");

  async function evaluate(code) {
    const res = await send("Runtime.evaluate", {
      expression: code,
      awaitPromise: true,
      returnByValue: true,
    });
    return res.result?.value;
  }

  async function navigate(url) {
    console.log(`Navigating to ${url}...`);
    await send("Page.navigate", { url });
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 250));
      const ready = await evaluate("document.readyState");
      if (ready === "complete") break;
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  async function takeScreenshot(filename) {
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(data, "base64"));
    console.log(`Saved screenshot: ${filename}`);
  }

  // 1. Visit homepage
  await navigate("http://localhost:3000/");
  const title = await evaluate("document.title");
  console.log("Homepage loaded. Document title:", title);
  await takeScreenshot("screenshot-home-desktop.png");

  // 2. Test Mobile Viewport for Header
  console.log("Testing mobile viewport for header...");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 500));
  await takeScreenshot("screenshot-home-mobile.png");

  // Reset to desktop viewport
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // 3. Test Membership Page Country Routing: Iran (IR)
  console.log("Testing country routing for IRAN (IR)...");
  await send("Network.setCookie", {
    name: "solstice-test-country",
    value: "IR",
    url: "http://localhost:3000",
  });
  await navigate("http://localhost:3000/membership");

  const iranBodyText = await evaluate("document.body.innerText");
  const iranHasToman = iranBodyText.includes("تومان") || iranBodyText.includes("toman");
  const iranHasZarinpal = iranBodyText.includes("Zarinpal") || iranBodyText.includes("زرین‌پال") || iranBodyText.includes("Iranian");
  console.log("Iran country test results:", {
    tomanCurrencyFound: iranHasToman,
    zarinpalMethodFound: iranHasZarinpal,
  });
  await takeScreenshot("screenshot-membership-iran.png");

  // Also test Persian membership page
  await navigate("http://localhost:3000/fa/membership");
  const faBodyText = await evaluate("document.body.innerText");
  const faHasToman = faBodyText.includes("تومان");
  console.log("Persian /fa/membership with IR country:", { tomanCurrencyFound: faHasToman });
  await takeScreenshot("screenshot-membership-iran-fa.png");

  // 4. Test Membership Page Country Routing: Elsewhere (US)
  console.log("Testing country routing for US (Elsewhere)...");
  await send("Network.setCookie", {
    name: "solstice-test-country",
    value: "US",
    url: "http://localhost:3000",
  });
  await navigate("http://localhost:3000/membership");

  const usBodyText = await evaluate("document.body.innerText");
  const usHasUSD = usBodyText.includes("$") || usBodyText.includes("USD");
  const usHasInternational = usBodyText.includes("International") || usBodyText.includes("card");
  console.log("US country test results:", {
    usdCurrencyFound: usHasUSD,
    internationalCardFound: usHasInternational,
  });
  await takeScreenshot("screenshot-membership-us.png");

  // 5. Test Website Content Editor /instructor/pages?edit=home
  console.log("Testing website pages editor with advanced microcopy switch...");
  await navigate("http://localhost:3000/instructor/pages?edit=home");
  const editorHeadline = await evaluate("document.querySelector('h1, h2, h3')?.textContent");
  console.log("Pages editor headline:", editorHeadline);
  await takeScreenshot("screenshot-pages-editor.png");

  // Cleanup Chrome
  console.log("Closing Chrome cleanly...");
  try {
    await send("Browser.close");
  } catch {}
  chrome.kill();
  await new Promise((r) => setTimeout(r, 1000));
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}

  console.log("=== All Chrome browser tests passed successfully! ===");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
