// Renders the favicon, PWA icons, notification badge and transparent PNG from the SVG master.
// Usage: pnpm icons (re-run after changing public/images/brand/logo.svg)
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

// sharp ships with Next.js; resolve it from there instead of adding a dependency.
const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [dirname(require.resolve("next"))] }));

const MASTER = "public/images/brand/logo.svg";
const BACKGROUND = "#fef8f4";
const svg = await readFile(MASTER, "utf8");

async function iconBuffer(size, markRatio) {
  const mark = await sharp(Buffer.from(svg), { density: 300 })
    .resize(Math.round(size * markRatio), Math.round(size * markRatio), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

await writeFile("public/icons/icon-192.png", await iconBuffer(192, 0.82));
await writeFile("public/icons/icon-512.png", await iconBuffer(512, 0.82));
// Keep all artwork within the central 80% circle so Android masks cannot clip the mark.
await writeFile("public/icons/icon-maskable-512.png", await iconBuffer(512, 0.66));
await writeFile("public/icons/apple-touch-icon.png", await iconBuffer(180, 0.8));

// A square SVG canvas works for browser tabs; both SVGs share the same vector paths.
await writeFile("public/icons/mark.svg", svg.replace('viewBox="160 120 480 560" width="480" height="560"', 'viewBox="80 80 640 640" width="640" height="640"'));
await sharp(Buffer.from(svg), { density: 300 }).resize(960, 1120).png().toFile("public/images/brand/logo-transparent.png");

// Android uses only alpha, so render a white silhouette on a transparent canvas.
const badgeSvg = svg.replace(/fill="#[0-9a-f]{6}"/gi, 'fill="#ffffff"');
await sharp(Buffer.from(badgeSvg), { density: 300 })
  .resize(96, 96, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile("public/icons/badge-96.png");

// ICO supports embedded PNGs; include small sizes for tabs and a large one for shortcuts.
const sizes = [16, 32, 48, 256];
const images = await Promise.all(sizes.map((size) => iconBuffer(size, 0.9)));
const header = Buffer.alloc(6 + images.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
for (const [index, image] of images.entries()) {
  const entry = 6 + index * 16;
  header.writeUInt8(sizes[index] === 256 ? 0 : sizes[index], entry);
  header.writeUInt8(sizes[index] === 256 ? 0 : sizes[index], entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
}
await writeFile("public/favicon.ico", Buffer.concat([header, ...images]));

console.log("Generated SVG/PNG logo, favicon, PWA icons, Apple touch icon and notification badge.");
