import { desc, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { practiceCompletions, practices } from "@/server/db/schema";
import { evaluateMemberMilestones } from "../milestones";

/**
 * Retrieves the evaluated sanctuary milestones for a member based on their completion history.
 */
export async function getMemberMilestones(userId: string) {
  const [completions, practiceRows] = await Promise.all([
    db
      .select({
        practiceSlug: practiceCompletions.practiceSlug,
        completedAt: practiceCompletions.completedAt,
        minutes: practiceCompletions.minutes,
      })
      .from(practiceCompletions)
      .where(eq(practiceCompletions.userId, userId))
      .orderBy(desc(practiceCompletions.completedAt)),
    db
      .select({
        slug: practices.slug,
        category: practices.category,
      })
      .from(practices),
  ]);

  const categoryMap = new Map(practiceRows.map((p) => [p.slug, p.category]));

  return evaluateMemberMilestones(completions, (slug) => categoryMap.get(slug));
}
