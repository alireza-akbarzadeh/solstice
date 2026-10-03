import { z } from "zod";

import { journalCategories } from "./types";

const localized = (max: number) => z.object({ en: z.string().max(max), fa: z.string().max(max) });
const required = (max: number) =>
  z.object({ en: z.string().trim().min(1).max(max), fa: z.string().trim().min(1).max(max) });

// Mirrors JournalStoredBlock: the shapes the essay page knows how to render.
export const journalBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text: localized(4000) }),
  z.object({ type: z.literal("h2"), text: localized(200) }),
  z.object({ type: z.literal("quote"), text: localized(1000), source: localized(200) }),
  z.object({ type: z.literal("figure"), image: z.string().max(2000), alt: localized(300), caption: localized(500) }),
  z.object({
    type: z.literal("steps"),
    title: localized(200),
    intro: localized(1000),
    items: z.array(z.object({ title: localized(200), body: localized(2000) })).max(20),
  }),
]);

/**
 * An essay as the studio editor submits it, and as the server action re-validates it. The
 * editor (react-hook-form + zodResolver) and the action share this one schema.
 */
export const journalFieldsSchema = z.object({
  category: z.enum(journalCategories),
  issue: z.number().int().min(1).max(9999),
  title: required(200),
  excerpt: required(600),
  tags: z.array(localized(60)).max(8),
  authorName: required(120),
  authorRole: required(160),
  // A blank author photo means "use the default"; stored as null.
  authorImage: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .transform((value) => (value?.length ? value : null)),
  image: z.string().trim().min(1).max(2000),
  imageAlt: required(300),
  body: z.array(journalBlockSchema).max(200),
  practices: z.array(z.string().min(1).max(200)).max(12),
});

export type JournalFormValues = z.input<typeof journalFieldsSchema>;
export type JournalFieldsInput = z.output<typeof journalFieldsSchema>;
