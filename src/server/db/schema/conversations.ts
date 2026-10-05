import { index, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth.ts";
import { membershipPlans } from "./memberships.ts";
import { createTable } from "./table.ts";

// Conversations with the studio: 1:1 guidance threads (members on a plan with guidance) and
// quick-help chats with the AI assistant (anyone, visitors included), which a person can take
// over when asked. Every message records who wrote it — member, instructor or AI.

export const conversations = createTable(
  "conversation",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    kind: d.text().$type<"guidance" | "assistant">().notNull(),
    /** The member; null for a visitor's quick-help chat (then `visitorId` is set). */
    userId: d.text().references(() => user.id, { onDelete: "cascade" }),
    /** Random id in a visitor's cookie, so they find their chat again. */
    visitorId: d.text(),
    /** Hash of the visitor's address, for rate limits that survive a cleared cookie. */
    clientKey: d.text(),
    /** How a visitor asked to be reached when they asked for a person. */
    guestName: d.text(),
    guestEmail: d.text(),
    /** Guidance threads: before joining / during a practice (the Stitch tabs). */
    topic: d.text().$type<"path" | "practice">(),
    subject: d.text().notNull().default(""),
    /**
     * open: only the assistant has answered (not in the studio's queue); waiting: a person needs
     * to answer; answered: the studio replied last; closed.
     */
    status: d.text().$type<"open" | "waiting" | "answered" | "closed">().notNull(),
    /** When it last started waiting for the studio: the queue's order. */
    waitingSince: d.timestamp({ withTimezone: true }),
    locale: d.varchar({ length: 8 }).notNull(),
    lastMessageAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
    /** Read marks for unread dots: the member/visitor side and the studio side. */
    memberReadAt: d.timestamp({ withTimezone: true }),
    staffReadAt: d.timestamp({ withTimezone: true }),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [
    index("conversation_user_idx").on(t.userId),
    index("conversation_visitor_idx").on(t.visitorId),
    index("conversation_queue_idx").on(t.kind, t.status, t.waitingSince),
  ],
);

export const conversationMessages = createTable(
  "conversation_message",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    conversationId: d
      .integer()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    author: d.text().$type<"member" | "instructor" | "ai">().notNull(),
    /** The person who wrote it (member or instructor); null for AI and visitors. */
    authorId: d.text().references(() => user.id, { onDelete: "set null" }),
    body: d.text().notNull(),
    /** A practice moment the message points to (guidance: "at 14:22 in Solar Flow"). */
    practiceSlug: d.text(),
    practiceAt: d.integer(),
    /** The AI model that wrote an AI message. */
    model: d.text(),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [index("conversation_message_conversation_idx").on(t.conversationId, t.id)],
);

/** Members waiting for a place on a full guidance plan; the studio tells them when one opens. */
export const guidanceWaitlist = createTable(
  "guidance_waitlist",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    planId: d
      .text()
      .notNull()
      .references(() => membershipPlans.id, { onDelete: "cascade" }),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    notifiedAt: d.timestamp({ withTimezone: true }),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [uniqueIndex("guidance_waitlist_plan_user_idx").on(t.planId, t.userId)],
);
