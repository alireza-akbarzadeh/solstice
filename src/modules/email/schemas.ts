import { z } from "zod";

import { smtpSecurities } from "@/infrastructure/email/security";

const optionalEmail = z.union([z.literal(""), z.string().trim().email().max(200)]);

/**
 * The studio's email form. SMTP needs a host and a sender address; the password is write-only
 * (empty keeps the stored one, `clearPassword` forgets it).
 */
export const emailSettingsSchema = z
  .object({
    provider: z.enum(["outbox", "smtp"]),
    host: z.string().trim().max(200),
    port: z
      .string()
      .trim()
      .regex(/^\d{1,5}$/, "port")
      .transform(Number)
      .pipe(z.number().int().min(1).max(65535)),
    security: z.enum(smtpSecurities),
    user: z.string().trim().max(200),
    password: z.string().max(500),
    clearPassword: z.boolean(),
    fromName: z.string().trim().max(120),
    fromAddress: optionalEmail,
    replyTo: optionalEmail,
  })
  .superRefine((value, ctx) => {
    if (value.provider !== "smtp") return;
    if (!value.host) ctx.addIssue({ code: "custom", path: ["host"], message: "required" });
    if (!value.fromAddress) ctx.addIssue({ code: "custom", path: ["fromAddress"], message: "required" });
  });

export type EmailSettingsInput = z.output<typeof emailSettingsSchema>;
export type EmailSettingsFormValues = z.input<typeof emailSettingsSchema>;
