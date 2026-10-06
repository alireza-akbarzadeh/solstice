import { z } from "zod";

export const liveClassFormSchema = z.object({
  titleEn: z.string().trim().min(3, "Title in English must be at least 3 characters"),
  titleFa: z.string().trim().min(3, "Title in Persian must be at least 3 characters"),
  descriptionEn: z.string().trim().min(5, "Description in English must be at least 5 characters"),
  descriptionFa: z.string().trim().min(5, "Description in Persian must be at least 5 characters"),
  locationNameEn: z.string().trim().default("Kyoto Pavilion · Pavilion Main"),
  locationNameFa: z.string().trim().default("پاویون کیوتو · تالار اصلی"),
  scheduledAt: z.string().min(1, "Scheduled date & time is required"),
  durationMinutes: z.coerce.number().min(15).max(360).default(60),
  joinUrl: z.string().trim().url("Must be a valid meeting URL (Google Meet, Zoom, Jitsi, etc.)"),
  capacity: z.coerce
    .number()
    .min(1)
    .nullable()
    .optional()
    .transform((val) => (val && val > 0 ? val : null)),
  access: z.enum(["members_only", "open"]).default("members_only"),
  status: z.enum(["scheduled", "live", "completed", "canceled"]).default("scheduled"),
  replayPracticeSlug: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  coverImage: z.string().trim().default("/images/classes/kyoto-pavilion-stage.jpg"),
  soundscapeDetails: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type LiveClassFormInput = z.infer<typeof liveClassFormSchema>;
