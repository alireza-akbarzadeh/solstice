import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { memberOnboarding } from "@/server/db/schema";
import type {
  ExperienceLevel,
  MemberOnboarding,
  OnboardingAggregate,
  PrimaryGoal,
  TimeAvailable,
} from "../types";
import type { OnboardingFormValues } from "../schemas";

export async function getMemberOnboarding(
  userId: string,
): Promise<MemberOnboarding | null> {
  try {
    const rows = await db
      .select()
      .from(memberOnboarding)
      .where(eq(memberOnboarding.userId, userId))
      .limit(1);

    const first = rows[0];
    if (!first) return null;

    return {
      ...first,
      primaryGoals: (first.primaryGoals as PrimaryGoal[]) ?? [],
    };
  } catch (err) {
    console.error(`Failed to get onboarding for user ${userId}:`, err);
    return null;
  }
}

export async function saveMemberOnboarding(
  userId: string,
  values: OnboardingFormValues,
): Promise<MemberOnboarding | null> {
  const payload = {
    userId,
    experienceLevel: values.experienceLevel,
    primaryGoals: values.primaryGoals,
    timeAvailable: values.timeAvailable,
    injuriesAndLimits: values.injuriesAndLimits?.trim() || null,
    completedAt: new Date(),
  };

  const rows = await db
    .insert(memberOnboarding)
    .values(payload)
    .onConflictDoUpdate({
      target: memberOnboarding.userId,
      set: {
        experienceLevel: payload.experienceLevel,
        primaryGoals: payload.primaryGoals,
        timeAvailable: payload.timeAvailable,
        injuriesAndLimits: payload.injuriesAndLimits,
        completedAt: payload.completedAt,
        updatedAt: new Date(),
      },
    })
    .returning();

  const first = rows[0];
  if (!first) return null;
  return {
    ...first,
    primaryGoals: (first.primaryGoals as PrimaryGoal[]) ?? [],
  };
}

export async function getOnboardingAggregate(): Promise<OnboardingAggregate> {
  const result: OnboardingAggregate = {
    totalCompleted: 0,
    levels: { beginner: 0, intermediate: 0, advanced: 0 },
    goals: {
      flexibility: 0,
      strength: 0,
      stress_relief: 0,
      spine_health: 0,
      breathwork: 0,
      meditation: 0,
      restoration: 0,
    },
    timeAvailable: { "15_mins": 0, "30_mins": 0, "45_plus": 0 },
  };

  try {
    const rows = await db.select().from(memberOnboarding);
    result.totalCompleted = rows.length;

    for (const r of rows) {
      if (r.experienceLevel in result.levels) {
        result.levels[r.experienceLevel as ExperienceLevel]++;
      }
      if (r.timeAvailable in result.timeAvailable) {
        result.timeAvailable[r.timeAvailable as TimeAvailable]++;
      }
      if (Array.isArray(r.primaryGoals)) {
        for (const g of r.primaryGoals) {
          if (g in result.goals) {
            result.goals[g as PrimaryGoal]++;
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to aggregate onboarding stats:", err);
  }

  return result;
}
