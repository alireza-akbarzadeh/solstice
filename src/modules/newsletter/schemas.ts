import { z } from "zod";

const text = (max: number) => z.object({ en: z.string().trim().max(max), fa: z.string().trim().max(max) });

/** A newsletter: each language needs both a subject and a body, and at least one language is written. */
export const newsletterIssueSchema = z
  .object({ subject: text(200), body: text(20_000) })
  .superRefine((value, ctx) => {
    const written = (["en", "fa"] as const).filter((l) => value.subject[l] || value.body[l]);
    if (written.length === 0) ctx.addIssue({ code: "custom", path: ["subject"], message: "empty" });
    for (const l of written) {
      if (!value.subject[l]) ctx.addIssue({ code: "custom", path: ["subject"], message: "subject" });
      if (!value.body[l]) ctx.addIssue({ code: "custom", path: ["body"], message: "body" });
    }
  });

export type NewsletterIssueInput = z.output<typeof newsletterIssueSchema>;
