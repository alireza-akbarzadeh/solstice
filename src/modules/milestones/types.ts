import type { Localized } from "@/lib/localized";

export type MilestoneCategory = "volume" | "depth" | "style";

export type MilestoneDefinition = {
  id: string;
  category: MilestoneCategory;
  icon: "sparkles" | "flame" | "heart" | "sun" | "tree" | "crown" | "wind" | "moon" | "sunrise";
  target: number;
  title: Localized;
  description: Localized;
  type: "total_sessions" | "total_minutes" | "category_sessions";
  targetCategory?: string[];
};

export type EvaluatedMilestone = {
  id: string;
  category: MilestoneCategory;
  icon: MilestoneDefinition["icon"];
  target: number;
  current: number;
  progressPercent: number;
  unlocked: boolean;
  unlockedAt: Date | null;
  title: Localized;
  description: Localized;
};
