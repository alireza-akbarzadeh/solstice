import { env } from "@/env";
import { parseVideoAsset } from "./assets";

import { aparatProvider } from "./providers/aparat";
import { mockVideoProvider } from "./providers/mock";
import { youtubeProvider } from "./providers/youtube";
import type { VideoProvider } from "./types";

export type { Playback, PlaybackGrant, VideoProvider } from "./types";

/**
 * Every provider the app can be pointed at, chosen with `VIDEO_PROVIDER` in the environment.
 * Adding a paid one later (Mux, Bunny Stream, Cloudflare Stream, ArvanCloud) means writing one
 * file next to these and adding its id here and to the env enum — nothing in the UI changes,
 * because pages only ever see `Playback`.
 *
 * Today's choices are all free and none of them can gate members-only video; see `canGate`.
 */
export const videoProviders = {
  mock: mockVideoProvider,
  youtube: youtubeProvider,
  aparat: aparatProvider,
} as const satisfies Record<string, VideoProvider>;

export type VideoProviderId = keyof typeof videoProviders;

export const videoProvider: VideoProvider = videoProviders[env.VIDEO_PROVIDER];

/** Lets the instructor paste a link from any configured provider, not just the active one. */
export function parseAssetForAnyProvider(
  input: string,
): { providerId: VideoProviderId; assetId: string } | null {
  return parseVideoAsset(input, env.VIDEO_PROVIDER);
}

/**
 * The provider that holds a given practice's video. Rows remember their own provider, so
 * switching `VIDEO_PROVIDER` later does not strand everything already published.
 */
export function providerFor(
  providerId: string | null | undefined,
): VideoProvider {
  if (!providerId) return videoProvider;
  return videoProviders[providerId as VideoProviderId] ?? videoProvider;
}
