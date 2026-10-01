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

// Type-only imports: scripts/seed-practices.ts loads this file straight from Node.
import type {
  ProgramPacing,
  ProgramTone,
  StoredProgramWeek,
} from "@/modules/programs/types";
import type { Localized } from "@/lib/localized";
import type {
  JournalCategory,
  JournalStoredBlock,
} from "@/modules/journal/types";
import type {
  ImplementKind,
  IntensityLevel,
  PracticeAccess,
  PracticeCategory,
  PropSetup,
} from "@/modules/practices/types";

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
  role: text("role")
    .$type<"member" | "instructor">()
    .default("member")
    .notNull(),
  practiceRhythm: text("practice_rhythm").$type<
    "morning" | "evening" | "breath"
  >(),
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
    status: d
      .text()
      .$type<"trialing" | "active" | "past_due" | "canceled">()
      .notNull(),
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

// The practice library. Text the member reads is stored per locale ({ en, fa }).
// Seeded from modules/practices/sample-*.ts with `pnpm db:seed`; edited in /instructor/videos.
export const practices = createTable(
  "practice",
  (d) => ({
    slug: d.text().primaryKey(),
    status: d.text().$type<"draft" | "published">().default("draft").notNull(),
    featured: d.boolean().default(false).notNull(),
    title: d.jsonb().$type<Localized>().notNull(),
    summary: d.jsonb().$type<Localized>().notNull(),
    /** Series or style line shown above the title. */
    series: d.jsonb().$type<Localized>().notNull(),
    category: d.text().$type<PracticeCategory>().notNull(),
    intensityLevel: d.text().$type<IntensityLevel>().notNull(),
    intensityLabel: d.jsonb().$type<Localized>().notNull(),
    props: d.text().$type<PropSetup>().notNull(),
    durationMinutes: d.integer().notNull(),
    rating: d.real().default(0).notNull(),
    reviewCount: d.integer().default(0).notNull(),
    access: d.text().$type<PracticeAccess>().notNull(),
    /** Members-only practices: free preview length for non-members; null for none. */
    previewSeconds: d.integer(),
    image: d.text().notNull(),
    imageAlt: d.jsonb().$type<Localized>().notNull(),
    poster: d.text(),
    instructorNote: d.jsonb().$type<Localized>(),
    focus: d.jsonb().$type<Localized[]>().default([]).notNull(),
    implements: d
      .jsonb()
      .$type<{ kind: ImplementKind; name: Localized; detail: Localized }[]>()
      .default([])
      .notNull(),
    chapters: d
      .jsonb()
      .$type<
        { title: Localized; description: Localized; startSeconds: number }[]
      >()
      .default([])
      .notNull(),
    /** Which VideoProvider holds the video, and its id there (the mock: a video URL). */
    videoProvider: d.text(),
    videoAssetId: d.text(),
    publishedAt: d.timestamp({ withTimezone: true }),
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
  (t) => [index("practice_status_idx").on(t.status)],
);

// Curriculum is small and edited as a whole; weeks and ordered practice slugs live in JSON.
export const programs = createTable(
  "program",
  (d) => ({
    slug: d.text().primaryKey(),
    status: d.text().$type<"draft" | "published">().default("draft").notNull(),
    featured: d.boolean().default(false).notNull(),
    title: d.jsonb().$type<Localized>().notNull(),
    description: d.jsonb().$type<Localized>().notNull(),
    heroTitle: d.jsonb().$type<Localized>().notNull(),
    lede: d.jsonb().$type<Localized>().notNull(),
    badge: d.jsonb().$type<Localized>().notNull(),
    cta: d.jsonb().$type<Localized>().notNull(),
    note: d.jsonb().$type<Localized>().notNull(),
    image: d.text().notNull(),
    imageAlt: d.jsonb().$type<Localized>().notNull(),
    tone: d.text().$type<ProgramTone>().default("primary").notNull(),
    icon: d.text().$type<"sunrise" | "brain">().default("sunrise").notNull(),
    pacing: d.text().$type<ProgramPacing>().default("self").notNull(),
    weeks: d.jsonb().$type<StoredProgramWeek[]>().default([]).notNull(),
    publishedAt: d.timestamp({ withTimezone: true }),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }),
  (t) => [index("program_status_idx").on(t.status)],
);

/**
 * The journal. Text the reader sees is stored per locale ({ en, fa }), as the practice library
 * does, so the studio can edit both languages side by side without touching code.
 *
 * `body` is the essay itself: an ordered list of blocks the reader's page knows how to render.
 * The author travels on the row rather than in a separate table, so a guest essay can be
 * published without an account existing for its writer.
 */
export const journalArticles = createTable(
  "journal_article",
  (d) => ({
    slug: d.text().primaryKey(),
    status: d.text().$type<"draft" | "published">().default("draft").notNull(),
    /** The lead essay above the grid on /journal. Only the newest featured one is used. */
    featured: d.boolean().default(false).notNull(),
    category: d.text().$type<JournalCategory>().notNull(),
    issue: d.integer().default(1).notNull(),
    title: d.jsonb().$type<Localized>().notNull(),
    excerpt: d.jsonb().$type<Localized>().notNull(),
    tags: d.jsonb().$type<Localized[]>().default([]).notNull(),
    authorName: d.jsonb().$type<Localized>().notNull(),
    authorRole: d.jsonb().$type<Localized>().notNull(),
    authorImage: d.text(),
    image: d.text().notNull(),
    imageAlt: d.jsonb().$type<Localized>().notNull(),
    body: d.jsonb().$type<JournalStoredBlock[]>().default([]).notNull(),
    /** Library practices the essay puts into the body, by slug. */
    practices: d.jsonb().$type<string[]>().default([]).notNull(),
    publishedAt: d.timestamp({ withTimezone: true }),
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
  (t) => [index("journal_status_idx").on(t.status)],
);

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
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("comment_practice_idx").on(t.practiceSlug, t.createdAt),
    index("comment_parent_idx").on(t.parentId),
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

// "The New Moon Epistle" sign-ups (footer + journal). Sending waits for an EmailProvider.
export const newsletterSubscribers = createTable(
  "newsletter_subscriber",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    email: d.text().notNull().unique(),
    locale: d.varchar({ length: 8 }).notNull(),
    source: d.text().$type<"footer" | "journal">().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
);

// Messages sent by the "outbox" EmailProvider (no real delivery): read them in /test/mailbox.
export const emailOutbox = createTable(
  "email_outbox",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    to: d.text().notNull(),
    subject: d.text().notNull(),
    text: d.text().notNull(),
    /** The main link in the message (reset, verify), shown as a button in the mailbox. */
    actionUrl: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("email_outbox_created_idx").on(t.createdAt)],
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
