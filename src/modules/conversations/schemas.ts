import { z } from "zod";

import { aiModes } from "@/infrastructure/ai/types";

// Shared by the chat forms and their server actions.

export const MESSAGE_MAX = 4000;
export const ASSISTANT_MESSAGE_MAX = 1000;

const body = (max: number) => z.string().trim().min(1).max(max);

/** "14:22" or "1:02:05" → seconds; blank → null. */
export const practiceMomentSchema = z
  .string()
  .trim()
  .max(8)
  .transform((value, ctx) => {
    if (!value) return null;
    const parts = value.split(":").map(Number);
    if (parts.length < 2 || parts.length > 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) {
      ctx.addIssue({ code: "custom", message: "moment" });
      return z.NEVER;
    }
    return parts.reduce((total, n) => total * 60 + n, 0);
  });

const practiceLink = {
  practiceSlug: z.string().trim().max(200),
  practiceAt: practiceMomentSchema,
};

export const guidanceMessageSchema = z.object({ body: body(MESSAGE_MAX), ...practiceLink });
export type GuidanceMessageValues = z.input<typeof guidanceMessageSchema>;

export const newGuidanceThreadSchema = guidanceMessageSchema.extend({
  topic: z.enum(["path", "practice"]),
  subject: z.string().trim().min(1).max(120),
});
export type NewGuidanceThreadValues = z.input<typeof newGuidanceThreadSchema>;

export const assistantMessageSchema = z.object({ body: body(ASSISTANT_MESSAGE_MAX) });

/** Asking for a person: visitors leave an email so the reply can reach them. */
export const escalateSchema = z.object({
  name: z.string().trim().max(120),
  email: z.union([z.literal(""), z.string().trim().email().max(200)]),
});
export type EscalateValues = z.input<typeof escalateSchema>;

export const staffReplySchema = z.object({ conversationId: z.number().int().positive(), body: body(MESSAGE_MAX) });

const wholeNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,6}$/, "number")
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

/** The studio's assistant settings. The key is write-only: empty keeps the stored one. */
export const assistantSettingsSchema = z.object({
  mode: z.enum(aiModes),
  model: z.string().trim().max(80),
  apiKey: z.string().trim().max(300),
  clearApiKey: z.boolean(),
  instructions: z.string().trim().max(6000),
  guidanceAi: z.boolean(),
  replyHours: wholeNumber(1, 720),
  dailyLimit: wholeNumber(1, 100_000),
});
export type AssistantSettingsInput = z.output<typeof assistantSettingsSchema>;
export type AssistantSettingsFormValues = z.input<typeof assistantSettingsSchema>;
