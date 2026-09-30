import { and, count, desc, eq, gte, ilike, isNull, or, sql, sum } from "drizzle-orm";

import { billingPlans } from "@/modules/memberships/plans";
import { db } from "@/server/db";
import { comments, memberships, practiceCompletions, user } from "@/server/db/schema";

const DAY = 24 * 60 * 60 * 1000;
const since = (days: number) => new Date(Date.now() - days * DAY);

// Top-level reflections that ask the instructor something (private, or tagged as an
// inquiry) and have no instructor reply yet.
const awaitingReply = and(
  isNull(comments.parentId),
  or(eq(comments.visibility, "private"), eq(comments.tag, "inquiry")),
  sql`not exists (select 1 from ${comments} r join ${user} u on u.id = r.user_id where r.parent_id = ${comments.id} and u.role = 'instructor')`,
  sql`not exists (select 1 from ${user} a where a.id = ${comments.userId} and a.role = 'instructor')`,
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

/** Memberships that grant access now, split by plan and state. */
export async function getMembershipCounts() {
  const rows = await db
    .select({ plan: memberships.plan, status: memberships.status, cancelAtPeriodEnd: memberships.cancelAtPeriodEnd, n: count() })
    .from(memberships)
    .where(gte(memberships.currentPeriodEnd, new Date()))
    .groupBy(memberships.plan, memberships.status, memberships.cancelAtPeriodEnd);

  const tally = { trialing: 0, monthly: 0, annual: 0, canceling: 0, pastDue: 0 };
  for (const r of rows) {
    if (r.status === "past_due") tally.pastDue += r.n;
    else if (r.status === "trialing") tally.trialing += r.n;
    else if (r.status === "active") {
      tally[r.plan] += r.n;
      if (r.cancelAtPeriodEnd) tally.canceling += r.n;
    }
  }
  return tally;
}

/** Recurring revenue projected from paying memberships (trials excluded), in USD. */
export function projectRevenue(counts: Awaited<ReturnType<typeof getMembershipCounts>>) {
  const mrr = counts.monthly * billingPlans.monthly.priceUsd + (counts.annual * billingPlans.annual.priceUsd) / 12;
  return { mrr, arr: mrr * 12 };
}

export async function getStudioOverview() {
  const [[members], [newMembers], [sessions], [reflections], awaiting, counts, recent] = await Promise.all([
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
  ]);

  return {
    accounts: members?.n ?? 0,
    newAccounts: newMembers?.n ?? 0,
    sessions7d: sessions?.n ?? 0,
    minutes7d: Number(sessions?.minutes ?? 0),
    reflections7d: reflections?.n ?? 0,
    awaiting: awaiting.length,
    counts,
    revenue: projectRevenue(counts),
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
