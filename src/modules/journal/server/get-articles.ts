import { asc, desc, eq } from "drizzle-orm";
import { cache } from "react";

import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { db } from "@/server/db";
import { journalArticles } from "@/server/db/schema";

import {
  type JournalArticle,
  type JournalArticleSummary,
  type JournalBlock,
  journalCategories,
  type JournalFilters,
  type JournalStoredBlock,
} from "../types";

export const JOURNAL_PAGE_SIZE = 6;
const WORDS_PER_MINUTE = 200;

export type JournalRow = typeof journalArticles.$inferSelect;

// The journal is small (tens of essays), so it is read once per request and filtered in
// memory. Move filtering into SQL when it grows into the hundreds.

/** Every essay, drafts included, newest first. The studio needs the whole shelf. */
export const getJournalRows = cache(async (): Promise<JournalRow[]> =>
  db.select().from(journalArticles).orderBy(desc(journalArticles.publishedAt), asc(journalArticles.slug)),
);

/** What readers see. A draft is invisible outside the studio. */
export const getPublishedRows = cache(async () => (await getJournalRows()).filter((a) => a.status === "published"));

function toBlocks(body: JournalStoredBlock[], locale: Locale): JournalBlock[] {
  return body.map((block): JournalBlock => {
    switch (block.type) {
      case "p":
      case "h2":
        return { type: block.type, text: localize(block.text, locale) };
      case "quote":
        return { type: "quote", text: localize(block.text, locale), source: localize(block.source, locale) };
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
          items: block.items.map((item) => ({ title: localize(item.title, locale), body: localize(item.body, locale) })),
        };
    }
  });
}

function readMinutes(blocks: JournalBlock[]) {
  const text = blocks
    .map((b) => ("items" in b ? b.items.map((i) => `${i.title} ${i.body}`).join(" ") : "text" in b ? b.text : b.caption))
    .join(" ");
  return Math.max(2, Math.round(text.split(/\s+/).length / WORDS_PER_MINUTE));
}

export function toSummary(row: JournalRow, locale: Locale): JournalArticleSummary {
  return {
    slug: row.slug,
    title: localize(row.title, locale),
    excerpt: localize(row.excerpt, locale),
    category: row.category,
    issue: row.issue,
    tags: row.tags.map((tag) => localize(tag, locale)),
    author: {
      name: localize(row.authorName, locale),
      role: localize(row.authorRole, locale),
      image: row.authorImage,
    },
    // A draft has no publication date yet; its own timestamp stands in so sorting still works.
    publishedAt: row.publishedAt ?? row.createdAt,
    readMinutes: readMinutes(toBlocks(row.body, locale)),
    image: row.image,
    imageAlt: localize(row.imageAlt, locale),
  };
}

function toArticle(row: JournalRow, locale: Locale): JournalArticle {
  const body = toBlocks(row.body, locale);
  return { ...toSummary(row, locale), readMinutes: readMinutes(body), body, practices: row.practices };
}

export function parseJournalFilters(params: Record<string, string | string[] | undefined>): JournalFilters {
  const one = (key: string) => (typeof params[key] === "string" ? params[key] : undefined);
  const category = one("category");
  const page = Number(one("page") ?? 1);
  const q = one("q")?.trim().slice(0, 100);
  return {
    q: q === "" ? undefined : q, // an empty search box is no search
    category: journalCategories.includes(category as never) ? (category as JournalFilters["category"]) : undefined,
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

/** Every essay including drafts — the studio's journal overview. */
export async function getAllArticleSummaries(locale: Locale): Promise<JournalArticleSummary[]> {
  return (await getJournalRows()).map((row) => toSummary(row, locale));
}

export async function getJournal(locale: Locale, filters: JournalFilters) {
  const newest = await getPublishedRows();
  const browsing = !filters.q && !filters.category;
  // The lead essay sits above the grid only on the unfiltered first page.
  const featured = browsing && filters.page === 1 ? (newest.find((a) => a.featured) ?? null) : null;

  const q = filters.q?.toLocaleLowerCase(locale);
  const matches = newest.filter((row) => {
    if (row.slug === featured?.slug) return false;
    if (filters.category && row.category !== filters.category) return false;
    if (!q) return true;
    const haystack = [row.title, row.excerpt, ...row.tags].map((l) => localize(l, locale)).join(" ");
    return haystack.toLocaleLowerCase(locale).includes(q);
  });

  const pageCount = Math.max(1, Math.ceil(matches.length / JOURNAL_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const start = (page - 1) * JOURNAL_PAGE_SIZE;
  return {
    featured: featured ? toSummary(featured, locale) : null,
    items: matches.slice(start, start + JOURNAL_PAGE_SIZE).map((row) => toSummary(row, locale)),
    total: newest.length,
    matching: matches.length,
    range: { from: matches.length ? start + 1 : 0, to: Math.min(start + JOURNAL_PAGE_SIZE, matches.length) },
    page,
    pageCount,
  };
}

export async function getArticle(locale: Locale, slug: string): Promise<JournalArticle | null> {
  const [row] = await db.select().from(journalArticles).where(eq(journalArticles.slug, slug)).limit(1);
  // A draft is reachable only from the studio's preview link, never from the public journal.
  return row?.status === "published" ? toArticle(row, locale) : null;
}

/** One essay as stored, for the studio editor. */
export async function getArticleRow(slug: string): Promise<JournalRow | null> {
  const [row] = await db.select().from(journalArticles).where(eq(journalArticles.slug, slug)).limit(1);
  return row ?? null;
}

/** Same category first, then the newest of the rest. */
export async function getRelatedArticles(locale: Locale, article: JournalArticleSummary, limit = 3) {
  const others = (await getPublishedRows()).filter((a) => a.slug !== article.slug);
  return [...others.filter((a) => a.category === article.category), ...others.filter((a) => a.category !== article.category)]
    .slice(0, limit)
    .map((row) => toSummary(row, locale));
}
