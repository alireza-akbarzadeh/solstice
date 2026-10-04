import { and, asc, count, countDistinct, desc, eq, gte, inArray, isNotNull, lt, sql, sum, type AnyColumn } from "drizzle-orm";

import { db } from "@/server/db";
import {
  comments,
  favorites,
  memberships,
  newsletterSubscribers,
  practiceCompletions,
  practices,
  programEnrollments,
  programs,
  user,
} from "@/server/db/schema";

import { getMembershipCounts } from "./studio";

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

/** How far back the studio can look, in weeks. The first is the default. */
export const insightRanges = [12, 4, 26, 52] as const;
export type InsightRange = (typeof insightRanges)[number];

/** Monday 00:00 UTC of the week `date` falls in — the same weeks Postgres `date_trunc('week')` uses. */
function weekStart(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

const weekKey = (value: Date) => value.toISOString().slice(0, 10);

export type WeekPoint = { week: string; sessions: number; minutes: number; active: number; signups: number };
export type Totals = { signups: number; active: number; sessions: number; minutes: number; reflections: number; subscribers: number };

/**
 * Everything /instructor/insights shows for the last `weeks` weeks (the current week included),
 * plus the same totals for the period before it so each number can show its change.
 */
export async function getStudioInsights(weeks: InsightRange) {
  const thisWeek = weekStart(new Date());
  const start = new Date(thisWeek.getTime() - (weeks - 1) * WEEK);
  const previousStart = new Date(start.getTime() - weeks * WEEK);
  const staleBefore = new Date(Date.now() - 14 * DAY);
  const now = new Date();

  // Formatted in SQL: a timestamp would come back shifted into the server's own time zone.
  const completionWeek = sql<string>`to_char(date_trunc('week', ${practiceCompletions.completedAt} at time zone 'UTC'), 'YYYY-MM-DD')`;
  // Better Auth's created_at has no time zone and is written in UTC.
  const signupWeek = sql<string>`to_char(date_trunc('week', ${user.createdAt}), 'YYYY-MM-DD')`;
  const inRange = (column: AnyColumn, from: Date, to?: Date) =>
    to ? and(gte(column, from), lt(column, to)) : gte(column, from);

  const [
    sessionRows,
    signupRows,
    [activeNow],
    [activeBefore],
    [reflectionsNow],
    [reflectionsBefore],
    [subscribersNow],
    [subscribersBefore],
    heatRows,
    topRows,
    categoryRows,
    counts,
    [trialsEnding],
    quiet,
  ] = await Promise.all([
    db
      .select({ week: completionWeek, sessions: count(), minutes: sum(practiceCompletions.minutes), active: countDistinct(practiceCompletions.userId) })
      .from(practiceCompletions)
      .where(gte(practiceCompletions.completedAt, previousStart))
      .groupBy(completionWeek),
    db.select({ week: signupWeek, n: count() }).from(user).where(gte(user.createdAt, previousStart)).groupBy(signupWeek),
    db.select({ n: countDistinct(practiceCompletions.userId) }).from(practiceCompletions).where(inRange(practiceCompletions.completedAt, start)),
    db.select({ n: countDistinct(practiceCompletions.userId) }).from(practiceCompletions).where(inRange(practiceCompletions.completedAt, previousStart, start)),
    db.select({ n: count() }).from(comments).where(inRange(comments.createdAt, start)),
    db.select({ n: count() }).from(comments).where(inRange(comments.createdAt, previousStart, start)),
    db.select({ n: count() }).from(newsletterSubscribers).where(inRange(newsletterSubscribers.createdAt, start)),
    db.select({ n: count() }).from(newsletterSubscribers).where(inRange(newsletterSubscribers.createdAt, previousStart, start)),
    // Half-hour slots of the week in UTC; the browser shifts them into the instructor's local time.
    db
      .select({
        dow: sql<number>`extract(dow from ${practiceCompletions.completedAt} at time zone 'UTC')::int`,
        slot: sql<number>`(extract(hour from ${practiceCompletions.completedAt} at time zone 'UTC') * 2 + floor(extract(minute from ${practiceCompletions.completedAt} at time zone 'UTC') / 30))::int`,
        n: count(),
      })
      .from(practiceCompletions)
      .where(gte(practiceCompletions.completedAt, start))
      .groupBy(sql`1`, sql`2`),
    db
      .select({
        slug: practiceCompletions.practiceSlug,
        title: practices.title,
        sessions: count(),
        members: countDistinct(practiceCompletions.userId),
        minutes: sum(practiceCompletions.minutes),
      })
      .from(practiceCompletions)
      .leftJoin(practices, eq(practices.slug, practiceCompletions.practiceSlug))
      .where(gte(practiceCompletions.completedAt, start))
      .groupBy(practiceCompletions.practiceSlug, practices.title)
      .orderBy(desc(count()))
      .limit(8),
    db
      .select({ category: practices.category, minutes: sum(practiceCompletions.minutes), sessions: count() })
      .from(practiceCompletions)
      .innerJoin(practices, eq(practices.slug, practiceCompletions.practiceSlug))
      .where(gte(practiceCompletions.completedAt, start))
      .groupBy(practices.category)
      .orderBy(desc(sum(practiceCompletions.minutes))),
    getMembershipCounts(),
    db
      .select({ n: count() })
      .from(memberships)
      .where(
        and(
          eq(memberships.status, "trialing"),
          isNotNull(memberships.trialEndsAt),
          gte(memberships.trialEndsAt, now),
          lt(memberships.trialEndsAt, new Date(now.getTime() + 7 * DAY)),
        ),
      ),
    getQuietMembers(staleBefore),
  ]);

  // ── Weekly series, every week present even when nothing happened ──
  const byWeek = new Map<string, WeekPoint>();
  for (let i = 0; i < weeks * 2; i++) {
    const week = weekKey(new Date(previousStart.getTime() + i * WEEK));
    byWeek.set(week, { week, sessions: 0, minutes: 0, active: 0, signups: 0 });
  }
  for (const row of sessionRows) {
    const point = byWeek.get(row.week);
    if (point) Object.assign(point, { sessions: row.sessions, minutes: Number(row.minutes ?? 0), active: row.active });
  }
  for (const row of signupRows) {
    const point = byWeek.get(row.week);
    if (point) point.signups = row.n;
  }
  const all = [...byWeek.values()];
  const previous = all.slice(0, weeks);
  const series = all.slice(weeks);
  const total = (points: WeekPoint[], key: "sessions" | "minutes" | "signups") => points.reduce((n, p) => n + p[key], 0);

  const current: Totals = {
    signups: total(series, "signups"),
    active: activeNow?.n ?? 0,
    sessions: total(series, "sessions"),
    minutes: total(series, "minutes"),
    reflections: reflectionsNow?.n ?? 0,
    subscribers: subscribersNow?.n ?? 0,
  };
  const before: Totals = {
    signups: total(previous, "signups"),
    active: activeBefore?.n ?? 0,
    sessions: total(previous, "sessions"),
    minutes: total(previous, "minutes"),
    reflections: reflectionsBefore?.n ?? 0,
    subscribers: subscribersBefore?.n ?? 0,
  };

  // ── Heatmap: 7 days × 48 half-hours, Sunday first (Postgres dow) ──
  const heat = Array.from({ length: 7 * 48 }, () => 0);
  for (const row of heatRows) heat[row.dow * 48 + row.slot] = row.n;

  // ── Saves for the top practices ──
  const topSlugs = topRows.map((r) => r.slug);
  const saveRows = topSlugs.length
    ? await db
        .select({ slug: favorites.practiceSlug, n: count() })
        .from(favorites)
        .where(inArray(favorites.practiceSlug, topSlugs))
        .groupBy(favorites.practiceSlug)
    : [];
  const saves = Object.fromEntries(saveRows.map((r) => [r.slug, r.n]));

  return {
    weeks,
    series,
    current,
    before,
    heat,
    topPractices: topRows.map((r) => ({
      slug: r.slug,
      title: r.title,
      sessions: r.sessions,
      members: r.members,
      minutes: Number(r.minutes ?? 0),
      saves: saves[r.slug] ?? 0,
    })),
    categories: categoryRows.map((r) => ({ category: r.category, minutes: Number(r.minutes ?? 0), sessions: r.sessions })),
    programs: await getProgramProgress(start),
    membership: { ...counts, trialsEnding: trialsEnding?.n ?? 0 },
    quiet,
  };
}

/**
 * Members with access who haven't practised for two weeks (or ever) — the people worth a
 * personal message. Trials first, since they decide soonest.
 */
async function getQuietMembers(staleBefore: Date) {
  const lastPractice = sql<Date | null>`(select max(${practiceCompletions.completedAt}) from ${practiceCompletions} where ${practiceCompletions.userId} = ${user.id})`;
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      status: memberships.status,
      trialEndsAt: memberships.trialEndsAt,
      joinedAt: memberships.createdAt,
      lastPracticeAt: lastPractice,
    })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .where(
      and(
        eq(user.role, "member"),
        inArray(memberships.status, ["trialing", "active"]),
        gte(memberships.currentPeriodEnd, new Date()),
        sql`coalesce(${lastPractice}, 'epoch'::timestamptz) < ${staleBefore.toISOString()}::timestamptz`,
      ),
    )
    .orderBy(sql`case when ${memberships.status} = 'trialing' then 0 else 1 end`, asc(sql`coalesce(${lastPractice}, 'epoch'::timestamptz)`))
    .limit(50);
  return { total: rows.length, members: rows.slice(0, 12) };
}

