import { index, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth.ts";
import { createTable } from "./table.ts";

export type WorkshopRegistrationStatus =
  | "registered"
  | "waitlist"
  | "confirmed"
  | "canceled";

export const eventRegistrations = createTable(
  "event_registration",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    pageSlug: d.text().notNull(),
    userId: d.text().references(() => user.id, { onDelete: "set null" }),
    name: d.text().notNull(),
    email: d.text().notNull(),
    phone: d.text().notNull(),
    status: d
      .text()
      .$type<WorkshopRegistrationStatus>()
      .default("registered")
      .notNull(),
    notes: d.text(),
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
  (t) => [
    index("event_reg_slug_idx").on(t.pageSlug),
    index("event_reg_email_idx").on(t.email),
    index("event_reg_status_idx").on(t.status),
    uniqueIndex("event_reg_slug_email_idx").on(t.pageSlug, t.email),
  ],
);
