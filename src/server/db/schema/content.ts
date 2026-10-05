import { index, primaryKey } from "drizzle-orm/pg-core";

// Type-only imports: the seed scripts load the schema straight from Node.
import type { PageContent } from "@/modules/pages/types";
import type { ProgramPacing, ProgramTone, StoredProgramWeek } from "@/modules/programs/types";
import type { Localized } from "@/lib/localized";
import type { JournalCategory, JournalStoredBlock } from "@/modules/journal/types";
import type { ImplementKind, IntensityLevel, PracticeAccess, PracticeCategory, PropSetup } from "@/modules/practices/types";

import { user } from "./auth.ts";
import { createTable } from "./table.ts";

// What the studio publishes: practices, programs, journal essays, categories and site pages.

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

/**
 * Practice and journal categories the instructor manages at /instructor/categories. Practices
 * and essays store the slug; a category in use can be hidden but not deleted.
 */
export const categories = createTable(
  "category",
  (d) => ({
    kind: d.text().$type<"practice" | "journal">().notNull(),
    slug: d.text().notNull(),
    name: d.jsonb().$type<Localized>().notNull(),
    sortOrder: d.integer().notNull().default(0),
    visible: d.boolean().notNull().default(true),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [primaryKey({ columns: [t.kind, t.slug] })],
);

// Page drafts are separate from published snapshots, so editing never changes live copy.
export const sitePages = createTable(
  "site_page",
  (d) => ({
    slug: d.text().primaryKey(),
    builtin: d.boolean().notNull().default(false),
    draftContent: d.jsonb().$type<PageContent>().notNull(),
    publishedContent: d.jsonb().$type<PageContent>(),
    publishedAt: d.timestamp({ withTimezone: true }),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [index("site_page_builtin_idx").on(t.builtin)],
);
