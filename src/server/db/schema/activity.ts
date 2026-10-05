import { index, primaryKey } from "drizzle-orm/pg-core";

import { user } from "./auth.ts";
import { createTable } from "./table.ts";

// What members do with the library: favorites, finished sessions, program enrolments.

// "Save to Sanctuary".
export const favorites = createTable(
  "favorite",
  (d) => ({
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    practiceSlug: d.text().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.practiceSlug] })],
);

/**
 * "Held in heart": a member's like of a practice. Unlike favorites (a private list), likes are
 * counted publicly on the practice page.
 */
export const practiceLikes = createTable(
  "practice_like",
  (d) => ({
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    practiceSlug: d.text().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.practiceSlug] }), index("practice_like_slug_idx").on(t.practiceSlug)],
);

// One row per "Mark complete" — the history behind progress, streaks and minutes practiced.
export const practiceCompletions = createTable(
  "practice_completion",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    practiceSlug: d.text().notNull(),
    minutes: d.integer().notNull(),
    /** Set when completed as a day of a program the member is enrolled in. */
    programSlug: d.text(),
    programDay: d.integer(),
    completedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("practice_completion_user_idx").on(t.userId, t.completedAt)],
);

// A member following a program. Days unlock from startedAt (for daily-paced programs).
export const programEnrollments = createTable(
  "program_enrollment",
  (d) => ({
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    programSlug: d.text().notNull(),
    startedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.programSlug] })],
);
