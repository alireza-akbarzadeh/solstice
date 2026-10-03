import { asc, count, eq, max, ne } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/server/db";
import { membershipPlans, memberships, settings } from "@/server/db/schema";

import {
  DEFAULT_CURRENCY,
  isCurrency,
  monthlyEquivalent,
  type Currency,
  type MembershipPlan,
} from "../plans";
import type { PlanFields } from "../plan-schemas";

const toPlan = (row: typeof membershipPlans.$inferSelect): MembershipPlan => ({
  id: row.id,
  status: row.status,
  featured: row.featured,
  sortOrder: row.sortOrder,
  name: row.name,
  description: row.description,
  badge: row.badge,
  features: row.features,
  price: row.price,
  intervalMonths: row.intervalMonths,
  trialDays: row.trialDays,
});

/**
 * Every plan, in the studio's order. A missing table (a database that hasn't run
 * `pnpm db:seed:plans`) reads as "no plans" so public pages still render.
 */
export const getAllPlans = cache(async (): Promise<MembershipPlan[]> => {
  try {
    const rows = await db
      .select()
      .from(membershipPlans)
      .orderBy(asc(membershipPlans.sortOrder), asc(membershipPlans.createdAt));
    return rows.map(toPlan);
  } catch (error) {
    console.error(
      "Membership plans could not be read — run `pnpm db:seed:plans`.",
      error,
    );
    return [];
  }
});

export async function getPlan(id: string) {
  return (await getAllPlans()).find((plan) => plan.id === id) ?? null;
}

export const getBillingSettings = cache(
  async (): Promise<{ currency: Currency }> => {
    try {
      const [row] = await db
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, "billing"))
        .limit(1);
      const currency = row?.value.currency;
      return { currency: isCurrency(currency) ? currency : DEFAULT_CURRENCY };
    } catch {
      return { currency: DEFAULT_CURRENCY };
    }
  },
);

export type PlanCatalog = Awaited<ReturnType<typeof getPlanCatalog>>;

/**
 * What the public site sells: active plans, the recommended one (preselected at checkout,
 * and whose trial the marketing copy quotes), and the entry plan (shortest period, then
 * cheapest) that "from …" prices quote.
 */
export const getPlanCatalog = cache(async () => {
  const [all, billing] = await Promise.all([
    getAllPlans(),
    getBillingSettings(),
  ]);
  const plans = all.filter((plan) => plan.status === "active");
  const featured = plans.find((plan) => plan.featured) ?? plans[0] ?? null;
  const entry =
    [...plans].sort(
      (a, b) => a.intervalMonths - b.intervalMonths || a.price - b.price,
    )[0] ?? null;
  return {
    plans,
    currency: billing.currency,
    featured,
    entry,
    trialDays: featured?.trialDays ?? 0,
  };
});

/** How many memberships (of any state) sit on each plan; a plan with any can't be deleted. */
export async function getPlanUsage() {
  const rows = await db
    .select({ plan: memberships.plan, n: count() })
    .from(memberships)
    .groupBy(memberships.plan);
  return Object.fromEntries(rows.map((row) => [row.plan, row.n])) as Record<
    string,
    number
  >;
}

/** Monthly recurring revenue for a plan id, or 0 for an id no longer in the catalogue. */
export function planMonthlyValue(plans: MembershipPlan[], id: string) {
  const plan = plans.find((p) => p.id === id);
  return plan ? monthlyEquivalent(plan) : 0;
}

// ── Studio mutations ────────────────────────────────────────────────────────────────

export type PlanMutation =
  | { ok: true; id: string }
  | { ok: false; error: "notFound" | "inUse" | "lastActive" };

/** Only one plan is recommended at a time. */
async function clearFeatured(except: string) {
  await db
    .update(membershipPlans)
    .set({ featured: false })
    .where(ne(membershipPlans.id, except));
}

