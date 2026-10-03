import { z } from "zod";

import { categoryKinds, isCategorySlug } from "./types";

const name = z.object({ en: z.string().trim().min(1).max(80), fa: z.string().trim().min(1).max(80) });

/** The studio's category editor (react-hook-form + zodResolver) and the actions share these. */
export const categoryFormSchema = z.object({
  slug: z.string().trim().refine(isCategorySlug),
  name,
  visible: z.boolean(),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const categoryKindSchema = z.enum(categoryKinds);
