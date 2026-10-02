import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";

const root = fileURLToPath(new URL("../", import.meta.url));
registerHooks({
  resolve(specifier, context, nextResolve) {
    let base;
    if (specifier === "next/server") base = path.join(root, "node_modules/next/server.js");
    else if (specifier.startsWith("@/")) base = path.join(root, "src", specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.startsWith(pathToFileURL(path.join(root, "src")).href))
      base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    if (base)
      for (const candidate of [base, `${base}.ts`, `${base}.js`, path.join(base, "index.ts")])
        if (existsSync(candidate) && /\.(ts|js)$/.test(candidate))
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

const { NextRequest } = await import("next/server");
const { default: middleware } = await import("../src/middleware.ts");
const { pagePreviewPath, pagePreviewHeader, pagePreviewQuery } = await import("../src/modules/pages/preview.ts");
const { mergePublishedCopy } = await import("../src/modules/pages/definitions.ts");

test("existing-page previews point at the real route and custom drafts keep the guarded preview route", () => {
  assert.equal(pagePreviewPath("about"), "/about?cmsPreview=about");
  assert.equal(pagePreviewPath("home"), "/?cmsPreview=home");
  assert.equal(pagePreviewPath("site-settings"), "/?cmsPreview=site-settings");
  assert.equal(pagePreviewPath("spring-retreat"), "/instructor/pages/preview/spring-retreat");
});

test("middleware discards forged preview headers and only forwards registered query values", () => {
  const forged = middleware(new NextRequest("https://studio.test/about", { headers: { [pagePreviewHeader]: "about" } }));
  assert.equal(forged.headers.get(`x-middleware-request-${pagePreviewHeader}`), null);
  const invalid = middleware(new NextRequest("https://studio.test/about?cmsPreview=unknown"));
  assert.equal(invalid.headers.get(`x-middleware-request-${pagePreviewHeader}`), null);
  for (const pathname of ["/about", "/fa/about"] ) {
    const preview = middleware(new NextRequest(`https://studio.test${pathname}?${pagePreviewQuery}=about`));
    assert.equal(preview.headers.get(`x-middleware-request-${pagePreviewHeader}`), "about");
    assert.ok(preview.headers.get("cache-control").includes("no-store"));
    assert.equal(preview.headers.get("x-robots-tag"), "noindex, nofollow");
  }
});

test("adding the preview header preserves form/server-action request bodies and credentials", async () => {
  const request = new NextRequest("https://studio.test/about?cmsPreview=about", {
    method: "POST", body: "form=still-intact", headers: { cookie: "fixture=session", "next-action": "test-action" },
  });
  const response = middleware(request);
  assert.equal(await request.text(), "form=still-intact");
  assert.equal(response.headers.get("x-middleware-request-cookie"), "fixture=session");
  assert.equal(response.headers.get("x-middleware-request-next-action"), "test-action");
});

test("an instructor preview replaces only its selected page, leaving other published copy intact", () => {
  const published = { About: { hero: { title: "Live title", body: "Live introduction" } }, Home: { title: "Live home" }, Studio: { title: "Private editor" } };
  const draft = { copy: { en: { About: { hero: { title: "Draft title" } }, Home: { title: "Wrong namespace" } }, fa: { About: { hero: { title: "پیش‌نویس" } } } } };
  const result = mergePublishedCopy(published, "en", [{ slug: "about", publishedContent: draft }]);
  assert.equal(result.About.hero.title, "Draft title");
  assert.equal(result.About.hero.body, "Live introduction");
  assert.equal(result.Home.title, "Live home");
  assert.equal(result.Studio.title, "Private editor");
  assert.equal(published.About.hero.title, "Live title");
});

const workerSource = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
async function navigateWorker(pathname, offline = false) {
  const handlers = new Map();
  const opened = [], matched = [], stored = [];
  const origin = "https://studio.test";
  const context = {
    URL, Response, Object, Set, Error,
    self: { location: { href: `${origin}/sw.js?v=fixture`, origin }, addEventListener: (name, handler) => handlers.set(name, handler) },
    fetch: async () => { if (offline) throw new Error("Offline"); return new Response("Draft content"); },
    caches: {
      open: async (name) => { opened.push(name); return { put: async (key) => stored.push(key.url ?? key), keys: async () => [] }; },
      match: async (key) => { matched.push(key.url ?? key); return new Response(String(key).endsWith("offline") ? "Offline page" : "Old private content"); },
    },
  };
  vm.runInNewContext(workerSource, context);
  let response;
  const pending = [];
  handlers.get("fetch")({
    request: { url: `${origin}${pathname}`, method: "GET", mode: "navigate", headers: new Headers() },
    preloadResponse: Promise.resolve(undefined),
    respondWith: (value) => { response = value; }, waitUntil: (promise) => pending.push(promise),
  });
  const result = await response;
  await Promise.all(pending);
  return { text: await result.text(), opened, matched, stored };
}

test("the service worker never stores previews and never replays cached drafts offline", async () => {
  for (const pathname of ["/about?cmsPreview=about", "/fa/about?cmsPreview=about", "/instructor/pages/preview/retreat"]) {
    const online = await navigateWorker(pathname);
    assert.equal(online.text, "Draft content");
    assert.deepEqual(online.opened, []);
    assert.deepEqual(online.stored, []);
    const offline = await navigateWorker(pathname, true);
    assert.equal(offline.text, "Offline page");
    assert.deepEqual(offline.matched, [pathname.startsWith("/fa/") ? "/fa/offline" : "/offline"]);
  }
  const publicPage = await navigateWorker("/about");
  assert.deepEqual(publicPage.stored, ["https://studio.test/about"]);
});
