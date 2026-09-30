import { and, desc, eq, gte } from "drizzle-orm";

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

export async function recordCompletion(userId: string, practiceSlug: string, minutes: number) {
  if (await hasCompletedRecently(userId, practiceSlug)) return;
  await db.insert(practiceCompletions).values({ userId, practiceSlug, minutes });
}

/** Undo for a mistaken "Mark complete": removes today's entry only, never older history. */
export async function undoRecentCompletion(userId: string, practiceSlug: string) {
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