/** Per program: how many enrolled, how many joined in the period, how far they got, how many finished. */
async function getProgramProgress(start: Date) {
  const [rows, enrollments, progress] = await Promise.all([
    db.select({ slug: programs.slug, title: programs.title, weeks: programs.weeks, status: programs.status }).from(programs),
    db.select({ slug: programEnrollments.programSlug, userId: programEnrollments.userId, startedAt: programEnrollments.startedAt }).from(programEnrollments),
    db
      .select({ slug: practiceCompletions.programSlug, userId: practiceCompletions.userId, days: countDistinct(practiceCompletions.programDay) })
      .from(practiceCompletions)
      .where(isNotNull(practiceCompletions.programSlug))
      .groupBy(practiceCompletions.programSlug, practiceCompletions.userId),
  ]);
  const daysDone = new Map(progress.map((p) => [`${p.slug}:${p.userId}`, p.days]));

  return rows
    .map((program) => {
      const totalDays = program.weeks.reduce((n, week) => n + week.practices.length, 0);
      const enrolled = enrollments.filter((e) => e.slug === program.slug);
      const done = enrolled.map((e) => daysDone.get(`${program.slug}:${e.userId}`) ?? 0);
      return {
        slug: program.slug,
        title: program.title,
        published: program.status === "published",
        totalDays,
        enrolled: enrolled.length,
        joined: enrolled.filter((e) => e.startedAt >= start).length,
        started: done.filter((d) => d > 0).length,
        halfway: done.filter((d) => totalDays > 0 && d >= totalDays / 2).length,
        finished: done.filter((d) => totalDays > 0 && d >= totalDays).length,
      };
    })
    .filter((p) => p.published || p.enrolled > 0)
    .sort((a, b) => b.enrolled - a.enrolled);
}