export async function createPlan(fields: PlanFields): Promise<PlanMutation> {
  const base =
    fields.name.en
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "plan";
  // New plans go to the end of the list.
  const [last] = await db
    .select({ top: max(membershipPlans.sortOrder) })
    .from(membershipPlans);
  const sortOrder = (last?.top ?? -1) + 1;

  for (let attempt = 0; attempt < 100; attempt++) {
    const id = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const [created] = await db
      .insert(membershipPlans)
      .values({ id, ...fields, sortOrder })
      .onConflictDoNothing()
      .returning({ id: membershipPlans.id });
    if (created) {
      if (fields.featured) await clearFeatured(created.id);
      return { ok: true, id: created.id };
    }
  }
  throw new Error("Could not allocate a plan id");
}

export async function updatePlan(
  id: string,
  fields: PlanFields,
): Promise<PlanMutation> {
  if (fields.status === "hidden" && (await isLastActive(id)))
    return { ok: false, error: "lastActive" };
  const [updated] = await db
    .update(membershipPlans)
    .set(fields)
    .where(eq(membershipPlans.id, id))
    .returning({ id: membershipPlans.id });
  if (!updated) return { ok: false, error: "notFound" };
  if (fields.featured) await clearFeatured(id);
  return { ok: true, id };
}

async function isLastActive(id: string) {
  const active = (
    await db
      .select({ id: membershipPlans.id })
      .from(membershipPlans)
      .where(eq(membershipPlans.status, "active"))
  ).map((r) => r.id);
  return active.length === 1 && active[0] === id;
}

export async function setPlanStatus(
  id: string,
  status: "active" | "hidden",
): Promise<PlanMutation> {
  if (status === "hidden" && (await isLastActive(id)))
    return { ok: false, error: "lastActive" };
  const [updated] = await db
    .update(membershipPlans)
    .set(status === "hidden" ? { status, featured: false } : { status })
    .where(eq(membershipPlans.id, id))
    .returning({ id: membershipPlans.id });
  return updated ? { ok: true, id } : { ok: false, error: "notFound" };
}

export async function setPlanFeatured(id: string): Promise<PlanMutation> {
  const [updated] = await db
    .update(membershipPlans)
    .set({ featured: true, status: "active" })
    .where(eq(membershipPlans.id, id))
    .returning({ id: membershipPlans.id });
  if (!updated) return { ok: false, error: "notFound" };
  await clearFeatured(id);
  return { ok: true, id };
}

/** Swaps a plan with its neighbour in the display order. */
export async function movePlan(
  id: string,
  direction: -1 | 1,
): Promise<PlanMutation> {
  const plans = await getOrderedIds();
  const index = plans.indexOf(id);
  if (index === -1) return { ok: false, error: "notFound" };
  const target = index + direction;
  if (target < 0 || target >= plans.length) return { ok: true, id };
  [plans[index], plans[target]] = [plans[target]!, plans[index]!];
  await db.transaction(async (tx) => {
    for (const [order, planId] of plans.entries()) {
      await tx
        .update(membershipPlans)
        .set({ sortOrder: order })
        .where(eq(membershipPlans.id, planId));
    }
  });
  return { ok: true, id };
}

async function getOrderedIds() {
  const rows = await db
    .select({ id: membershipPlans.id })
    .from(membershipPlans)
    .orderBy(asc(membershipPlans.sortOrder), asc(membershipPlans.createdAt));
  return rows.map((row) => row.id);
}

/** Members' memberships point at the plan id, so a plan in use can only be hidden. */
export async function deletePlan(id: string): Promise<PlanMutation> {
  const [usage] = await db
    .select({ n: count() })
    .from(memberships)
    .where(eq(memberships.plan, id));
  if ((usage?.n ?? 0) > 0) return { ok: false, error: "inUse" };
  if (await isLastActive(id)) return { ok: false, error: "lastActive" };
  const removed = await db
    .delete(membershipPlans)
    .where(eq(membershipPlans.id, id))
    .returning({ id: membershipPlans.id });
  return removed.length ? { ok: true, id } : { ok: false, error: "notFound" };
}

export async function setCurrency(currency: Currency) {
  await db
    .insert(settings)
    .values({ key: "billing", value: { currency } })
    .onConflictDoUpdate({ target: settings.key, set: { value: { currency } } });
}
