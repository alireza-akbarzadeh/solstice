import { env } from "@/env";
import { parseMediaUrl } from "../assets";

import type { PlaybackGrant, Playback, VideoProvider } from "../types";

// Open-licence stand-in (Big Buck Bunny, ~10 min) so previews and gating can be exercised.
const DEFAULT_MOCK_VIDEO =
  "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4";

/**
 * Plays whatever media URL the instructor attached, else one sample file. This is the `file`
 * family, so the custom player, chapters and timestamped reflections all work — but the preview
 * limit is enforced in the browser only, so a determined viewer could still reach the full file.
 * TODO(video): a paid provider enforces previews server-side — a separate preview rendition or
 * a signed URL that expires (Mux, Bunny Stream, Cloudflare Stream, ArvanCloud).
 */
export const mockVideoProvider: VideoProvider = {
  id: "mock",
  canGate: false,
  assetHint: "https://…/practice.mp4",
  parseAsset: parseMediaUrl,
  async getPlayback(
    assetId: string | null,
    grant: PlaybackGrant,
  ): Promise<Playback> {
    const src = assetId?.startsWith("https://")
      ? assetId
      : (env.MOCK_VIDEO_URL ?? DEFAULT_MOCK_VIDEO);
    return grant.kind === "preview"
      ? { kind: "file", src, limitSeconds: grant.limitSeconds }
      : { kind: "file", src };
  },
};
