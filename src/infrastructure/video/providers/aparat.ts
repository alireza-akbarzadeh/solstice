import type { PlaybackGrant, Playback, VideoProvider } from "../types";
import { parseAparatHash } from "../assets";
export { parseAparatHash } from "../assets";

/** Aparat hashes are alphanumeric, typically 8–20 characters. */

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
  async getPlayback(
    assetId: string | null,
    _grant: PlaybackGrant,
  ): Promise<Playback> {
    const hash = assetId && parseAparatHash(assetId);
    if (!hash) return { kind: "embed", src: "", title: "Aparat" };
    return {
      kind: "embed",
      src: `https://www.aparat.com/video/video/embed/videohash/${hash}/vt/frame`,
      title: "Aparat",
    };
  },
};
