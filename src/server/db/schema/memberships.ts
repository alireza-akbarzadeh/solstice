import { index } from "drizzle-orm/pg-core";

// Type-only imports: the seed scripts load the schema straight from Node.
import type { Localized } from "@/lib/localized";

import { user } from "./auth.ts";
import { createTable } from "./table.ts";

// Memberships, the plans they are on, and small site-wide settings (currency, payments).

// A member's subscription. One row per user; the payment provider keeps it in sync.
export const memberships = createTable(
  "membership",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .text()
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    /** The membership plan id (solstice_membership_plan.id), e.g. "monthly". */
    plan: d.text().notNull(),
    status: d
      .text()
      .$type<"trialing" | "active" | "past_due" | "canceled">()
      .notNull(),
    /** Which PaymentProvider manages this membership, e.g. "mock". */
    provider: d.text().notNull(),
    providerSubscriptionId: d.text(),
    trialEndsAt: d.timestamp({ withTimezone: true }),
    currentPeriodEnd: d.timestamp({ withTimezone: true }).notNull(),
    cancelAtPeriodEnd: d.boolean().default(false).notNull(),
    /** The period end a renewal reminder was sent for, so each period gets one (manual renewal only). */
    renewalReminderFor: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  }),
  (t) => [index("membership_status_idx").on(t.status)],
);

/**
 * Membership plans the instructor manages at /instructor/plans. A membership stores the plan
 * id, so a plan that members are on can be hidden from sale but never deleted.
 */
export const membershipPlans = createTable(
  "membership_plan",
  (d) => ({
    id: d.text().primaryKey(),
    status: d.text().$type<"active" | "hidden">().notNull().default("active"),
    /** The recommended plan: preselected at checkout and used for marketing copy. */
    featured: d.boolean().notNull().default(false),
    sortOrder: d.integer().notNull().default(0),
    name: d.jsonb().$type<Localized>().notNull(),
    description: d.jsonb().$type<Localized>().notNull(),
    /** Short highlight such as "Best value"; empty strings show no badge. */
    badge: d.jsonb().$type<Localized>().notNull(),
    features: d.jsonb().$type<Localized[]>().notNull().default([]),
    /** Price per billing period, in the site currency (solstice_setting "billing"). */
    price: d.numeric({ precision: 14, scale: 2, mode: "number" }).notNull(),
    /**
     * Price per billing period in every currency the plan is sold in (the site currency
     * included), e.g. { USD: 24, IRT: 1200000 }. A payment gateway is offered for the plan only
     * when it has a price in the gateway's currency.
     */
    prices: d.jsonb().$type<Partial<Record<string, number>>>().notNull().default({}),
    intervalMonths: d.integer().notNull(),
    trialDays: d.integer().notNull().default(0),
    /** Members on this plan can ask the instructor 1:1 (/guidance). */
    guidance: d.boolean().notNull().default(false),
    /** How many members the plan takes while guidance is on; 0 = no limit. Full plans aren't sold. */
    guidancePlaces: d.integer().notNull().default(0),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [index("membership_plan_status_idx").on(t.status)],
);

/** Small site-wide settings the studio edits, keyed by name (e.g. "billing"). */
export const settings = createTable("setting", (d) => ({
  key: d.text().primaryKey(),
  value: d.jsonb().$type<Record<string, unknown>>().notNull(),
  updatedAt: d
    .timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));
