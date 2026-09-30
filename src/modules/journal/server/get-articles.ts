import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";

import {
  type SampleArticle,
  sampleArticles,
  sampleAuthors,
} from "../sample-articles";
import {
  type JournalArticle,
  type JournalArticleSummary,
  type JournalBlock,
  journalCategories,
  type JournalFilters,
} from "../types";

export const JOURNAL_PAGE_SIZE = 6;
const WORDS_PER_MINUTE = 200;

function toBlocks(article: SampleArticle, locale: Locale): JournalBlock[] {
  return article.body.map((block): JournalBlock => {
    switch (block.type) {
      case "p":
      case "h2":
        return { type: block.type, text: localize(block.text, locale) };
      case "quote":
        return {
          type: "quote",
          text: localize(block.text, locale),
          source: localize(block.source, locale),
        };
      case "figure":
        return {
          type: "figure",
          image: block.image,
          alt: localize(block.alt, locale),
          caption: localize(block.caption, locale),
        };
      case "steps":
        return {
          type: "steps",
          title: localize(block.title, locale),
          intro: localize(block.intro, locale),
          items: block.items.map((item) => ({
            title: localize(item.title, locale),
            body: localize(item.body, locale),
          })),
        };
    }
  });
}

function readMinutes(blocks: JournalBlock[]) {
  const text = blocks
    .map((b) =>
      b.type === "steps"
        ? [b.title, b.intro, ...b.items.flatMap((i) => [i.title, i.body])].join(
            " ",
          )
        : "text" in b
          ? b.text
          : b.caption,
    )
    .join(" ");
  return Math.max(2, Math.round(text.split(/\s+/).length / WORDS_PER_MINUTE));
}

function toArticle(article: SampleArticle, locale: Locale): JournalArticle {
  const author = sampleAuthors[article.author];
  const body = toBlocks(article, locale);
  return {
    slug: article.slug,
    title: localize(article.title, locale),
    excerpt: localize(article.excerpt, locale),
    category: article.category,
    issue: article.issue,
    tags: article.tags.map((tag) => localize(tag, locale)),
    author: {
      name: localize(author.name, locale),
      role: localize(author.role, locale),
      image: author.image,
    },
    publishedAt: new Date(`${article.publishedAt}T09:00:00Z`),
    readMinutes: readMinutes(body),
    image: article.image,
    imageAlt: localize(article.imageAlt, locale),
    body,
    practices: article.practices,
  };
}

const toSummary = (
  article: SampleArticle,
  locale: Locale,
): JournalArticleSummary => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drop the body from summaries
  const { body, practices, ...summary } = toArticle(article, locale);
  return summary;
};

export function parseJournalFilters(
  params: Record<string, string | string[] | undefined>,
): JournalFilters {
  const one = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined;
  const category = one("category");
  const page = Number(one("page") ?? 1);
  const q = one("q")?.trim().slice(0, 100);
  return {
    q: q === "" ? undefined : q, // an empty search box is no search
    category: journalCategories.includes(category as never)
      ? (category as JournalFilters["category"])
      : undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function journalFiltersToQuery(filters: Partial<JournalFilters>) {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.category) query.set("category", filters.category);
  if (filters.page && filters.page > 1) query.set("page", String(filters.page));
  const s = query.toString();
  return s ? `?${s}` : "";
}

// TODO(db): read posts from Drizzle once the posts schema exists (instructor publishing).
/** Every essay, newest first — the studio's journal overview needs the whole shelf. */
export async function getAllArticleSummaries(locale: Locale): Promise<JournalArticleSummary[]> {
  return [...sampleArticles]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map((a) => toSummary(a, locale));
}

export async function getJournal(locale: Locale, filters: JournalFilters) {
  const newest = [...sampleArticles].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
  const browsing = !filters.q && !filters.category;
  // The lead essay sits above the grid only on the unfiltered first page.
  const featured =
    browsing && filters.page === 1
      ? (newest.find((a) => a.featured) ?? null)
      : null;

  const q = filters.q?.toLocaleLowerCase(locale);
  const matches = newest.filter((article) => {
    if (article.slug === featured?.slug) return false;
    if (filters.category && article.category !== filters.category) return false;
    if (!q) return true;
    const haystack = [article.title, article.excerpt, ...article.tags]
      .map((l) => localize(l, locale))
      .join(" ");
    return haystack.toLocaleLowerCase(locale).includes(q);
  });

  const pageCount = Math.max(1, Math.ceil(matches.length / JOURNAL_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const start = (page - 1) * JOURNAL_PAGE_SIZE;
  return {
    featured: featured ? toSummary(featured, locale) : null,
    items: matches
      .slice(start, start + JOURNAL_PAGE_SIZE)
      .map((a) => toSummary(a, locale)),
    total: sampleArticles.length,
    matching: matches.length,
    range: {
      from: matches.length ? start + 1 : 0,
      to: Math.min(start + JOURNAL_PAGE_SIZE, matches.length),
    },
    page,
    pageCount,
  };
}

export async function getArticle(
  locale: Locale,
  slug: string,
): Promise<JournalArticle | null> {
  const article = sampleArticles.find((a) => a.slug === slug);
  return article ? toArticle(article, locale) : null;
}

/** Same category first, then the newest of the rest. */
export async function getRelatedArticles(
  locale: Locale,
  article: JournalArticleSummary,
  limit = 3,
) {
  const others = sampleArticles
    .filter((a) => a.slug !== article.slug)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return [
    ...others.filter((a) => a.category === article.category),
    ...others.filter((a) => a.category !== article.category),
  ]
    .slice(0, limit)
    .map((a) => toSummary(a, locale));
}
