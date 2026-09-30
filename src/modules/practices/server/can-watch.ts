import type { Session } from "@/server/better-auth/config";

import type { PracticeSummary } from "../types";

// Membership decides entitlement (README: authentication ≠ authorization ≠ membership).
// TODO(memberships): allow active members and the instructor once memberships exist.
export function canWatchPractice(practice: Pick<PracticeSummary, "access">, _session: Session | null) {
  return practice.access === "open";
}
