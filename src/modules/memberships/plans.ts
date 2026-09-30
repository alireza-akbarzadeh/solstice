// TODO(memberships): replace with MembershipPlan rows once billing exists.
// Single source for displayed prices — the Stitch screens disagree ($24 vs $48 / month).
export const sanctuaryPlan = {
  monthlyUsd: 24,
  annualUsd: 220,
  trialDays: 14,
} as const;
