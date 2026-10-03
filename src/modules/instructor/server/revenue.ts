import { desc, eq } from "drizzle-orm";

import { getAllPlans, planMonthlyValue } from "@/modules/memberships/server/plans";
import { db } from "@/server/db";
import { memberships, user } from "@/server/db/schema";

export type LedgerEntry = {
  id: number;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  plan: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  provider: string;
  cancelAtPeriodEnd: boolean;
  /** Price of the plan in the site currency; 0 while trialing. */
  amount: number;
  startedAt: Date;
  currentPeriodEnd: Date;
  trialEndsAt: Date | null;
};

/**
 * Every membership on record, newest first. With the mock PaymentProvider nothing was
 * actually charged, so `amount` is the plan's list price, not a settled transaction.
 */
export async function getLedger(limit = 100): Promise<LedgerEntry[]> {
  const plans = await getAllPlans();
  const rows = await db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      name: user.name,
      email: user.email,
      image: user.image,
      plan: memberships.plan,
      status: memberships.status,
      provider: memberships.provider,
      cancelAtPeriodEnd: memberships.cancelAtPeriodEnd,
      startedAt: memberships.createdAt,
      currentPeriodEnd: memberships.currentPeriodEnd,
      trialEndsAt: memberships.trialEndsAt,
    })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .orderBy(desc(memberships.createdAt))
    .limit(limit);

  const price = (id: string) => plans.find((p) => p.id === id)?.price ?? 0;
  return rows.map((r) => ({ ...r, amount: r.status === "trialing" ? 0 : price(r.plan) }));
}

export type RevenueMonth = { month: string; started: number; active: number; mrr: number };

/**
 * Twelve months of membership growth. A membership counts as active in a month when it
 * began on or before the month's end and its paid-through date had not passed.
 */
export async function getRevenueSeries(months = 12): Promise<RevenueMonth[]> {
  const plans = await getAllPlans();
  const rows = await db
    .select({
      plan: memberships.plan,
      status: memberships.status,
      createdAt: memberships.createdAt,
      currentPeriodEnd: memberships.currentPeriodEnd,
    })
    .from(memberships);

  const now = new Date();
  const series: RevenueMonth[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
    let started = 0;
    let active = 0;
    let mrr = 0;

    for (const r of rows) {
      if (r.createdAt >= start && r.createdAt < end) started++;
      if (r.createdAt < end && r.currentPeriodEnd >= start) {
        active++;
        if (r.status !== "trialing") mrr += planMonthlyValue(plans, r.plan);
      }
    }
    series.push({ month: start.toISOString().slice(0, 7), started, active, mrr: Math.round(mrr * 100) / 100 });
  }

  return series;
}

/** Retention and churn across every membership ever started. */
export async function getChurn() {
  const rows = await db.select({ status: memberships.status, cancelAtPeriodEnd: memberships.cancelAtPeriodEnd }).from(memberships);
  const total = rows.length;
  const canceled = rows.filter((r) => r.status === "canceled").length;
  const leaving = rows.filter((r) => r.status !== "canceled" && r.cancelAtPeriodEnd).length;
  return { total, canceled, leaving, retentionPercent: total === 0 ? 0 : Math.round(((total - canceled) / total) * 1000) / 10 };
}
