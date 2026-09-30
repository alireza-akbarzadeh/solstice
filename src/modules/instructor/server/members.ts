import { desc, eq, sql } from "drizzle-orm";

import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import type { BillingPlan } from "@/infrastructure/payment";
import { db } from "@/server/db";
import { comments, favorites, memberships, practiceCompletions, practices, user } from "@/server/db/schema";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Gives a member paid access for `months` without a payment — the studio's comped pass.
 * Recorded against the "studio" provider so it is never mistaken for a provider subscription.
 */
export async function grantAccess(userId: string, plan: BillingPlan, months: number) {
  const current = await db.select({ end: memberships.currentPeriodEnd }).from(memberships).where(eq(memberships.userId, userId)).limit(1);
  // Extend from the existing paid-through date when it is still in the future, so a gift adds on.
  const from = current[0]?.end && current[0].end > new Date() ? current[0].end : new Date();
  const currentPeriodEnd = new Date(from.getTime() + months * 30 * DAY);

  const values = {
    plan,
    status: "active" as const,
    provider: "studio",
    providerSubscriptionId: null,
    trialEndsAt: null,
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
  };
  await db.insert(memberships).values({ userId, ...values }).onConflictDoUpdate({ target: memberships.userId, set: values });
}

/** Ends access now: the member keeps their account, history and saves. */
export async function endAccess(userId: string) {
  await db
    .update(memberships)
    .set({ status: "canceled", cancelAtPeriodEnd: true, currentPeriodEnd: new Date() })
    .where(eq(memberships.userId, userId));
}

export async function setMemberRole(userId: string, role: "member" | "instructor") {
  await db.update(user).set({ role }).where(eq(user.id, userId));
}

export type MemberDossier = NonNullable<Awaited<ReturnType<typeof getMemberDossier>>>;

/** Everything the members page shows in its side panel for one person. */
export async function getMemberDossier(locale: Locale, userId: string) {
  const [account] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      emailVerified: user.emailVerified,
      practiceRhythm: user.practiceRhythm,
      marketingOptIn: user.marketingOptIn,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!account) return null;

  const [membership, totals, sessions, reflections] = await Promise.all([
    db.select().from(memberships).where(eq(memberships.userId, userId)).limit(1),
    db
      .select({
        sessions: sql<number>`count(*)::int`,
        minutes: sql<number>`coalesce(sum(${practiceCompletions.minutes}), 0)::int`,
      })
      .from(practiceCompletions)
      .where(eq(practiceCompletions.userId, userId)),
    db
      .select({
        practiceSlug: practiceCompletions.practiceSlug,
        title: practices.title,
        minutes: practiceCompletions.minutes,
        completedAt: practiceCompletions.completedAt,
      })
      .from(practiceCompletions)
      .leftJoin(practices, eq(practices.slug, practiceCompletions.practiceSlug))
      .where(eq(practiceCompletions.userId, userId))
      .orderBy(desc(practiceCompletions.completedAt))
      .limit(6),
    db
      .select({ id: comments.id, body: comments.body, visibility: comments.visibility, createdAt: comments.createdAt, practiceSlug: comments.practiceSlug })
      .from(comments)
      .where(eq(comments.userId, userId))
      .orderBy(desc(comments.createdAt))
      .limit(4),
  ]);

  const [saves] = await db.select({ n: sql<number>`count(*)::int` }).from(favorites).where(eq(favorites.userId, userId));

  return {
    account,
    membership: membership[0] ?? null,
    sessions: totals[0]?.sessions ?? 0,
    minutes: totals[0]?.minutes ?? 0,
    saves: saves?.n ?? 0,
    recent: sessions.map((s) => ({ ...s, title: s.title ? localize(s.title, locale) : s.practiceSlug })),
    reflections,
  };
}
