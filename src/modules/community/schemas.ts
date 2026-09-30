import { z } from "zod";

import { reflectionTags } from "./types";

export const REFLECTION_MAX_LENGTH = 1500;

export const newReflectionSchema = z.object({
  practiceSlug: z.string().min(1).max(200),
  body: z.string().trim().min(1).max(REFLECTION_MAX_LENGTH),
  tag: z.enum(reflectionTags).nullable(),
  atSeconds: z
    .number()
    .int()
    .min(0)
    .max(24 * 60 * 60)
    .nullable(),
  visibility: z.enum(["circle", "private"]),
  parentId: z.number().int().positive().nullable(),
});
export type NewReflection = z.infer<typeof newReflectionSchema>;

export const reflectionIdSchema = z.number().int().positive();
