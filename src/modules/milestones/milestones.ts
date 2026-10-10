import { SANCTUARY_MILESTONES } from "./definitions.ts";
import type { EvaluatedMilestone, MilestoneDefinition } from "./types.ts";

export type MemberCompletionRecord = {
  practiceSlug: string;
  completedAt: Date;
  minutes: number;
};

/**
 * Pure function that evaluates member completions against sanctuary milestone definitions.
 * Computes progression percentages and the exact date when each milestone was earned.
 */
export function evaluateMemberMilestones(
  completions: MemberCompletionRecord[],
  categoryOfSlug: (slug: string) => string | undefined,
  definitions: MilestoneDefinition[] = SANCTUARY_MILESTONES,
): {
  milestones: EvaluatedMilestone[];
  unlockedCount: number;
  totalCount: number;
  recentUnlocked: EvaluatedMilestone | null;
  nextMilestone: EvaluatedMilestone | null;
} {
  // Sort oldest to newest to discover the exact completion that unlocked each milestone
  const sorted = [...completions].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  );

  const evaluated: EvaluatedMilestone[] = definitions.map((def) => {
    let current = 0;
    let unlockedAt: Date | null = null;

    if (def.type === "total_sessions") {
      current = sorted.length;
      if (current >= def.target && sorted.length >= def.target) {
        unlockedAt = new Date(sorted[def.target - 1]!.completedAt);
      }
    } else if (def.type === "total_minutes") {
      let accumulatedMinutes = 0;
      for (const c of sorted) {
        accumulatedMinutes += c.minutes;
        if (accumulatedMinutes >= def.target && !unlockedAt) {
          unlockedAt = new Date(c.completedAt);
        }
      }
      current = accumulatedMinutes;
    } else if (def.type === "category_sessions" && def.targetCategory) {
      const allowedCategories = new Set(def.targetCategory);
      let count = 0;
      for (const c of sorted) {
        const cat = categoryOfSlug(c.practiceSlug);
        if (cat && allowedCategories.has(cat)) {
          count++;
          if (count === def.target && !unlockedAt) {
            unlockedAt = new Date(c.completedAt);
          }
        }
      }
      current = count;
    }

    const unlocked = current >= def.target;
    const progressPercent = Math.min(100, Math.round((current / def.target) * 100));

    return {
      id: def.id,
      category: def.category,
      icon: def.icon,
      target: def.target,
      current,
      progressPercent,
      unlocked,
      unlockedAt,
      title: def.title,
      description: def.description,
    };
  });

  const unlockedMilestones = evaluated.filter((m) => m.unlocked);
  const lockedMilestones = evaluated.filter((m) => !m.unlocked);

  // Recent unlocked: newest unlockedAt
  const recentUnlocked =
    unlockedMilestones.length > 0
      ? [...unlockedMilestones].sort((a, b) => {
          const tA = a.unlockedAt ? a.unlockedAt.getTime() : 0;
          const tB = b.unlockedAt ? b.unlockedAt.getTime() : 0;
          return tB - tA;
        })[0]!
      : null;

  // Next milestone to unlock: highest progress percentage that is not yet unlocked
  const nextMilestone =
    lockedMilestones.length > 0
      ? [...lockedMilestones].sort((a, b) => b.progressPercent - a.progressPercent)[0]!
      : null;

  return {
    milestones: evaluated,
    unlockedCount: unlockedMilestones.length,
    totalCount: evaluated.length,
    recentUnlocked,
    nextMilestone,
  };
}
