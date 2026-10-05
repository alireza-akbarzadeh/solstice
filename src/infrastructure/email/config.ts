import { eq } from "drizzle-orm";

import { env } from "@/env";
import { open } from "@/lib/secret-box";
import { db } from "@/server/db";
import { settings } from "@/server/db/schema";

// How mail is delivered, read at send time: the "email" settings row the studio edits
// (/instructor/email, password sealed with lib/secret-box), with SMTP_* environment variables
// winning field by field. An SMTP_HOST in the environment switches delivery to SMTP.

import type { SmtpSecurity } from "./security";

export { smtpSecurities, type SmtpSecurity } from "./security";

export type EmailConfig = {
  provider: "outbox" | "smtp";
  smtp: { host: string; port: number; security: SmtpSecurity; user?: string; password?: string };
  from: { name: string; address: string };
  replyTo?: string;
};

/** The settings row as modules/email stores it. */
export type StoredEmailSettings = {
  provider?: "outbox" | "smtp";
  host?: string;
  port?: number;
  security?: SmtpSecurity;
  user?: string;
  password?: { sealed: string; last4: string };
  fromName?: string;
  fromAddress?: string;
  replyTo?: string;
};

export async function readStoredEmailSettings(): Promise<StoredEmailSettings> {
  try {
    const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "email")).limit(1);
    return row?.value ?? {};
  } catch {
    return {};
  }
}

/** Which fields the server's environment sets (and so the studio can't change). */
export const emailEnv = () => ({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  security: env.SMTP_SECURITY,
  user: env.SMTP_USER,
  password: env.SMTP_PASSWORD,
  fromAddress: env.EMAIL_FROM,
});

/** A blank field counts as unset. */
const filled = (value: string | undefined) => (value?.length ? value : undefined);

export async function loadEmailConfig(): Promise<EmailConfig> {
  const stored = await readStoredEmailSettings();
  const fromEnv = emailEnv();
  const port = fromEnv.port ?? stored.port ?? 587;
  const security = fromEnv.security ?? stored.security ?? (port === 465 ? "ssl" : "starttls");
  const sealed = stored.password?.sealed;
  return {
    provider: fromEnv.host ? "smtp" : (stored.provider ?? "outbox"),
    smtp: {
      host: fromEnv.host ?? stored.host ?? "",
      port,
      security,
      user: fromEnv.user ?? filled(stored.user),
      password: fromEnv.password ?? (sealed ? (open(sealed) ?? undefined) : undefined),
    },
    from: { name: stored.fromName ?? "", address: fromEnv.fromAddress ?? stored.fromAddress ?? "" },
    replyTo: filled(stored.replyTo),
  };
}
