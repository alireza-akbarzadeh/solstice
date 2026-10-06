import { z } from "zod";

export const experienceLevels = ["beginner", "intermediate", "advanced"] as const;

export const primaryGoalsList = [
  "flexibility",
  "strength",
  "stress_relief",
  "spine_health",
  "breathwork",
  "meditation",
  "restoration",
] as const;

export const timeAvailableList = ["15_mins", "30_mins", "45_plus"] as const;

export const onboardingFormSchema = z.object({
  experienceLevel: z.enum(experienceLevels, {
    message: "Please select your experience level",
  }),
  primaryGoals: z
    .array(z.enum(primaryGoalsList))
    .min(1, "Please choose at least one sanctuary intention"),
  timeAvailable: z.enum(timeAvailableList, {
    message: "Please choose your preferred session rhythm",
  }),
  injuriesAndLimits: z
    .string()
    .max(1000, "Maximum 1,000 characters")
    .optional()
    .nullable(),
});

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export const memberNoteSchema = z.object({
  userId: z.string().trim().min(1),
  body: z
    .string()
    .trim()
    .min(2, "Note cannot be empty")
    .max(2000, "Note is too long (maximum 2,000 characters)"),
});

export type MemberNoteValues = z.infer<typeof memberNoteSchema>;
