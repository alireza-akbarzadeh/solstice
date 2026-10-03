import { z } from "zod";

import { nameSchema, newPasswordSchema } from "@/modules/auth/schemas";

import { practiceRhythms } from "./types";

// Profile forms (react-hook-form + zodResolver); messages are `Auth.validation` keys.

/** Shared with the updateProfile action. */
export const profileSchema = z.object({
  name: nameSchema,
  practiceRhythm: z.enum(practiceRhythms),
  marketingOptIn: z.boolean(),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z.object({
  current: z.string().min(1, "passwordRequired"),
  next: newPasswordSchema,
});
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const deleteAccountSchema = z.object({ password: z.string().min(1, "passwordRequired") });
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;
