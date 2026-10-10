import { index, primaryKey } from "drizzle-orm/pg-core";

import { user } from "./auth.ts";
import { practices } from "./content.ts";
import { createTable } from "./table.ts";

/**
 * Member personal playlists & collections ("Morning Vitality", "Evening Wind Down").
 * Allows members to curate and save personalized sequences of practices.
 */
export const playlists = createTable(
  "playlist",
  (d) => ({
    id: d.text().primaryKey(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: d.text().notNull(),
    description: d.text(),
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
  (t) => [index("playlist_user_idx").on(t.userId, t.createdAt)],
);

/**
 * Practices included in a member's playlist, with customized ordering.
 */
export const playlistItems = createTable(
  "playlist_item",
  (d) => ({
    playlistId: d
      .text()
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    practiceSlug: d
      .text()
      .notNull()
      .references(() => practices.slug, { onDelete: "cascade" }),
    sortOrder: d.integer().notNull().default(0),
    addedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    primaryKey({ columns: [t.playlistId, t.practiceSlug] }),
    index("playlist_item_playlist_idx").on(t.playlistId, t.sortOrder),
  ],
);
