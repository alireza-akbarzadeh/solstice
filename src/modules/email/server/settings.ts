import { emailEnv, loadEmailConfig, readStoredEmailSettings, type SmtpSecurity, type StoredEmailSettings } from "@/infrastructure/email";
import { seal } from "@/lib/secret-box";
import { db } from "@/server/db";
import { settings } from "@/server/db/schema";

import type { EmailSettingsInput } from "../schemas";

/** What the studio's Email page shows: the settings (never the password), and what the server fixes. */
export type EmailSettingsView = {
  provider: "outbox" | "smtp";
  host: string;
  port: string;
  security: SmtpSecurity;
  user: string;
  fromName: string;
  fromAddress: string;
  replyTo: string;
  passwordLast4: string | null;
  /** Fields set by environment variables, which win and can't be edited here. */
  fromEnv: { host: boolean; port: boolean; security: boolean; user: boolean; password: boolean; fromAddress: boolean };
  /** What actually delivers mail now (SMTP needs a host and a sender address). */
  active: "outbox" | "smtp";
};

export async function getEmailSettingsView(): Promise<EmailSettingsView> {
  const [stored, config] = await Promise.all([readStoredEmailSettings(), loadEmailConfig()]);
  const env = emailEnv();
  return {
    provider: config.provider,
    host: config.smtp.host,
    port: String(config.smtp.port),
    security: config.smtp.security,
    user: config.smtp.user ?? "",
    fromName: config.from.name,
    fromAddress: config.from.address,
    replyTo: config.replyTo ?? "",
    passwordLast4: env.password ? env.password.slice(-4) : (stored.password?.last4 ?? null),
    fromEnv: {
      host: !!env.host,
      port: !!env.port,
      security: !!env.security,
      user: !!env.user,
      password: !!env.password,
      fromAddress: !!env.fromAddress,
    },
    active: config.provider === "smtp" && config.smtp.host && config.from.address ? "smtp" : "outbox",
  };
}

export async function saveEmailSettings(input: EmailSettingsInput) {
  const current = await readStoredEmailSettings();
  // Fields the environment sets are shown read-only; keep what was stored for them.
  const env = emailEnv();
  const password = env.password
    ? current.password
    : input.password.trim()
      ? { sealed: seal(input.password), last4: input.password.slice(-4) }
      : input.clearPassword
        ? undefined
        : current.password;
  const value: StoredEmailSettings = {
    provider: input.provider,
    host: env.host ? current.host : input.host,
    port: env.port ? current.port : input.port,
    security: env.security ? current.security : input.security,
    user: env.user ? current.user : input.user,
    password,
    fromName: input.fromName,
    fromAddress: env.fromAddress ? current.fromAddress : input.fromAddress,
    replyTo: input.replyTo,
  };
  await db
    .insert(settings)
    .values({ key: "email", value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}
