import { z } from "zod";

import { reflectionTags } from "./types";

export const REFLECTION_MAX_LENGTH = 1500;

export const newReflectionSchema = z.object({
  /** Null: a post in the community circle rather than under a practice. */
  practiceSlug: z.string().min(1).max(200).nullable(),
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

/** The composer form: the text plus the choices around it (react-hook-form + zodResolver). */
export const reflectionFormSchema = z.object({
  body: newReflectionSchema.shape.body,
  tag: newReflectionSchema.shape.tag,
  withTime: z.boolean(),
  isPrivate: z.boolean(),
});
export type ReflectionFormValues = z.infer<typeof reflectionFormSchema>;

/** A reply: just the text. */
export const replyFormSchema = z.object({ body: newReflectionSchema.shape.body });
export type ReplyFormValues = z.infer<typeof replyFormSchema>;
