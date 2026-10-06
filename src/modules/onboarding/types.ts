export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type PrimaryGoal =
  | "flexibility"
  | "strength"
  | "stress_relief"
  | "spine_health"
  | "breathwork"
  | "meditation"
  | "restoration";

export type TimeAvailable = "15_mins" | "30_mins" | "45_plus";

export interface MemberOnboarding {
  id: number;
  userId: string;
  experienceLevel: ExperienceLevel;
  primaryGoals: PrimaryGoal[];
  timeAvailable: TimeAvailable;
  injuriesAndLimits?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberNote {
  id: number;
  userId: string;
  instructorId: string;
  instructorName?: string;
  instructorImage?: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingAggregate {
  totalCompleted: number;
  levels: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  goals: Record<PrimaryGoal, number>;
  timeAvailable: {
    "15_mins": number;
    "30_mins": number;
    "45_plus": number;
  };
}
