import { index } from "drizzle-orm/pg-core";
import { user } from "./auth.ts";
import { createTable } from "./table.ts";

/**
 * Member onboarding and sanctuary preferences:
 * Level, goals, available time, and mindful physical limits/injuries.
 * Editable by the member in their profile, and surfaced in the instructor dossier & Today.
 */
export const memberOnboarding = createTable(
  "member_onboarding",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .text()
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    experienceLevel: d
      .text()
      .$type<"beginner" | "intermediate" | "advanced">()
      .notNull()
      .default("beginner"),
    primaryGoals: d
      .jsonb()
      .$type<string[]>()
      .notNull()
      .$defaultFn(() => []),
    timeAvailable: d
      .text()
      .$type<"15_mins" | "30_mins" | "45_plus">()
      .notNull()
      .default("30_mins"),
    injuriesAndLimits: d.text(),
    completedAt: d.timestamp({ withTimezone: true }),
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
    index("member_onboarding_user_idx").on(t.userId),
    index("member_onboarding_level_idx").on(t.experienceLevel),
  ],
);
