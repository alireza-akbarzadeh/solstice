// Downloads every image a Stitch screen uses into public/images/<name>/ and prints a manifest.
// Usage: node --dns-result-order=ipv4first scripts/stitch-images.mjs <screen-file-slug> <name>
//   e.g. node --dns-result-order=ipv4first scripts/stitch-images.mjs solstice-studio-desktop-home home
// Images are numbered in document order; identical URLs are downloaded once.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const [screen, name] = process.argv.slice(2);
if (!screen || !name) throw new Error("Usage: stitch-images.mjs <screen-file-slug> <name>");

const html = readFileSync(`design/stitch/screens/${screen}.html`, "utf8");
const outDir = `public/images/${name}`;
mkdirSync(outDir, { recursive: true });

// <img src="…"> and CSS backgrounds: style="background-image: url('…')".
const tags = html.matchAll(/<img\b[^>]*>|<[a-z]+\b[^>]*style="[^"]*url\('[^']+'\)[^"]*"[^>]*>/g);

const seen = new Map();
const manifest = [];
for (const [tag] of tags) {
  const src = tag.match(/\bsrc="([^"]+)"/)?.[1] ?? tag.match(/url\('([^']+)'\)/)?.[1];
  if (!src?.startsWith("http")) continue;
  const alt = (tag.match(/\bdata-alt="([^"]*)"/) ?? tag.match(/\balt="([^"]*)"/))?.[1] ?? "";
  if (seen.has(src)) continue;

  // Google image URLs serve 512px by default; `=w2400` asks for the original (Stitch images top out ~1376px).
  const res = await fetch(src.includes("googleusercontent.com") && !src.includes("=") ? `${src}=w2400` : src);
  const type = res.headers.get("content-type") ?? "";
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const file = `${String(seen.size + 1).padStart(2, "0")}.${ext}`;
  writeFileSync(`${outDir}/${file}`, Buffer.from(await res.arrayBuffer()));
  seen.set(src, file);
  manifest.push({ file: `/images/${name}/${file}`, alt });
}

writeFileSync(`${outDir}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
for (const m of manifest) console.log(`${m.file}  ${m.alt.slice(0, 110)}`);
