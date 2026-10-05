import { index } from "drizzle-orm/pg-core";

// Type-only imports: the seed scripts load the schema straight from Node.
import type { Localized } from "@/lib/localized";

import { user } from "./auth.ts";
import { createTable } from "./table.ts";

// Reaching people: web push subscriptions, the newsletter list and the email outbox.

// One row per browser/device that opted in to Web Push.
export const pushSubscriptions = createTable(
  "push_subscription",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: d.text().notNull().unique(),
    p256dh: d.text().notNull(),
    auth: d.text().notNull(),
    locale: d.varchar({ length: 8 }).notNull(),
    userAgent: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("push_subscription_user_idx").on(t.userId)],
);

// "The New Moon Epistle" sign-ups (footer + journal). Sending waits for an EmailProvider.
export const newsletterSubscribers = createTable(
  "newsletter_subscriber",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    email: d.text().notNull().unique(),
    locale: d.varchar({ length: 8 }).notNull(),
    source: d.text().$type<"footer" | "journal">().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
);

/**
 * A newsletter the studio sent from /instructor/subscribers: subject and body per language
 * (each subscriber gets their own, or the other when theirs is empty) and how delivery went.
 */
export const newsletterIssues = createTable("newsletter_issue", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  subject: d.jsonb().$type<Localized>().notNull(),
  body: d.jsonb().$type<Localized>().notNull(),
  recipients: d.integer().notNull().default(0),
  failed: d.integer().notNull().default(0),
  sentAt: d.timestamp({ withTimezone: true }),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

// Messages sent by the "outbox" EmailProvider (no real delivery): read them in /test/mailbox.
export const emailOutbox = createTable(
  "email_outbox",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    to: d.text().notNull(),
    subject: d.text().notNull(),
    text: d.text().notNull(),
    /** The main link in the message (reset, verify), shown as a button in the mailbox. */
    actionUrl: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("email_outbox_created_idx").on(t.createdAt)],
);
