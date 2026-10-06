import { index, uniqueIndex } from "drizzle-orm/pg-core";

import type { Localized } from "@/lib/localized";
import { user } from "./auth.ts";
import { createTable } from "./table.ts";

export type LiveClassStatus = "scheduled" | "live" | "completed" | "canceled";
export type LiveClassAccess = "members_only" | "open";

export const liveClasses = createTable(
  "live_class",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    slug: d.text().notNull().unique(),
    status: d.text().$type<LiveClassStatus>().default("scheduled").notNull(),
    title: d.jsonb().$type<Localized>().notNull(),
    description: d.jsonb().$type<Localized>().notNull(),
    instructorName: d.jsonb().$type<Localized>().notNull(),
    locationName: d.jsonb().$type<Localized>().notNull(),
    scheduledAt: d.timestamp({ withTimezone: true }).notNull(),
    durationMinutes: d.integer().default(60).notNull(),
    joinUrl: d.text().notNull(),
    capacity: d.integer(),
    access: d.text().$type<LiveClassAccess>().default("members_only").notNull(),
    replayPracticeSlug: d.text(),
    coverImage: d.text().default("/images/classes/kyoto-pavilion-stage.jpg").notNull(),
    soundscapeDetails: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("live_class_scheduled_at_idx").on(t.scheduledAt),
    index("live_class_status_idx").on(t.status),
    index("live_class_slug_idx").on(t.slug),
  ],
);

export const liveClassRsvps = createTable(
  "live_class_rsvp",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    classId: d
      .integer()
      .notNull()
      .references(() => liveClasses.id, { onDelete: "cascade" }),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    attended: d.boolean().default(false).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("live_class_rsvp_class_user_idx").on(t.classId, t.userId),
    index("live_class_rsvp_user_idx").on(t.userId),
  ],
);
