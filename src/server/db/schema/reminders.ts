import { index } from "drizzle-orm/pg-core";
import { user } from "./auth.ts";
import { createTable } from "./table.ts";

/**
 * Tracks mindfulness nudges and inactivity reminders sent to students.
 * Prevents over-contacting members (e.g. max 1 nudge per 7-14 days)
 * and allows instructors to audit check-in history.
 */
export const practiceReminders = createTable(
  "practice_reminder",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: d
      .text()
      .$type<"inactivity_7d" | "inactivity_14d" | "manual_checkin">()
      .notNull(),
    channel: d.text().$type<"email" | "push" | "both">().notNull(),
    sentAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    notes: d.text(),
  }),
  (t) => [index("practice_reminder_user_idx").on(t.userId, t.sentAt)],
);

export type PracticeReminder = typeof practiceReminders.$inferSelect;
export type NewPracticeReminder = typeof practiceReminders.$inferInsert;
