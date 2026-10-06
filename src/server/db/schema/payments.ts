import { index, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth.ts";
import { createTable } from "./table.ts";

// The payment flow: checkouts, the payment ledger and applied provider events.

/**
 * One attempt to buy a plan: created before the member is sent to the provider's page, and
 * completed by the provider's confirmation (a webhook, or a verify call on return). The id is
 * the reference handed to the provider, so its confirmation always names what was bought.
 */
export const checkouts = createTable(
  "checkout",
  (d) => ({
    id: d.text().primaryKey(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planId: d.text().notNull(),
    provider: d.text().notNull(),
    /** What the member agreed to pay per period, frozen at checkout. */
    amount: d.numeric({ precision: 14, scale: 2, mode: "number" }).notNull(),
    currency: d.text().notNull(),
    intervalMonths: d.integer().notNull(),
    trialDays: d.integer().notNull().default(0),
    /** Pays the next period of an existing membership (manual renewal, e.g. Zarinpal). */
    renewal: d.boolean().notNull().default(false),
    status: d.text().$type<"open" | "completed" | "failed" | "canceled">().notNull().default("open"),
    /** The provider's own id for this checkout (session id, authority, …). */
    providerReference: d.text(),
    locale: d.varchar({ length: 8 }).notNull(),
    /** Where the member goes after the welcome page. */
    nextPath: d.text().notNull().default("/practices"),
    couponCode: d.text(),
    discountAmount: d.numeric({ precision: 14, scale: 2, mode: "number" }).notNull().default(0),
    giftId: d.text(),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
    completedAt: d.timestamp({ withTimezone: true }),
  }),
  (t) => [index("checkout_user_idx").on(t.userId, t.createdAt)],
);

/**
 * Every charge a provider confirmed, and its refunds. Kept when an account is deleted (the
 * email is copied onto the row), because the studio's books must not change after the fact.
 */
export const payments = createTable(
  "payment",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d.text().references(() => user.id, { onDelete: "set null" }),
    email: d.text().notNull(),
    checkoutId: d.text(),
    provider: d.text().notNull(),
    providerPaymentId: d.text().notNull(),
    planId: d.text().notNull(),
    kind: d.text().$type<"first" | "renewal">().notNull(),
    amount: d.numeric({ precision: 14, scale: 2, mode: "number" }).notNull(),
    currency: d.text().notNull(),
    status: d.text().$type<"paid" | "partially_refunded" | "refunded">().notNull().default("paid"),
    refundedAmount: d.numeric({ precision: 14, scale: 2, mode: "number" }).notNull().default(0),
    /** The membership period this charge paid for. */
    periodStart: d.timestamp({ withTimezone: true }).notNull(),
    periodEnd: d.timestamp({ withTimezone: true }).notNull(),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
    refundedAt: d.timestamp({ withTimezone: true }),
  }),
  (t) => [
    uniqueIndex("payment_provider_ref_idx").on(t.provider, t.providerPaymentId),
    index("payment_user_idx").on(t.userId, t.createdAt),
    index("payment_created_idx").on(t.createdAt),
  ],
);

/** Provider events already applied, so a retried webhook or a reloaded return page counts once. */
export const paymentEvents = createTable(
  "payment_event",
  (d) => ({
    provider: d.text().notNull(),
    eventId: d.text().notNull(),
    type: d.text().notNull(),
    payload: d.jsonb().$type<Record<string, unknown>>().notNull(),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [primaryKey({ columns: [t.provider, t.eventId] })],
);
