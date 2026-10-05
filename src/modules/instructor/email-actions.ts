"use server";

import { getTranslations } from "next-intl/server";

import { getEmailProvider } from "@/infrastructure/email";
import { emailSettingsSchema } from "@/modules/email/schemas";
import { getEmailSettingsView, saveEmailSettings, type EmailSettingsView } from "@/modules/email/server/settings";
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
  | { ok: false; error: "forbidden" } | { ok: false; error: "delivery"; detail: string };

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
