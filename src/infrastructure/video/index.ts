import { env } from "@/env";

// VideoProvider boundary (README: providers stay replaceable). Videos never live in Postgres.

export type PlaybackGrant = { kind: "full" } | { kind: "preview"; limitSeconds: number };

export type Playback = {
  src: string;
  /** Set for previews: the player stops here and shows the membership gate. */
  limitSeconds?: number;
};

export interface VideoProvider {
  id: string;
  /** `assetId` is the practice's videoAssetId, or null when none is attached yet. */
  getPlayback(assetId: string | null, grant: PlaybackGrant): Promise<Playback>;
}

// Open-licence stand-in (Big Buck Bunny, ~10 min) so previews and gating can be exercised.
const DEFAULT_MOCK_VIDEO = "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4";

/**
 * Plays the practice's video URL when the instructor attached one, else one sample file. The preview limit is enforced by the player
 * only, so a determined viewer could reach the full file.
 * TODO(video): a real provider must enforce previews server-side — a separate preview
 * rendition or a signed URL that expires/ends at `limitSeconds` (Mux, Cloudflare Stream, …).
 */
const mockVideoProvider: VideoProvider = {
  id: "mock",
  async getPlayback(assetId, grant) {
    const src = assetId?.startsWith("https://") ? assetId : (env.MOCK_VIDEO_URL ?? DEFAULT_MOCK_VIDEO);
    return grant.kind === "preview" ? { src, limitSeconds: grant.limitSeconds } : { src };
  },
};

export const videoProvider: VideoProvider = mockVideoProvider;
