import { desc, like } from "drizzle-orm";

import { env } from "@/env";
import { db } from "@/server/db";
import { emailOutbox } from "@/server/db/schema";

// EmailProvider boundary (README: providers stay replaceable). Callers build the message;
// providers only deliver it.

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  /** The link the message is about (reset, verify), for providers that render buttons. */
  actionUrl?: string;
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
    await db.insert(emailOutbox).values({ ...message, actionUrl: message.actionUrl ?? null });
    console.info(`[email:outbox] to=${message.to} subject="${message.subject}" ${message.actionUrl ?? ""}`);
  },
};

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

const providers: Record<typeof env.EMAIL_PROVIDER, EmailProvider> = {
  outbox: outboxProvider,
};

export const emailProvider = providers[env.EMAIL_PROVIDER];
