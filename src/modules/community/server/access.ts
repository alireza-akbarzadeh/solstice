import type { Viewer } from "@/modules/memberships/server/viewer";
import type { PracticeAccess } from "@/modules/practices/types";

export type ReflectAccess = "ok" | "signIn" | "members";

// Anyone can read reflections. Writing needs an account, and on members-only practices,
// a membership — the same people who can watch the whole practice.
export function reflectAccess(
  practice: { access: PracticeAccess },
  viewer: Pick<Viewer, "user" | "hasAccess">,
): ReflectAccess {
  if (!viewer.user) return "signIn";
  if (practice.access === "members" && !viewer.hasAccess) return "members";
  return "ok";
}
