import { z } from "zod";

import { TESTIMONIAL_PLACEMENTS } from "./types.ts";

export const testimonialFormSchema = z.object({
  id: z.string().optional(),
  name: z.object({
    en: z.string().trim().min(1, "Name required in English").max(100),
    fa: z.string().trim().min(1, "نام به فارسی الزامی است").max(100),
  }),
  quote: z.object({
    en: z.string().trim().min(1, "Quote required in English").max(1000),
    fa: z.string().trim().min(1, "متن دیدگاه به فارسی الزامی است").max(1000),
  }),
  roleOrMeta: z.object({
    en: z.string().trim().max(120),
    fa: z.string().trim().max(120),
  }),
  rating: z.number().int().min(1).max(5),
  avatarColor: z.string().min(1),
  hidden: z.boolean(),
  order: z.number().int(),
  showOn: z.enum(TESTIMONIAL_PLACEMENTS),
});

export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

export const testimonialReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});
