import type { PlaybackGrant, Playback, VideoProvider } from "../types";

/** youtu.be/ID, /watch?v=ID, /embed/ID, /shorts/ID, or a bare 11-character id. */
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

  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id && ID.test(id) ? id : null;
  }
  if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "youtube-nocookie.com") return null;

  const v = url.searchParams.get("v");
  if (v && ID.test(v)) return v;

  const [, segment, id] = url.pathname.split("/");
  if ((segment === "embed" || segment === "shorts" || segment === "live") && id && ID.test(id)) return id;
  return null;
}

/**
 * Free, and no account needed beyond a YouTube one — but it cannot gate members-only practices
 * (the id is in the page source and the video plays on youtube.com), and it is unreachable from
 * Iran without a VPN. `youtube-nocookie.com` keeps playback out of the viewer's ad profile.
 */
export const youtubeProvider: VideoProvider = {
  id: "youtube",
  canGate: false,
  assetHint: "https://youtu.be/… or https://www.youtube.com/watch?v=…",
  parseAsset: parseYouTubeId,
  async getPlayback(assetId: string | null, _grant: PlaybackGrant): Promise<Playback> {
    const id = assetId && parseYouTubeId(assetId);
    if (!id) return { kind: "embed", src: "", title: "YouTube" };
    const params = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
    return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`, title: "YouTube" };
  },
};
