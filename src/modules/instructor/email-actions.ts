"use server";

import { getTranslations } from "next-intl/server";

import { getEmailProvider } from "@/infrastructure/email";
import { emailSettingsSchema, emailTemplatesFormSchema } from "@/modules/email/schemas";
import { getEmailSettingsView, saveEmailSettings, type EmailSettingsView } from "@/modules/email/server/settings";
import {
  resetStoredEmailTemplates,
  saveStoredEmailTemplates,
} from "@/modules/email/server/templates";
import {
  interpolateEmailText,
  type AllEmailTemplates,
  type EmailTemplateKey,
} from "@/modules/email/templates";
import { getViewer } from "@/modules/memberships/server/viewer";

export type EmailSettingsResult = { ok: true; view: EmailSettingsView } | { ok: false; error: "forbidden" | "invalid" | "failed" };

export async function saveEmail(input: unknown): Promise<EmailSettingsResult> {
  if ((await getViewer()).user?.role !== "instructor") return { ok: false, error: "forbidden" };
  const parsed = emailSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    await saveEmailSettings(parsed.data);
  } catch {
    return { ok: false, error: "failed" };
  }
  return { ok: true, view: await getEmailSettingsView() };
}

export type TestEmailResult =
  | { ok: true; to: string; mailbox: boolean }
  | { ok: false; error: "forbidden" }
  | { ok: false; error: "delivery"; detail: string };

/** Sends a test message to the instructor with the saved settings; SMTP errors come back readable. */
export async function sendTestEmail(): Promise<TestEmailResult> {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") return { ok: false, error: "forbidden" };
  const [provider, t] = await Promise.all([getEmailProvider(), getTranslations("Studio.email.testMessage")]);
  try {
    await provider.send({ to: viewer.user.email, subject: t("subject"), text: t("body", { name: viewer.user.name }) });
  } catch (error) {
    // e.g. "Invalid login: 535 Authentication failed" or "connect ETIMEDOUT".
    return { ok: false, error: "delivery", detail: error instanceof Error ? error.message.slice(0, 200) : String(error) };
  }
  return { ok: true, to: viewer.user.email, mailbox: provider.testMode };
}

export type EmailTemplatesResult =
  | { ok: true; templates: AllEmailTemplates }
  | { ok: false; error: "forbidden" | "invalid" | "failed"; detail?: string };

export async function saveEmailTemplates(input: unknown): Promise<EmailTemplatesResult> {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") return { ok: false, error: "forbidden" };

  const parsed = emailTemplatesFormSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path.join(".") ?? "";
    const msg = firstIssue?.message ?? "invalid";
    return { ok: false, error: "invalid", detail: `${path}: ${msg}` };
  }

  try {
    const templates = await saveStoredEmailTemplates(parsed.data);
    return { ok: true, templates };
  } catch (error) {
    console.error("[email-actions] Failed to save email templates:", error);
    return { ok: false, error: "failed" };
  }
}

export async function resetEmailTemplate(key?: EmailTemplateKey): Promise<EmailTemplatesResult> {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") return { ok: false, error: "forbidden" };

  try {
    const templates = await resetStoredEmailTemplates(key);
    return { ok: true, templates };
  } catch (error) {
    console.error("[email-actions] Failed to reset email template:", error);
    return { ok: false, error: "failed" };
  }
}

export async function sendTemplatePreviewEmail(params: {
  key: EmailTemplateKey;
  locale: "en" | "fa";
  subject: string;
  body: string;
}): Promise<TestEmailResult> {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") return { ok: false, error: "forbidden" };

  const provider = await getEmailProvider();
  const sampleName = viewer.user.name || (params.locale === "fa" ? "النا" : "Elena");
  const sampleUrl = "https://arteyoga.com/sanctuary-preview";

  const interpolatedSubject = interpolateEmailText(params.subject, { name: sampleName, url: sampleUrl });
  const interpolatedBody = interpolateEmailText(params.body, { name: sampleName, url: sampleUrl });

  try {
    await provider.send({
      to: viewer.user.email,
      subject: `[Preview] ${interpolatedSubject}`,
      text: interpolatedBody,
      actionUrl: sampleUrl,
    });
  } catch (error) {
    return { ok: false, error: "delivery", detail: error instanceof Error ? error.message.slice(0, 200) : String(error) };
  }

  return { ok: true, to: viewer.user.email, mailbox: provider.testMode };
}
