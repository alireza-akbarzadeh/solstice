import { eq } from "drizzle-orm";

import { env } from "@/env";
import { paymentProvider } from "@/infrastructure/payment";
import { db } from "@/server/db";
import { memberships, user } from "@/server/db/schema";

import type { MembershipPreset } from "../test-presets";

// Test mode exists only while payments are mocked: it lets anyone reshape their *own*
// account to try every state of the app. It disappears once a real provider is set.
export const testModeEnabled = () => paymentProvider.testMode;

export function assertTestMode() {
  if (!testModeEnabled()) throw new Error("Test mode is off: a real payment provider is configured.");
}

/** Every one-click test account uses this password, so you can sign back in to it. */
export const TEST_PASSWORD = "solstice-test";

export const testCards = {
  approved: "4242424242424242",
  declined: "4000000000000002",
} as const;

const DAY = 24 * 60 * 60 * 1000;

export async function applyMembershipPreset(
  userId: string,
  preset: MembershipPreset,
  plan: { id: string; trialDays: number },
) {
  const trialDays = plan.trialDays || 14;
  assertTestMode();
  if (preset === "none") {
    await db.delete(memberships).where(eq(memberships.userId, userId));
    return;
  }

  const now = Date.now();
  const values = {
    trial: { status: "trialing", end: now + trialDays * DAY, cancel: false },
    active: { status: "active", end: now + 30 * DAY, cancel: false },
    canceling: { status: "active", end: now + 5 * DAY, cancel: true },
    pastDue: { status: "past_due", end: now + 3 * DAY, cancel: false },
    expired: { status: "canceled", end: now - DAY, cancel: false },
  }[preset];

  const row = {
    plan: plan.id,
    status: values.status as "trialing" | "active" | "past_due" | "canceled",
    provider: paymentProvider.id,
    providerSubscriptionId: `mock_${userId}`,
    trialEndsAt: preset === "trial" ? new Date(values.end) : null,
    currentPeriodEnd: new Date(values.end),
    cancelAtPeriodEnd: values.cancel,
  };
  await db
    .insert(memberships)
    .values({ userId, ...row })
    .onConflictDoUpdate({ target: memberships.userId, set: row });
}

export async function setUserRole(userId: string, role: "member" | "instructor") {
  assertTestMode();
  await db.update(user).set({ role }).where(eq(user.id, userId));
}

/** Hosted-checkout return URLs must point back at this site. */
export function sameSiteUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === new URL(env.BETTER_AUTH_URL).origin ? url.toString() : null;
  } catch {
    return null;
  }
}
