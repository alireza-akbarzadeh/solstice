import { and, count, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { practiceLikes } from "@/server/db/schema";

/**
 * How many people hold a practice in heart, and whether this viewer does. A database that
 * hasn't run `pnpm db:seed:likes` reads as no likes, so the page still renders.
 */
export async function getLikeSummary(practiceSlug: string, userId: string | null) {
  try {
    const [[total], mine] = await Promise.all([
      db.select({ n: count() }).from(practiceLikes).where(eq(practiceLikes.practiceSlug, practiceSlug)),
      userId
        ? db
            .select({ slug: practiceLikes.practiceSlug })
            .from(practiceLikes)
            .where(and(eq(practiceLikes.userId, userId), eq(practiceLikes.practiceSlug, practiceSlug)))
            .limit(1)
        : Promise.resolve([]),
    ]);
    return { count: total?.n ?? 0, liked: mine.length > 0 };
  } catch (error) {
    console.error("Practice likes could not be read — run `pnpm db:seed:likes`.", error);
    return { count: 0, liked: false };
  }
}

export async function setLike(userId: string, practiceSlug: string, liked: boolean) {
  if (liked) {
    await db.insert(practiceLikes).values({ userId, practiceSlug }).onConflictDoNothing();
  } else {
    await db.delete(practiceLikes).where(and(eq(practiceLikes.userId, userId), eq(practiceLikes.practiceSlug, practiceSlug)));
  }
}
