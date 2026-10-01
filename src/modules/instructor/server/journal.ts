import { eq, sql } from "drizzle-orm";

import type { Localized } from "@/lib/localized";
import type { JournalCategory, JournalStoredBlock } from "@/modules/journal/types";
import { db } from "@/server/db";
import { journalArticles } from "@/server/db/schema";

/** Each helper reports whether a row matched, so an action can reject a stale slug. */
const touched = (rows: { slug: string }[]) => rows.length > 0;

export type JournalFields = {
  category: JournalCategory;
  issue: number;
  title: Localized;
  excerpt: Localized;
  tags: Localized[];
  authorName: Localized;
  authorRole: Localized;
  authorImage: string | null;
  image: string;
  imageAlt: Localized;
  body: JournalStoredBlock[];
  practices: string[];
};

/** A slug the owner never has to think about: derived from the English title, kept unique. */
export async function uniqueSlug(title: string) {
  const base =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "essay";

  const taken = new Set(
    (await db.select({ slug: journalArticles.slug }).from(journalArticles)).map((r) => r.slug),
  );
  if (!taken.has(base)) return base;
  for (let n = 2; n < 500; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  return `${base}-${Date.now().toString(36)}`;
}

/** The next issue number, so a new essay lands in sequence without anyone counting. */
export async function nextIssue() {
  const [row] = await db.select({ max: sql<number>`coalesce(max(${journalArticles.issue}), 0)::int` }).from(journalArticles);
  return (row?.max ?? 0) + 1;
}

export async function createArticle(slug: string, fields: JournalFields) {
  const rows = await db
    .insert(journalArticles)
    .values({ slug, status: "draft", ...fields })
    .returning({ slug: journalArticles.slug });
  return touched(rows);
}

export async function updateArticle(slug: string, fields: JournalFields) {
  const rows = await db.update(journalArticles).set(fields).where(eq(journalArticles.slug, slug)).returning({ slug: journalArticles.slug });
  return touched(rows);
}

/**
 * Publishing stamps `publishedAt` the first time only, so the journal keeps its order when an
 * essay is pulled back to draft and published again.
 */
export async function setArticleStatus(slug: string, status: "draft" | "published") {
  const [existing] = await db.select({ publishedAt: journalArticles.publishedAt }).from(journalArticles).where(eq(journalArticles.slug, slug)).limit(1);
  if (!existing) return false;

  const rows = await db
    .update(journalArticles)
    .set({ status, publishedAt: status === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt })
    .where(eq(journalArticles.slug, slug))
    .returning({ slug: journalArticles.slug });
  return touched(rows);
}

/** Only one essay leads the journal, so featuring a new one steps the previous one down. */
export async function setArticleFeatured(slug: string, featured: boolean) {
  if (featured) await db.update(journalArticles).set({ featured: false }).where(eq(journalArticles.featured, true));
  const rows = await db.update(journalArticles).set({ featured }).where(eq(journalArticles.slug, slug)).returning({ slug: journalArticles.slug });
  return touched(rows);
}

export async function deleteArticle(slug: string) {
  const rows = await db.delete(journalArticles).where(eq(journalArticles.slug, slug)).returning({ slug: journalArticles.slug });
  return touched(rows);
}

export type JournalInventoryItem = {
  slug: string;
  status: "draft" | "published";
  featured: boolean;
  category: JournalCategory;
  issue: number;
  title: string;
  excerpt: string;
  image: string;
  authorName: string;
  blocks: number;
  publishedAt: Date | null;
  updatedAt: Date;
};
