import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  pgTable,
  primaryKey,
  pgTableCreator,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `solstice_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  // App fields, declared to Better Auth as `additionalFields` in better-auth/config.ts.
  role: text("role").$type<"member" | "instructor">().default("member").notNull(),
  practiceRhythm: text("practice_rhythm").$type<"morning" | "evening" | "breath">(),
  marketingOptIn: boolean("marketing_opt_in").default(false).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

// One row per browser/device that opted in to Web Push.
export const pushSubscriptions = createTable(
  "push_subscription",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: d.text().notNull().unique(),
    p256dh: d.text().notNull(),
    auth: d.text().notNull(),
    locale: d.varchar({ length: 8 }).notNull(),
    userAgent: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("push_subscription_user_idx").on(t.userId)],
);

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
    plan: d.text().$type<"monthly" | "annual">().notNull(),
    status: d.text().$type<"trialing" | "active" | "past_due" | "canceled">().notNull(),
    /** Which PaymentProvider manages this membership, e.g. "mock". */
    provider: d.text().notNull(),
    providerSubscriptionId: d.text(),
    trialEndsAt: d.timestamp({ withTimezone: true }),
    currentPeriodEnd: d.timestamp({ withTimezone: true }).notNull(),
    cancelAtPeriodEnd: d.boolean().default(false).notNull(),
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

// Practices aren't in the database yet (sample data), so rows point at them by slug.

// A reflection under a practice. Replies are one level deep (parentId → a top-level comment).
export const comments = createTable(
  "comment",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    practiceSlug: d.text().notNull(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: d.integer().references((): AnyPgColumn => comments.id, { onDelete: "cascade" }),
    body: d.text().notNull(),
    tag: d.text().$type<"epiphany" | "breath" | "release" | "inquiry">(),
    /** Moment in the video the reflection is about. */
    atSeconds: d.integer(),
    /** "private": only the author and the instructor see it. */
    visibility: d.text().$type<"circle" | "private">().default("circle").notNull(),
    pinned: d.boolean().default(false).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("comment_practice_idx").on(t.practiceSlug, t.createdAt), index("comment_parent_idx").on(t.parentId)],
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
    completedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("practice_completion_user_idx").on(t.userId, t.completedAt)],
);
