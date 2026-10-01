const ID = /^[\w-]{11}$/;

export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (ID.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id && ID.test(id) ? id : null;
  }
  if (
    host !== "youtube.com" &&
    host !== "m.youtube.com" &&
    host !== "youtube-nocookie.com"
  )
    return null;

  const v = url.searchParams.get("v");
  if (v && ID.test(v)) return v;

  const [, segment, id] = url.pathname.split("/");
  if (
    (segment === "embed" || segment === "shorts" || segment === "live") &&
    id &&
    ID.test(id)
  )
    return id;
  return null;
}

const HASH = /^[A-Za-z0-9]{6,24}$/;

/** aparat.com/v/HASH, /video/video/embed/videohash/HASH/vt/frame, or a bare hash. */
export function parseAparatHash(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (HASH.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "aparat.com" && !host.endsWith(".aparat.com")) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  const afterV = parts[0] === "v" ? parts[1] : undefined;
  if (afterV && HASH.test(afterV)) return afterV;

  const embedAt = parts.indexOf("videohash");
  const embedded = embedAt >= 0 ? parts[embedAt + 1] : undefined;
  return embedded && HASH.test(embedded) ? embedded : null;
}

/** Only direct HTTPS media URLs belong in the file player. A webpage URL is not a video file. */
export function parseMediaUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    return url.protocol === "https:" &&
      /\.(mp4|webm|m4v|ogv|mov)$/i.test(url.pathname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function parseVideoAsset(
  input: string,
  preferred: "mock" | "youtube" | "aparat" = "youtube",
) {
  const value = input.trim();
  const parsers = {
    youtube: parseYouTubeId,
    aparat: parseAparatHash,
    mock: parseMediaUrl,
  };
  // Platform URLs win before the file fallback; bare IDs use the selected provider first.
  const order: (keyof typeof parsers)[] = value.includes("://")
    ? ["youtube", "aparat", "mock"]
    : [
        preferred,
        ...(["youtube", "aparat", "mock"] as const).filter(
          (id) => id !== preferred,
        ),
      ];
  for (const providerId of order) {
    const assetId = parsers[providerId](value);
    if (assetId) return { providerId, assetId };
  }
  return null;
}
