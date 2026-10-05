import { and, count, desc, eq, gte, ilike, isNull, ne, notExists, or, sql, sum } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { MembershipPlan } from "@/modules/memberships/plans";
import { getAllPlans, planMonthlyValue } from "@/modules/memberships/server/plans";
import { countWaiting } from "@/modules/conversations/server/conversations";
import { db } from "@/server/db";
import { countPendingReflections } from "@/modules/community/server/reflections";
import { comments, memberships, practiceCompletions, practices, user } from "@/server/db/schema";

const DAY = 24 * 60 * 60 * 1000;
const since = (days: number) => new Date(Date.now() - days * DAY);

// Top-level reflections that ask the instructor something (private, or tagged as an
// inquiry) and have no instructor reply yet. Aliased through drizzle rather than hand-written
// SQL, so the correlated subqueries use the real (camelCase) column names.
const reply = alias(comments, "reply");
const replier = alias(user, "replier");
const asker = alias(user, "asker");

const awaitingReply = and(
  isNull(comments.parentId),
  ne(comments.status, "rejected"),
  or(eq(comments.visibility, "private"), eq(comments.tag, "inquiry")),
  notExists(
    db
      .select({ one: sql`1` })
      .from(reply)
      .innerJoin(replier, eq(replier.id, reply.userId))
      .where(and(eq(reply.parentId, comments.id), eq(replier.role, "instructor"))),
  ),
  notExists(
    db
      .select({ one: sql`1` })
      .from(asker)
      .where(and(eq(asker.id, comments.userId), eq(asker.role, "instructor"))),
  ),
);

export async function getAwaitingReplyIds(limit = 50) {
  const rows = await db
    .select({ id: comments.id })
    .from(comments)
    .where(awaitingReply)
    .orderBy(desc(comments.createdAt))
    .limit(limit);
  return rows.map((r) => r.id);
}

/** Counts the sidebar shows beside sections, so waiting work is visible without opening a page. */
export async function getStudioBadges() {
  const [[drafts], awaiting, review, inbox] = await Promise.all([
    db.select({ n: count() }).from(practices).where(eq(practices.status, "draft")),
    getAwaitingReplyIds(),
    countPendingReflections(),
    countWaiting(),
  ]);
  // Community work: reflections to approve plus questions to answer. Inbox: conversations waiting for a person.
  return { drafts: drafts?.n ?? 0, awaiting: awaiting.length, review, community: review + awaiting.length, inbox };
}

/** Memberships that grant access now, split by plan and state. */
export async function getMembershipCounts() {
  const rows = await db
    .select({ plan: memberships.plan, status: memberships.status, cancelAtPeriodEnd: memberships.cancelAtPeriodEnd, n: count() })
    .from(memberships)
    .where(gte(memberships.currentPeriodEnd, new Date()))
    .groupBy(memberships.plan, memberships.status, memberships.cancelAtPeriodEnd);

  const tally = { trialing: 0, paying: 0, canceling: 0, pastDue: 0, byPlan: {} as Record<string, number> };
  for (const r of rows) {
    if (r.status === "past_due") tally.pastDue += r.n;
    else if (r.status === "trialing") tally.trialing += r.n;
    else if (r.status === "active") {
      tally.paying += r.n;
      tally.byPlan[r.plan] = (tally.byPlan[r.plan] ?? 0) + r.n;
      if (r.cancelAtPeriodEnd) tally.canceling += r.n;
    }
  }
  return tally;
}

/** Recurring revenue projected from paying memberships (trials excluded), in the site currency. */
export function projectRevenue(counts: Awaited<ReturnType<typeof getMembershipCounts>>, plans: MembershipPlan[]) {
  const mrr = Object.entries(counts.byPlan).reduce((sum, [id, n]) => sum + n * planMonthlyValue(plans, id), 0);
  return { mrr, arr: mrr * 12 };
}

export async function getStudioOverview() {
  const [[members], [newMembers], [sessions], [reflections], awaiting, counts, recent, plans] = await Promise.all([
    db.select({ n: count() }).from(user),
    db.select({ n: count() }).from(user).where(gte(user.createdAt, since(30))),
    db
      .select({ n: count(), minutes: sum(practiceCompletions.minutes) })
      .from(practiceCompletions)
      .where(gte(practiceCompletions.completedAt, since(7))),
    db.select({ n: count() }).from(comments).where(gte(comments.createdAt, since(7))),
    getAwaitingReplyIds(),
    getMembershipCounts(),
    db.select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }).from(user).orderBy(desc(user.createdAt)).limit(6),
    getAllPlans(),
  ]);

  return {
    accounts: members?.n ?? 0,
    newAccounts: newMembers?.n ?? 0,
    sessions7d: sessions?.n ?? 0,
    minutes7d: Number(sessions?.minutes ?? 0),
    reflections7d: reflections?.n ?? 0,
    awaiting: awaiting.length,
    counts,
    revenue: projectRevenue(counts, plans),
    recent,
  };
}

export type MemberRow = Awaited<ReturnType<typeof listMembers>>[number];

/** Everyone with an account, newest first, with membership and practice activity. */
export async function listMembers(query?: string) {
  const q = query?.trim();
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      plan: memberships.plan,
      status: memberships.status,
      currentPeriodEnd: memberships.currentPeriodEnd,
      cancelAtPeriodEnd: memberships.cancelAtPeriodEnd,
      sessions: sql<number>`(select count(*)::int from ${practiceCompletions} where ${practiceCompletions.userId} = ${user.id})`,
      lastPracticeAt: sql<Date | null>`(select max(${practiceCompletions.completedAt}) from ${practiceCompletions} where ${practiceCompletions.userId} = ${user.id})`,
    })
    .from(user)
    .leftJoin(memberships, eq(memberships.userId, user.id))
    .where(q ? or(ilike(user.name, `%${q}%`), ilike(user.email, `%${q}%`)) : undefined)
    .orderBy(desc(user.createdAt))
    .limit(200);
}
