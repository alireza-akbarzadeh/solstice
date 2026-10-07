import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { settings } from "@/server/db/schema";

import type { EmailTemplatesInput } from "../schemas";
import {
  DEFAULT_EMAIL_TEMPLATES,
  interpolateEmailText,
  type AllEmailTemplates,
  type EmailTemplateKey,
  type LocalizedEmailTemplate,
} from "../templates";

export type StoredEmailTemplatesRow = Partial<
  Record<
    EmailTemplateKey,
    {
      en?: Partial<LocalizedEmailTemplate>;
      fa?: Partial<LocalizedEmailTemplate>;
    }
  >
>;

function nonEmpty(val: string | undefined): string | undefined {
  const trimmed = val?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Loads the current email templates, merging any stored customizations with the default templates.
 */
export async function loadEmailTemplates(): Promise<AllEmailTemplates> {
  let stored: StoredEmailTemplatesRow = {};
  try {
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, "email_templates"))
      .limit(1);
    if (row?.value && typeof row.value === "object") {
      stored = row.value;
    }
  } catch (error) {
    console.error("[email:templates] Failed to load stored templates from DB, using defaults:", error);
  }

  const result: AllEmailTemplates = {
    verify: {
      en: {
        subject: nonEmpty(stored.verify?.en?.subject) ?? DEFAULT_EMAIL_TEMPLATES.verify.en.subject,
        body: nonEmpty(stored.verify?.en?.body) ?? DEFAULT_EMAIL_TEMPLATES.verify.en.body,
      },
      fa: {
        subject: nonEmpty(stored.verify?.fa?.subject) ?? DEFAULT_EMAIL_TEMPLATES.verify.fa.subject,
        body: nonEmpty(stored.verify?.fa?.body) ?? DEFAULT_EMAIL_TEMPLATES.verify.fa.body,
      },
    },
    reset: {
      en: {
        subject: nonEmpty(stored.reset?.en?.subject) ?? DEFAULT_EMAIL_TEMPLATES.reset.en.subject,
        body: nonEmpty(stored.reset?.en?.body) ?? DEFAULT_EMAIL_TEMPLATES.reset.en.body,
      },
      fa: {
        subject: nonEmpty(stored.reset?.fa?.subject) ?? DEFAULT_EMAIL_TEMPLATES.reset.fa.subject,
        body: nonEmpty(stored.reset?.fa?.body) ?? DEFAULT_EMAIL_TEMPLATES.reset.fa.body,
      },
    },
    welcome: {
      en: {
        subject: nonEmpty(stored.welcome?.en?.subject) ?? DEFAULT_EMAIL_TEMPLATES.welcome.en.subject,
        body: nonEmpty(stored.welcome?.en?.body) ?? DEFAULT_EMAIL_TEMPLATES.welcome.en.body,
      },
      fa: {
        subject: nonEmpty(stored.welcome?.fa?.subject) ?? DEFAULT_EMAIL_TEMPLATES.welcome.fa.subject,
        body: nonEmpty(stored.welcome?.fa?.body) ?? DEFAULT_EMAIL_TEMPLATES.welcome.fa.body,
      },
    },
  };

  return result;
}

/**
 * Persists customized email templates to the settings table.
 */
export async function saveStoredEmailTemplates(input: EmailTemplatesInput): Promise<AllEmailTemplates> {
  const value: StoredEmailTemplatesRow = {
    verify: {
      en: { subject: input.verify.en.subject.trim(), body: input.verify.en.body.trim() },
      fa: { subject: input.verify.fa.subject.trim(), body: input.verify.fa.body.trim() },
    },
    reset: {
      en: { subject: input.reset.en.subject.trim(), body: input.reset.en.body.trim() },
      fa: { subject: input.reset.fa.subject.trim(), body: input.reset.fa.body.trim() },
    },
    welcome: {
      en: { subject: input.welcome.en.subject.trim(), body: input.welcome.en.body.trim() },
      fa: { subject: input.welcome.fa.subject.trim(), body: input.welcome.fa.body.trim() },
    },
  };

  await db
    .insert(settings)
    .values({ key: "email_templates", value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });

  return loadEmailTemplates();
}

/**
 * Resets a single template or all templates to the built-in defaults.
 */
export async function resetStoredEmailTemplates(templateKey?: EmailTemplateKey): Promise<AllEmailTemplates> {
  if (!templateKey) {
    await db.delete(settings).where(eq(settings.key, "email_templates"));
    return DEFAULT_EMAIL_TEMPLATES;
  }

  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, "email_templates"))
    .limit(1);

  if (row?.value && typeof row.value === "object") {
    const stored: StoredEmailTemplatesRow = { ...row.value };
    delete stored[templateKey];
    await db
      .insert(settings)
      .values({ key: "email_templates", value: stored })
      .onConflictDoUpdate({ target: settings.key, set: { value: stored } });
  }

  return loadEmailTemplates();
}

/**
 * Renders an email template with variable interpolation.
 */
export async function renderEmailTemplate(options: {
  key: EmailTemplateKey;
  locale: string;
  variables: { name?: string; url?: string; [k: string]: string | undefined };
}): Promise<{ subject: string; text: string }> {
  const all = await loadEmailTemplates();
  const templateEntry = all[options.key] ?? DEFAULT_EMAIL_TEMPLATES[options.key];
  const lang = options.locale === "fa" ? "fa" : "en";
  const localized = templateEntry[lang] ?? templateEntry.en;

  const subject = interpolateEmailText(localized.subject, options.variables);
  const text = interpolateEmailText(localized.body, options.variables);

  return { subject, text };
}
