import { z } from "zod";

import { REFLECTION_MAX_LENGTH } from "@/modules/community/schemas";

// Studio form schemas, shared by each react-hook-form editor (zodResolver) and the server
// action that receives it, so the browser and the server apply the same rules.

/** A circle post as the studio, optionally pinned and pushed. */
export const announcementSchema = z.object({
  body: z.string().trim().min(1).max(REFLECTION_MAX_LENGTH),
  pinned: z.boolean(),
  notify: z.boolean(),
});
export type AnnouncementValues = z.infer<typeof announcementSchema>;

export const giftPassMonths = [1, 3, 6, 12] as const;

/** A comped pass: a plan and a number of months, written against the "studio" provider. */
export const giftPassSchema = z.object({
  plan: z.string().trim().min(1).max(100),
  months: z
    .number()
    .int()
    .refine((n) => (giftPassMonths as readonly number[]).includes(n)),
});
export type GiftPassValues = z.infer<typeof giftPassSchema>;
