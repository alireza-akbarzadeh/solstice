import { eq } from "drizzle-orm";

import { providerFor } from "@/infrastructure/payment";
import { db } from "@/server/db";
import { memberships } from "@/server/db/schema";

import { addBillingPeriod, addDays } from "../plans";

export type Membership = typeof memberships.$inferSelect;

/** Trialing and active memberships grant access until the paid-through date. */
export function isMembershipActive(membership: Membership | null | undefined, now = new Date()) {
  if (!membership) return false;
  if (membership.status !== "trialing" && membership.status !== "active") return false;
  return membership.currentPeriodEnd > now;
}

/**
 * Paid through a gateway that doesn't renew by itself (Zarinpal): the member pays each period
 * with "Renew" instead of being charged, so "cancel" and "resume" don't apply.
 */
export function renewsByHand(membership: Pick<Membership, "provider"> | null | undefined) {
  return providerFor(membership?.provider)?.recurring === false;
}

export async function getMembership(userId: string): Promise<Membership | null> {
  const [row] = await db.select().from(memberships).where(eq(memberships.userId, userId)).limit(1);
  return row ?? null;
}

// Starts (or restarts) a membership. Called after the provider confirms checkout. A plan with a
// free trial starts trialing until the trial ends; without one, the first period is paid.
export async function startMembership(input: {
  userId: string;
  planId: string;
  intervalMonths: number;
  provider: string;
  providerSubscriptionId: string;
  trialDays: number;
}) {
  const now = new Date();
  const trialEndsAt = input.trialDays > 0 ? addDays(now, input.trialDays) : null;
  const values = {
    plan: input.planId,
    status: trialEndsAt ? ("trialing" as const) : ("active" as const),
    provider: input.provider,
    providerSubscriptionId: input.providerSubscriptionId,
    trialEndsAt,
    currentPeriodEnd: trialEndsAt ?? addBillingPeriod(now, input.intervalMonths),
    cancelAtPeriodEnd: false,
  };
  await db
    .insert(memberships)
    .values({ userId: input.userId, ...values })
    .onConflictDoUpdate({ target: memberships.userId, set: values });
}

export async function setPlan(userId: string, planId: string) {
  await db.update(memberships).set({ plan: planId }).where(eq(memberships.userId, userId));
}

// Cancellation keeps access until the period ends, as promised on the checkout page.
export async function setCancelAtPeriodEnd(userId: string, cancel: boolean) {
  await db.update(memberships).set({ cancelAtPeriodEnd: cancel }).where(eq(memberships.userId, userId));
}
