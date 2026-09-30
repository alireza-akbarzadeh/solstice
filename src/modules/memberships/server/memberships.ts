import { eq } from "drizzle-orm";

import type { BillingPlan } from "@/infrastructure/payment";
import { db } from "@/server/db";
import { memberships } from "@/server/db/schema";

export type Membership = typeof memberships.$inferSelect;

const DAY = 24 * 60 * 60 * 1000;

/** Trialing and active memberships grant access until the paid-through date. */
export function isMembershipActive(membership: Membership | null | undefined, now = new Date()) {
  if (!membership) return false;
  if (membership.status !== "trialing" && membership.status !== "active") return false;
  return membership.currentPeriodEnd > now;
}

export async function getMembership(userId: string): Promise<Membership | null> {
  const [row] = await db.select().from(memberships).where(eq(memberships.userId, userId)).limit(1);
  return row ?? null;
}

// Starts (or restarts) a membership with a free trial. Called after the provider confirms checkout.
export async function startMembership(input: {
  userId: string;
  plan: BillingPlan;
  provider: string;
  providerSubscriptionId: string;
  trialDays: number;
}) {
  const trialEndsAt = new Date(Date.now() + input.trialDays * DAY);
  const values = {
    plan: input.plan,
    status: "trialing" as const,
    provider: input.provider,
    providerSubscriptionId: input.providerSubscriptionId,
    trialEndsAt,
    currentPeriodEnd: trialEndsAt,
    cancelAtPeriodEnd: false,
  };
  await db
    .insert(memberships)
    .values({ userId: input.userId, ...values })
    .onConflictDoUpdate({ target: memberships.userId, set: values });
}

export async function setPlan(userId: string, plan: BillingPlan) {
  await db.update(memberships).set({ plan }).where(eq(memberships.userId, userId));
}

// Cancellation keeps access until the period ends, as promised on the checkout page.
export async function setCancelAtPeriodEnd(userId: string, cancel: boolean) {
  await db.update(memberships).set({ cancelAtPeriodEnd: cancel }).where(eq(memberships.userId, userId));
}
