// Renders the PWA / notification icons from public/icons/mark.svg.
// Usage: pnpm icons   (re-run after changing the mark)
import { createRequire } from "node:module";
import { dirname } from "node:path";

// sharp ships with Next.js; resolve it from there instead of adding a dependency.
const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [dirname(require.resolve("next"))] }));

const MARK = "public/icons/mark.svg";
const BACKGROUND = "#fef8f4"; // --surface

async function onBackground(size, markRatio, file) {
  const mark = await sharp(MARK, { density: 600 })
    .resize(Math.round(size * markRatio), Math.round(size * markRatio))
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(file);
}

await onBackground(192, 0.78, "public/icons/icon-192.png");
await onBackground(512, 0.78, "public/icons/icon-512.png");
// Maskable icons may be cropped to a circle: keep the mark inside the 80% safe zone.
await onBackground(512, 0.6, "public/icons/icon-maskable-512.png");
await onBackground(180, 0.72, "public/icons/apple-touch-icon.png");

// Android notification badge: only the alpha channel is used, so draw the mark in white.
const badgeSvg = (await import("node:fs"))
  .readFileSync(MARK, "utf8")
  .replace(/fill="#[0-9a-f]{6}"/gi, 'fill="none"')
  .replace(/stroke="#[0-9a-f]{6}"/gi, 'stroke="#ffffff"');
await sharp(Buffer.from(badgeSvg), { density: 600 }).resize(96, 96).png().toFile("public/icons/badge-96.png");

console.log("icons written to public/icons/");
