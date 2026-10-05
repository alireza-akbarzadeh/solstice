import { desc, like } from "drizzle-orm";
import nodemailer, { type Transporter } from "nodemailer";

import { env } from "@/env";
import { db } from "@/server/db";
import { emailOutbox } from "@/server/db/schema";

import { loadEmailConfig, type EmailConfig } from "./config";

export { emailEnv, loadEmailConfig, readStoredEmailSettings, smtpSecurities, type EmailConfig, type SmtpSecurity, type StoredEmailSettings } from "./config";

// EmailProvider boundary (README: providers stay replaceable). Callers build the message;
// providers only deliver it. Which provider runs is a studio setting (/instructor/email).

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  /** The link the message is about (reset, verify), for providers that render buttons. */
  actionUrl?: string;
  /** One-click unsubscribe (newsletters): sent as the List-Unsubscribe header. */
  unsubscribeUrl?: string;
};

export interface EmailProvider {
  id: string;
  /** No real delivery: messages are readable in the test mailbox. */
  testMode: boolean;
  send(message: EmailMessage): Promise<void>;
}

// Keeps every message in solstice_email_outbox and logs it. Development / demo only.
const outboxProvider: EmailProvider = {
  id: "outbox",
  testMode: true,
  async send(message) {
    await db.insert(emailOutbox).values({ to: message.to, subject: message.subject, text: message.text, actionUrl: message.actionUrl ?? null });
    console.info(`[email:outbox] to=${message.to} subject="${message.subject}" ${message.actionUrl ?? ""}`);
  },
};

// One pooled connection per SMTP configuration; a changed setting opens a new one.
let pooled: { key: string; transport: Transporter } | null = null;
function transportFor(smtp: EmailConfig["smtp"]) {
  const key = JSON.stringify(smtp);
  if (pooled?.key !== key) {
    pooled?.transport.close();
    pooled = {
      key,
      transport: nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.security === "ssl",
        requireTLS: smtp.security === "starttls",
        ignoreTLS: smtp.security === "none",
        auth: smtp.user ? { user: smtp.user, pass: smtp.password ?? "" } : undefined,
        pool: true,
        connectionTimeout: 15_000,
      }),
    };
  }
  return pooled.transport;
}

function smtpProvider(config: EmailConfig): EmailProvider {
  return {
    id: "smtp",
    testMode: false,
    async send(message) {
      await transportFor(config.smtp).sendMail({
        from: config.from.name ? { name: config.from.name, address: config.from.address } : config.from.address,
        to: message.to,
        replyTo: config.replyTo,
        subject: message.subject,
        text: message.text,
        headers: message.unsubscribeUrl
          ? { "List-Unsubscribe": `<${message.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
          : undefined,
      });
    },
  };
}

/** The provider the studio chose. SMTP needs a host and a sender; until then mail stays in the outbox. */
export async function getEmailProvider(): Promise<EmailProvider> {
  const config = await loadEmailConfig();
  return config.provider === "smtp" && config.smtp.host && config.from.address ? smtpProvider(config) : outboxProvider;
}

export async function sendEmail(message: EmailMessage) {
  await (await getEmailProvider()).send(message);
}

/** True while mail is kept in the test mailbox instead of delivered. */
export async function emailTestMode() {
  return (await getEmailProvider()).testMode;
}

/** Checks the SMTP settings by connecting and logging in, without sending anything. */
export async function verifySmtp(smtp: EmailConfig["smtp"]) {
  await transportFor(smtp).verify();
}

/** The latest outbox messages. Outside development only test accounts' mail is shown,
 *  so a shared test deployment never exposes a real person's reset link. */
export async function readOutbox(limit = 30) {
  const onlyTestAccounts = env.NODE_ENV !== "development";
  return db
    .select()
    .from(emailOutbox)
    .where(onlyTestAccounts ? like(emailOutbox.to, `%${TEST_EMAIL_DOMAIN}`) : undefined)
    .orderBy(desc(emailOutbox.createdAt))
    .limit(limit);
}

/** One-click test accounts use this domain (modules/memberships/test-actions.ts). */
export const TEST_EMAIL_DOMAIN = "@solstice.test";
