import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { practiceCompletions, programEnrollments } from "@/server/db/schema";

import type { ProgramDetail } from "../types";

const DAY = 24 * 60 * 60 * 1000;

export type ProgramProgress = {
  enrolled: boolean;
  startedAt: Date | null;
  /** Program days completed. */
  completed: number[];
  /** Days 1..unlockedThrough are open (daily pacing opens one more each day). */
  unlockedThrough: number;
  /** The day to practice next: the first open, incomplete day. Null when all are done or none are open. */
  current: number | null;
  /** When the next day opens (daily pacing, before the end). */
  nextUnlockAt: Date | null;
  /** Consecutive days (up to today) with at least one program practice. */
  streak: number;
  percent: number;
};

export async function getEnrollment(userId: string, programSlug: string) {
  const [row] = await db
    .select({ startedAt: programEnrollments.startedAt })
    .from(programEnrollments)
    .where(and(eq(programEnrollments.userId, userId), eq(programEnrollments.programSlug, programSlug)))
    .limit(1);
  return row ?? null;
}

/** Programs the member follows, most recently started first. */
export async function getEnrolledProgramSlugs(userId: string) {
  const rows = await db
    .select({ slug: programEnrollments.programSlug })
    .from(programEnrollments)
    .where(eq(programEnrollments.userId, userId))
    .orderBy(desc(programEnrollments.startedAt));
  return rows.map((r) => r.slug);
}

export async function enroll(userId: string, programSlug: string) {
  await db.insert(programEnrollments).values({ userId, programSlug }).onConflictDoNothing();
}

/** Start over: a new start date and a clean slate of program days (practice history stays). */
export async function restartProgram(userId: string, programSlug: string) {
  await db
    .update(practiceCompletions)
    .set({ programSlug: null, programDay: null })
    .where(and(eq(practiceCompletions.userId, userId), eq(practiceCompletions.programSlug, programSlug)));
  await db
    .update(programEnrollments)
    .set({ startedAt: new Date() })
    .where(and(eq(programEnrollments.userId, userId), eq(programEnrollments.programSlug, programSlug)));
}

export async function countEnrollments(programSlug: string) {
  const [row] = await db.select({ n: count() }).from(programEnrollments).where(eq(programEnrollments.programSlug, programSlug));
  return row?.n ?? 0;
}

const dayKey = (date: Date) => Math.floor(date.getTime() / DAY);

function streakOf(dates: Date[], now: Date) {
  const days = new Set(dates.map(dayKey));
  let cursor = dayKey(now);
  if (!days.has(cursor)) cursor -= 1; // today not practiced yet: yesterday still counts
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

export async function getProgramProgress(userId: string | null, program: ProgramDetail, now = new Date()): Promise<ProgramProgress> {
  const enrollment = userId ? await getEnrollment(userId, program.slug) : null;
  if (!userId || !enrollment) {
    return {
      enrolled: false,
      startedAt: null,
      completed: [],
      unlockedThrough: 0,
      current: null,
      nextUnlockAt: null,
      streak: 0,
      percent: 0,
    };
  }

  const rows = await db
    .select({ day: practiceCompletions.programDay, completedAt: practiceCompletions.completedAt })
    .from(practiceCompletions)
    .where(and(eq(practiceCompletions.userId, userId), eq(practiceCompletions.programSlug, program.slug)));
  const completed = [...new Set(rows.map((r) => r.day).filter((d): d is number => d !== null))].sort((a, b) => a - b);

  const elapsedDays = Math.floor((now.getTime() - enrollment.startedAt.getTime()) / DAY);
  const unlockedThrough = program.pacing === "self" ? program.totalDays : Math.min(program.totalDays, elapsedDays + 1);
  const done = new Set(completed);
  let current: number | null = null;
  for (let day = 1; day <= unlockedThrough; day++) {
    if (!done.has(day)) {
      current = day;
      break;
    }
  }

  return {
    enrolled: true,
    startedAt: enrollment.startedAt,
    completed,
    unlockedThrough,
    current,
    nextUnlockAt:
      unlockedThrough < program.totalDays ? new Date(enrollment.startedAt.getTime() + (elapsedDays + 1) * DAY) : null,
    streak: streakOf(
      rows.map((r) => r.completedAt),
      now,
    ),
    percent: Math.round((completed.length / program.totalDays) * 100),
  };
}
