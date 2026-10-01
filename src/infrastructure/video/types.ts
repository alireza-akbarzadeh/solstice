// VideoProvider boundary (README: providers stay replaceable). Videos never live in Postgres.

export type PlaybackGrant = { kind: "full" } | { kind: "preview"; limitSeconds: number };

/**
 * Two shapes of playback, because providers split into two families:
 *
 * - `file` — we get a media URL and drive our own <video>: chapters seek it, reflections carry
 *   timestamps, completion fires on `ended`, and a preview can be cut short.
 * - `embed` — the provider's own player in an iframe (YouTube, Aparat). We hand over control,
 *   so chapter seeking, timestamped reflections and preview cut-off do not apply.
 */
export type Playback =
  | { kind: "file"; src: string; limitSeconds?: number }
  | { kind: "embed"; src: string; title: string };

export interface VideoProvider {
  id: string;
  /**
   * Whether this provider can actually withhold a members-only video. An embed URL is readable
   * in the page source and the video is public on the platform, so embed providers cannot: the
   * practice page says so rather than implying a gate that isn't there.
   */
  readonly canGate: boolean;
  /**
   * Turns whatever the instructor pasted into the value stored in `practice.videoAssetId`, or
   * null when this provider can't read it. Keeps URL parsing next to the provider that owns it.
   */
  parseAsset(input: string): string | null;
  /** A human hint for the editor: what to paste. */
  readonly assetHint: string;
  /** `assetId` is the practice's videoAssetId, or null when none is attached yet. */
  getPlayback(assetId: string | null, grant: PlaybackGrant): Promise<Playback>;
}
