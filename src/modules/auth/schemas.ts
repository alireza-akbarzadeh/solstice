import { z } from "zod";

import { practiceRhythms } from "@/modules/users/types";

// Account forms (react-hook-form + zodResolver). Messages are keys under `Auth.validation`,
// so each form translates the first problem with a field and shows it beside that field.

export const PASSWORD_MIN = 8;

export const emailSchema = z.string().trim().min(1, "emailRequired").pipe(z.email("emailInvalid"));
export const newPasswordSchema = z.string().min(PASSWORD_MIN, "passwordShort").max(128, "passwordLong");
export const nameSchema = z.string().trim().min(1, "nameRequired").max(100, "nameLong");
const newPassword = newPasswordSchema;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "passwordRequired"),
  remember: z.boolean(),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: newPassword,
  practiceRhythm: z.enum(practiceRhythms),
  terms: z.boolean().refine((accepted) => accepted, "termsRequired"),
  newsletter: z.boolean(),
});
export type SignUpValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({ password: newPassword });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

/** The `Auth.validation` keys a schema above can produce. */
export type AuthValidationKey =
  | "emailRequired"
  | "emailInvalid"
  | "passwordRequired"
  | "passwordShort"
  | "passwordLong"
  | "nameRequired"
  | "nameLong"
  | "termsRequired";

const keys = new Set<string>([
  "emailRequired",
  "emailInvalid",
  "passwordRequired",
  "passwordShort",
  "passwordLong",
  "nameRequired",
  "nameLong",
  "termsRequired",
]);
/** Narrows a zod issue message to a translation key (anything unexpected reads as generic). */
export const validationKey = (message: string | undefined): AuthValidationKey | null =>
  message && keys.has(message) ? (message as AuthValidationKey) : null;
