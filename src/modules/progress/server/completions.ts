import { and, desc, eq, gte, isNull } from "drizzle-orm";

import { db } from "@/server/db";
import { practiceCompletions } from "@/server/db/schema";

const DAY = 24 * 60 * 60 * 1000;

// "Completed today" means within the last day: the server doesn't know the member's clock.
const recent = () => new Date(Date.now() - DAY);

export async function hasCompletedRecently(userId: string, practiceSlug: string) {
  const [row] = await db
    .select({ id: practiceCompletions.id })
    .from(practiceCompletions)
    .where(
      and(
        eq(practiceCompletions.userId, userId),
        eq(practiceCompletions.practiceSlug, practiceSlug),
        gte(practiceCompletions.completedAt, recent()),
      ),
    )
    .limit(1);
  return !!row;
}

export async function hasCompletedProgramDay(userId: string, programSlug: string, programDay: number) {
  const [row] = await db
    .select({ id: practiceCompletions.id })
    .from(practiceCompletions)
    .where(
      and(
        eq(practiceCompletions.userId, userId),
        eq(practiceCompletions.programSlug, programSlug),
        eq(practiceCompletions.programDay, programDay),
      ),
    )
    .limit(1);
  return !!row;
}

export async function recordCompletion(
  userId: string,
  practiceSlug: string,
  minutes: number,
  program?: { slug: string; day: number },
) {
  if (!program) {
    if (await hasCompletedRecently(userId, practiceSlug)) return;
    await db.insert(practiceCompletions).values({ userId, practiceSlug, minutes });
    return;
  }

  if (await hasCompletedProgramDay(userId, program.slug, program.day)) return;
  // Already practiced today outside the program: count that session for the program day.
  const [today] = await db
    .select({ id: practiceCompletions.id })
    .from(practiceCompletions)
    .where(
      and(
        eq(practiceCompletions.userId, userId),
        eq(practiceCompletions.practiceSlug, practiceSlug),
        isNull(practiceCompletions.programSlug),
        gte(practiceCompletions.completedAt, recent()),
      ),
    )
    .limit(1);
  if (today) {
    await db
      .update(practiceCompletions)
      .set({ programSlug: program.slug, programDay: program.day })
      .where(eq(practiceCompletions.id, today.id));
  } else {
    await db.insert(practiceCompletions).values({ userId, practiceSlug, minutes, programSlug: program.slug, programDay: program.day });
  }
}

/** Undo for a mistaken "Mark complete": today's entry, or the given program day. */
export async function undoRecentCompletion(userId: string, practiceSlug: string, program?: { slug: string; day: number }) {
  if (program) {
    await db
      .delete(practiceCompletions)
      .where(
        and(
          eq(practiceCompletions.userId, userId),
          eq(practiceCompletions.programSlug, program.slug),
          eq(practiceCompletions.programDay, program.day),
        ),
      );
    return;
  }
  await db
    .delete(practiceCompletions)
    .where(
      and(
        eq(practiceCompletions.userId, userId),
        eq(practiceCompletions.practiceSlug, practiceSlug),
        gte(practiceCompletions.completedAt, recent()),
      ),
    );
}

/** Every completion, newest first — the input for progress, streaks and history. */
export async function getCompletions(userId: string) {
  return db
    .select({
      practiceSlug: practiceCompletions.practiceSlug,
      minutes: practiceCompletions.minutes,
      completedAt: practiceCompletions.completedAt,
    })
    .from(practiceCompletions)
    .where(eq(practiceCompletions.userId, userId))
    .orderBy(desc(practiceCompletions.completedAt));
}
