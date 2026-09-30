export const journalCategories = [
  "somatic",
  "breath",
  "morning",
  "sleep",
  "philosophy",
  "space",
] as const;
export type JournalCategory = (typeof journalCategories)[number];

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
