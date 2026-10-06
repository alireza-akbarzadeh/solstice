import { index } from "drizzle-orm/pg-core";
import { user } from "./auth.ts";
import { createTable } from "./table.ts";

/**
 * Private instructor notes on a member's dossier.
 * Strictly dated and instructor-only — never visible to the member.
 */
export const memberNotes = createTable(
  "member_note",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    instructorId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: d.text().notNull(),
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
    index("member_note_user_idx").on(t.userId),
    index("member_note_created_at_idx").on(t.createdAt),
  ],
);
