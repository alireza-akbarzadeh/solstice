import { type AnyPgColumn, index, primaryKey } from "drizzle-orm/pg-core";

import { user } from "./auth.ts";
import { createTable } from "./table.ts";

// Reflections (comments) and their likes.

// A reflection under a practice, or (no practice) a post in the community circle.
// Replies are one level deep (parentId → a top-level comment).
export const comments = createTable(
  "comment",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    practiceSlug: d.text(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: d
      .integer()
      .references((): AnyPgColumn => comments.id, { onDelete: "cascade" }),
    body: d.text().notNull(),
    tag: d.text().$type<"epiphany" | "breath" | "release" | "inquiry">(),
    /** Moment in the video the reflection is about. */
    atSeconds: d.integer(),
    /** "private": only the author and the instructor see it. */
    visibility: d
      .text()
      .$type<"circle" | "private">()
      .default("circle")
      .notNull(),
    pinned: d.boolean().default(false).notNull(),
    /** Taken off the public feed by the instructor. The author still sees their own. */
    hidden: d.boolean().default(false).notNull(),
    /**
     * Members' circle reflections wait for the instructor's approval; until then only the
     * author and the instructor see them. Rows from before moderation default to approved.
     */
    status: d
      .text()
      .$type<"pending" | "approved" | "rejected">()
      .default("approved")
      .notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("comment_practice_idx").on(t.practiceSlug, t.createdAt),
    index("comment_parent_idx").on(t.parentId),
    index("comment_status_idx").on(t.status),
  ],
);

export const commentLikes = createTable(
  "comment_like",
  (d) => ({
    commentId: d
      .integer()
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.commentId, t.userId] })],
);
