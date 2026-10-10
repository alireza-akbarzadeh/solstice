import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { Locale } from "@/i18n/routing";
import { getPracticeSummaries } from "@/modules/practices/server/get-practice";
import { db } from "@/server/db";
import { playlistItems, playlists, practices } from "@/server/db/schema";
import type { PlaylistSummary, PlaylistWithPractices } from "../types";

/**
 * Retrieves all playlists owned by a member, enriched with item count, total minutes, and preview images.
 */
export async function getUserPlaylists(userId: string): Promise<PlaylistSummary[]> {
  const userPlaylists = await db
    .select({
      id: playlists.id,
      userId: playlists.userId,
      title: playlists.title,
      description: playlists.description,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
    })
    .from(playlists)
    .where(eq(playlists.userId, userId))
    .orderBy(desc(playlists.updatedAt));

  if (userPlaylists.length === 0) return [];

  const playlistIds = userPlaylists.map((p) => p.id);

  // Fetch items joined with practices
  const items = await db
    .select({
      playlistId: playlistItems.playlistId,
      practiceSlug: playlistItems.practiceSlug,
      durationMinutes: practices.durationMinutes,
      image: practices.image,
      sortOrder: playlistItems.sortOrder,
    })
    .from(playlistItems)
    .innerJoin(practices, eq(practices.slug, playlistItems.practiceSlug))
    .where(inArray(playlistItems.playlistId, playlistIds))
    .orderBy(asc(playlistItems.sortOrder));

  const itemsByPlaylist = new Map<
    string,
    { count: number; minutes: number; images: string[] }
  >();

  for (const item of items) {
    const entry = itemsByPlaylist.get(item.playlistId) ?? { count: 0, minutes: 0, images: [] };
    entry.count += 1;
    entry.minutes += item.durationMinutes;
    if (entry.images.length < 4 && item.image) {
      entry.images.push(item.image);
    }
    itemsByPlaylist.set(item.playlistId, entry);
  }

  return userPlaylists.map((p) => {
    const stats = itemsByPlaylist.get(p.id) ?? { count: 0, minutes: 0, images: [] };
    return {
      id: p.id,
      userId: p.userId,
      title: p.title,
      description: p.description,
      practicesCount: stats.count,
      totalMinutes: stats.minutes,
      previewImages: stats.images,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });
}

/**
 * Retrieves a playlist and its practices localized for the viewer.
 */
export async function getPlaylistWithPractices(
  userId: string,
  playlistId: string,
  locale: Locale,
): Promise<PlaylistWithPractices | null> {
  const [playlist] = await db
    .select()
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

  if (!playlist) return null;

  const items = await db
    .select({
      practiceSlug: playlistItems.practiceSlug,
    })
    .from(playlistItems)
    .where(eq(playlistItems.playlistId, playlistId))
    .orderBy(asc(playlistItems.sortOrder));

  const slugs = items.map((i) => i.practiceSlug);
  const practiceList = slugs.length > 0 ? await getPracticeSummaries(locale, slugs) : [];

  // Maintain playlist order
  const practiceBySlug = new Map(practiceList.map((p) => [p.slug, p]));
  const orderedPractices = slugs
    .map((s) => practiceBySlug.get(s))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const totalMinutes = orderedPractices.reduce((sum, p) => sum + p.durationMinutes, 0);
  const previewImages = orderedPractices.slice(0, 4).map((p) => p.image);

  return {
    id: playlist.id,
    userId: playlist.userId,
    title: playlist.title,
    description: playlist.description,
    practicesCount: orderedPractices.length,
    totalMinutes,
    previewImages,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
    practices: orderedPractices,
  };
}

/**
 * Finds which of the user's playlists currently contain a given practice.
 */
export async function getPlaylistsContainingPractice(
  userId: string,
  practiceSlug: string,
): Promise<string[]> {
  const rows = await db
    .select({ playlistId: playlistItems.playlistId })
    .from(playlistItems)
    .innerJoin(playlists, eq(playlists.id, playlistItems.playlistId))
    .where(and(eq(playlists.userId, userId), eq(playlistItems.practiceSlug, practiceSlug)));

  return rows.map((r) => r.playlistId);
}

/**
 * Creates a new playlist for the user.
 */
export async function createPlaylist(
  userId: string,
  title: string,
  description?: string,
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(playlists).values({
    id,
    userId,
    title: title.trim(),
    description: description?.trim() || null,
  });

  revalidatePath("/[locale]/(member)/my-practices", "page");
  return id;
}

/**
 * Updates a playlist's title and description.
 */
export async function updatePlaylist(
  userId: string,
  playlistId: string,
  data: { title: string; description?: string },
): Promise<void> {
  await db
    .update(playlists)
    .set({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

  revalidatePath("/[locale]/(member)/my-practices", "page");
}

/**
 * Deletes a playlist and all its contained items.
 */
export async function deletePlaylist(userId: string, playlistId: string): Promise<void> {
  await db.delete(playlists).where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
  revalidatePath("/[locale]/(member)/my-practices", "page");
}

/**
 * Adds a practice to a playlist.
 */
export async function addPracticeToPlaylist(
  userId: string,
  playlistId: string,
  practiceSlug: string,
): Promise<void> {
  const [owns] = await db
    .select({ id: playlists.id })
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

  if (!owns) throw new Error("Playlist not found");

  const [maxOrder] = await db
    .select({ max: sql<number>`coalesce(max(${playlistItems.sortOrder}), -1)` })
    .from(playlistItems)
    .where(eq(playlistItems.playlistId, playlistId));

  await db
    .insert(playlistItems)
    .values({
      playlistId,
      practiceSlug,
      sortOrder: (maxOrder?.max ?? -1) + 1,
    })
    .onConflictDoNothing();

  await db.update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, playlistId));
  revalidatePath("/[locale]/(member)/my-practices", "page");
}

/**
 * Removes a practice from a playlist.
 */
export async function removePracticeFromPlaylist(
  userId: string,
  playlistId: string,
  practiceSlug: string,
): Promise<void> {
  const [owns] = await db
    .select({ id: playlists.id })
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

  if (!owns) throw new Error("Playlist not found");

  await db
    .delete(playlistItems)
    .where(and(eq(playlistItems.playlistId, playlistId), eq(playlistItems.practiceSlug, practiceSlug)));

  await db.update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, playlistId));
  revalidatePath("/[locale]/(member)/my-practices", "page");
}
