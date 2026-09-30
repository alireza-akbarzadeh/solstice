import type { PlaybackGrant } from "@/infrastructure/video";
import type { Viewer } from "@/modules/memberships/server/viewer";

import type { PracticeAccess } from "../types";

export type PlaybackAccess =
  | { mode: "full" }
  | { mode: "preview"; limitSeconds: number }
  /** Members-only with no preview configured. */
  | { mode: "locked" };

// Open practices: everyone. Members-only: entitled viewers get everything, everyone else
// the configured preview (or nothing).
export function resolvePracticeAccess(
  practice: { access: PracticeAccess; previewSeconds?: number },
  viewer: Pick<Viewer, "hasAccess">,
): PlaybackAccess {
  if (practice.access === "open" || viewer.hasAccess) return { mode: "full" };
  if (practice.previewSeconds && practice.previewSeconds > 0) {
    return { mode: "preview", limitSeconds: practice.previewSeconds };
  }
  return { mode: "locked" };
}

export function toPlaybackGrant(access: Exclude<PlaybackAccess, { mode: "locked" }>): PlaybackGrant {
  return access.mode === "full" ? { kind: "full" } : { kind: "preview", limitSeconds: access.limitSeconds };
}
