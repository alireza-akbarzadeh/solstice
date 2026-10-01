import type { PlaybackGrant, Playback, VideoProvider } from "../types";

/** Aparat hashes are alphanumeric, typically 8–20 characters. */
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
  if (!url.hostname.replace(/^www\./, "").endsWith("aparat.com")) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  const afterV = parts[0] === "v" ? parts[1] : undefined;
  if (afterV && HASH.test(afterV)) return afterV;

  const embedAt = parts.indexOf("videohash");
  const embedded = embedAt >= 0 ? parts[embedAt + 1] : undefined;
  return embedded && HASH.test(embedded) ? embedded : null;
}

/**
 * Iran's own video platform: free, and the one option here that plays inside Iran without a
 * VPN. Like YouTube it is an embed, so it cannot gate members-only practices — the video is
 * public on aparat.com regardless of what this app shows.
 */
export const aparatProvider: VideoProvider = {
  id: "aparat",
  canGate: false,
  assetHint: "https://www.aparat.com/v/…",
  parseAsset: parseAparatHash,
  async getPlayback(assetId: string | null, _grant: PlaybackGrant): Promise<Playback> {
    const hash = assetId && parseAparatHash(assetId);
    if (!hash) return { kind: "embed", src: "", title: "Aparat" };
    return { kind: "embed", src: `https://www.aparat.com/video/video/embed/videohash/${hash}/vt/frame`, title: "Aparat" };
  },
};
