import type { PlaybackGrant, Playback, VideoProvider } from "../types";
import { parseYouTubeId } from "../assets";
export { parseYouTubeId } from "../assets";

/** youtu.be/ID, /watch?v=ID, /embed/ID, /shorts/ID, or a bare 11-character id. */

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
  async getPlayback(
    assetId: string | null,
    _grant: PlaybackGrant,
  ): Promise<Playback> {
    const id = assetId && parseYouTubeId(assetId);
    if (!id) return { kind: "embed", src: "", title: "YouTube" };
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      enablejsapi: "1",
    });
    return {
      kind: "embed",
      src: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
      title: "YouTube",
    };
  },
};
