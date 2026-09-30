import type { BillingPlan } from "@/infrastructure/payment";

// TODO(memberships): replace with MembershipPlan rows once pricing is managed in the app.
// Single source for displayed prices — the Stitch screens disagree ($24 vs $48 / month).
export const sanctuaryPlan = {
  monthlyUsd: 24,
  annualUsd: 220,
  trialDays: 14,
} as const;

export const billingPlans: Record<BillingPlan, { priceUsd: number; interval: "month" | "year"; monthlyEquivalentUsd: number }> = {
  monthly: { priceUsd: sanctuaryPlan.monthlyUsd, interval: "month", monthlyEquivalentUsd: sanctuaryPlan.monthlyUsd },
  annual: {
    priceUsd: sanctuaryPlan.annualUsd,
    interval: "year",
    monthlyEquivalentUsd: Math.round((sanctuaryPlan.annualUsd / 12) * 100) / 100,
  },
};

export const isBillingPlan = (value: unknown): value is BillingPlan => value === "monthly" || value === "annual";
