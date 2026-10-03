import type { Localized } from "@/lib/localized";

/** A category slug; the categories themselves are studio-managed (modules/categories). */
export type JournalCategory = string;

export type JournalAuthor = {
  name: string;
  role: string;
  /** Portrait for the instructor; guests show initials. */
  image: string | null;
};

export type JournalArticleSummary = {
  slug: string;
  title: string;
  excerpt: string;
  category: JournalCategory;
  issue: number;
  tags: string[];
  author: JournalAuthor;
  publishedAt: Date;
  readMinutes: number;
  image: string;
  imageAlt: string;
};

export type JournalBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; source: string }
  | { type: "figure"; image: string; alt: string; caption: string }
  | {
      type: "steps";
      title: string;
      intro: string;
      items: { title: string; body: string }[];
    };

/**
 * A body block as it sits in the database: the same shapes the reader sees, but with text
 * stored per locale. `JournalBlock` is the localized view the essay page renders.
 */
export type JournalStoredBlock =
  | { type: "p"; text: Localized }
  | { type: "h2"; text: Localized }
  | { type: "quote"; text: Localized; source: Localized }
  | { type: "figure"; image: string; alt: Localized; caption: Localized }
  | {
      type: "steps";
      title: Localized;
      intro: Localized;
      items: { title: Localized; body: Localized }[];
    };

export const journalBlockTypes = ["p", "h2", "quote", "figure", "steps"] as const;
export type JournalBlockType = (typeof journalBlockTypes)[number];

export type JournalArticle = JournalArticleSummary & {
  body: JournalBlock[];
  /** Library practices that put the essay into the body. */
  practices: string[];
};

export type JournalFilters = {
  q?: string;
  category?: JournalCategory;
  page: number;
};
