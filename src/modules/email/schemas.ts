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
    // Typed as text in the form; the server action receives the number the form already parsed.
    port: z
      .union([z.number(), z.string().trim().regex(/^\d{1,5}$/, "port").transform(Number)])
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

export const localizedTemplateSchema = z.object({
  subject: z.string().trim().min(1, "required").max(200, "too_long"),
  body: z.string().trim().min(1, "required").max(5000, "too_long"),
});

export const emailTemplateItemSchema = z.object({
  en: localizedTemplateSchema,
  fa: localizedTemplateSchema,
});

export const emailTemplatesFormSchema = z
  .object({
    verify: emailTemplateItemSchema,
    reset: emailTemplateItemSchema,
    welcome: emailTemplateItemSchema,
  })
  .superRefine((data, ctx) => {
    // Verify requires {url} in both English and Persian body
    if (!data.verify.en.body.includes("{url}")) {
      ctx.addIssue({
        code: "custom",
        path: ["verify", "en", "body"],
        message: "missing_url",
      });
    }
    if (!data.verify.fa.body.includes("{url}")) {
      ctx.addIssue({
        code: "custom",
        path: ["verify", "fa", "body"],
        message: "missing_url",
      });
    }
    // Reset requires {url} in both English and Persian body
    if (!data.reset.en.body.includes("{url}")) {
      ctx.addIssue({
        code: "custom",
        path: ["reset", "en", "body"],
        message: "missing_url",
      });
    }
    if (!data.reset.fa.body.includes("{url}")) {
      ctx.addIssue({
        code: "custom",
        path: ["reset", "fa", "body"],
        message: "missing_url",
      });
    }
  });

export type EmailTemplatesInput = z.infer<typeof emailTemplatesFormSchema>;
