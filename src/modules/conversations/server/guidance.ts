import { and, count, eq, gt, inArray, isNull } from "drizzle-orm";
import { cache } from "react";

import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import type { MembershipPlan } from "@/modules/memberships/plans";
import { isMembershipActive } from "@/modules/memberships/server/memberships";
import { getAllPlans } from "@/modules/memberships/server/plans";
import type { Viewer } from "@/modules/memberships/server/viewer";
import { db } from "@/server/db";
import { guidanceWaitlist, memberships } from "@/server/db/schema";

import type { GuidancePlaces } from "../types";

// 1:1 guidance is a feature of a plan, with a number of places: while every place is taken the
// plan isn't sold (new members can join its waitlist), and members on it can ask the instructor.

/** Members holding each guidance plan now (trialing or active, not past the paid-through date). */
export const getGuidancePlaces = cache(async (locale: Locale = "en"): Promise<GuidancePlaces[]> => {
  const plans = (await getAllPlans()).filter((plan) => plan.guidance);
  if (!plans.length) return [];
  const ids = plans.map((plan) => plan.id);
  const [held, waiting] = await Promise.all([
    db
      .select({ plan: memberships.plan, n: count() })
      .from(memberships)
      .where(
        and(
          inArray(memberships.plan, ids),
          inArray(memberships.status, ["trialing", "active"]),
          gt(memberships.currentPeriodEnd, new Date()),
        ),
      )
      .groupBy(memberships.plan),
    db
      .select({ plan: guidanceWaitlist.planId, n: count() })
      .from(guidanceWaitlist)
      .where(and(inArray(guidanceWaitlist.planId, ids), isNull(guidanceWaitlist.notifiedAt)))
      .groupBy(guidanceWaitlist.planId),
  ]);
  const used = new Map(held.map((row) => [row.plan, row.n]));
  const queued = new Map(waiting.map((row) => [row.plan, row.n]));
  return plans.map((plan) => ({
    planId: plan.id,
    name: localize(plan.name, locale) || plan.id,
    places: plan.guidancePlaces,
    used: used.get(plan.id) ?? 0,
    waitlist: queued.get(plan.id) ?? 0,
  }));
});

export const isFull = (places: Pick<GuidancePlaces, "places" | "used">) => places.places > 0 && places.used >= places.places;

/** Plans that can't be sold right now because every guidance place is taken. */
export async function getFullPlanIds(): Promise<Set<string>> {
  return new Set((await getGuidancePlaces()).filter(isFull).map((p) => p.planId));
}

/**
 * Can this plan take one more member? `userId` already on the plan keeps their place (renewing,
 * or switching back) — only newcomers count against it.
 */
export async function hasPlaceFor(plan: Pick<MembershipPlan, "id" | "guidance">, current?: { plan: string } | null) {
  if (!plan.guidance || current?.plan === plan.id) return true;
  return !(await getFullPlanIds()).has(plan.id);
}

/** The instructor always; a member while their membership is active on a plan with guidance. */
export async function hasGuidanceAccess(viewer: Viewer) {
  if (!viewer.user) return false;
  if (viewer.user.role === "instructor") return true;
  if (!isMembershipActive(viewer.membership)) return false;
  const plan = (await getAllPlans()).find((p) => p.id === viewer.membership!.plan);
  return !!plan?.guidance;
}

/** Puts a member on a full plan's waitlist (once). */
export async function joinWaitlist(planId: string, userId: string) {
  await db
    .insert(guidanceWaitlist)
    .values({ planId, userId })
    .onConflictDoUpdate({ target: [guidanceWaitlist.planId, guidanceWaitlist.userId], set: { notifiedAt: null } });
}

export async function isOnWaitlist(planId: string, userId: string) {
  const [row] = await db
    .select({ id: guidanceWaitlist.id })
    .from(guidanceWaitlist)
    .where(and(eq(guidanceWaitlist.planId, planId), eq(guidanceWaitlist.userId, userId), isNull(guidanceWaitlist.notifiedAt)))
    .limit(1);
  return !!row;
}
