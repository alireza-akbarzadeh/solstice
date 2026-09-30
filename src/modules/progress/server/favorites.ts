import { and, desc, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { favorites } from "@/server/db/schema";

/** Saved practice slugs, most recently saved first. */
export async function getFavoriteSlugs(userId: string): Promise<string[]> {
  const rows = await db
    .select({ slug: favorites.practiceSlug })
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
  return rows.map((r) => r.slug);
}

export async function isFavorite(userId: string, practiceSlug: string) {
  const [row] = await db
    .select({ slug: favorites.practiceSlug })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.practiceSlug, practiceSlug)))
    .limit(1);
  return !!row;
}

export async function setFavorite(userId: string, practiceSlug: string, saved: boolean) {
  if (saved) {
    await db.insert(favorites).values({ userId, practiceSlug }).onConflictDoNothing();
  } else {
    await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.practiceSlug, practiceSlug)));
  }
}
