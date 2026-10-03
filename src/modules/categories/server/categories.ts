import { and, asc, count, eq, max } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/server/db";
import { categories, journalArticles, practices } from "@/server/db/schema";

import { defaultCategories, type Category, type CategoryKind } from "../types";

const toCategory = (row: typeof categories.$inferSelect): Category => ({
  kind: row.kind,
  slug: row.slug,
  name: row.name,
  sortOrder: row.sortOrder,
  visible: row.visible,
});

/**
 * Every category of both kinds, in the studio's order. A missing table (a database that
 * hasn't run `pnpm db:seed:categories`) falls back to the original categories.
 */
export const getAllCategories = cache(async (): Promise<Category[]> => {
  try {
    const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.createdAt));
    return rows.map(toCategory);
  } catch (error) {
    console.error("Categories could not be read — run `pnpm db:seed:categories`.", error);
    return defaultCategories;
  }
});

/** One kind's categories; `visibleOnly` for public filters. */
export async function getCategories(kind: CategoryKind, { visibleOnly = false } = {}) {
  return (await getAllCategories()).filter((c) => c.kind === kind && (!visibleOnly || c.visible));
}

export async function categoryExists(kind: CategoryKind, slug: string) {
  return (await getCategories(kind)).some((c) => c.slug === slug);
}

/** How many practices or essays use each category. */
export async function getCategoryUsage(kind: CategoryKind) {
  const table = kind === "practice" ? practices : journalArticles;
  const rows = await db.select({ slug: table.category, n: count() }).from(table).groupBy(table.category);
  return Object.fromEntries(rows.map((row) => [row.slug, row.n])) as Record<string, number>;
}

// ── Studio mutations ────────────────────────────────────────────────────────────────

export type CategoryMutation = { ok: true; slug: string } | { ok: false; error: "notFound" | "inUse" | "duplicate" };

const where = (kind: CategoryKind, slug: string) => and(eq(categories.kind, kind), eq(categories.slug, slug));

export async function createCategory(kind: CategoryKind, input: { slug: string; name: Category["name"]; visible: boolean }): Promise<CategoryMutation> {
  const [last] = await db.select({ top: max(categories.sortOrder) }).from(categories).where(eq(categories.kind, kind));
  const [created] = await db
    .insert(categories)
    .values({ kind, ...input, sortOrder: (last?.top ?? -1) + 1 })
    .onConflictDoNothing()
    .returning({ slug: categories.slug });
  return created ? { ok: true, slug: created.slug } : { ok: false, error: "duplicate" };
}

/** The slug is fixed once created: practices and essays point at it. */
export async function updateCategory(kind: CategoryKind, slug: string, input: { name: Category["name"]; visible: boolean }): Promise<CategoryMutation> {
  const [updated] = await db.update(categories).set(input).where(where(kind, slug)).returning({ slug: categories.slug });
  return updated ? { ok: true, slug } : { ok: false, error: "notFound" };
}

export async function moveCategory(kind: CategoryKind, slug: string, direction: -1 | 1): Promise<CategoryMutation> {
  const order = (await db.select({ slug: categories.slug }).from(categories).where(eq(categories.kind, kind)).orderBy(asc(categories.sortOrder), asc(categories.createdAt))).map((r) => r.slug);
  const index = order.indexOf(slug);
  if (index === -1) return { ok: false, error: "notFound" };
  const target = index + direction;
  if (target < 0 || target >= order.length) return { ok: true, slug };
  [order[index], order[target]] = [order[target]!, order[index]!];
  await db.transaction(async (tx) => {
    for (const [position, value] of order.entries()) {
      await tx.update(categories).set({ sortOrder: position }).where(where(kind, value));
    }
  });
  return { ok: true, slug };
}

export async function deleteCategory(kind: CategoryKind, slug: string): Promise<CategoryMutation> {
  if (((await getCategoryUsage(kind))[slug] ?? 0) > 0) return { ok: false, error: "inUse" };
  const removed = await db.delete(categories).where(where(kind, slug)).returning({ slug: categories.slug });
  return removed.length ? { ok: true, slug } : { ok: false, error: "notFound" };
}
