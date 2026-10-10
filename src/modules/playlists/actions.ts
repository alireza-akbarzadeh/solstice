"use server";

import { revalidatePath } from "next/cache";

import { getViewer } from "@/modules/memberships/server/viewer";
import {
  addPracticeToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistsContainingPractice,
  getPlaylistWithPractices,
  getUserPlaylists,
  removePracticeFromPlaylist,
  updatePlaylist,
} from "./server/playlists";
import { createPlaylistSchema, updatePlaylistSchema } from "./schemas";
import type { Locale } from "@/i18n/routing";

export async function createPlaylistAction(title: string, description?: string) {
  const viewer = await getViewer();
  if (!viewer.user) return { success: false, error: "unauthorized" as const };

  const parsed = createPlaylistSchema.safeParse({ title, description });
  if (!parsed.success) return { success: false, error: "invalid" as const };

  try {
    const id = await createPlaylist(viewer.user.id, parsed.data.title, parsed.data.description);
    return { success: true, id };
  } catch {
    return { success: false, error: "failed" as const };
  }
}

export async function updatePlaylistAction(playlistId: string, title: string, description?: string) {
  const viewer = await getViewer();
  if (!viewer.user) return { success: false, error: "unauthorized" as const };

  const parsed = updatePlaylistSchema.safeParse({ playlistId, title, description });
  if (!parsed.success) return { success: false, error: "invalid" as const };

  try {
    await updatePlaylist(viewer.user.id, parsed.data.playlistId, {
      title: parsed.data.title,
      description: parsed.data.description,
    });
    return { success: true };
  } catch {
    return { success: false, error: "failed" as const };
  }
}

export async function deletePlaylistAction(playlistId: string) {
  const viewer = await getViewer();
  if (!viewer.user) return { success: false, error: "unauthorized" as const };

  try {
    await deletePlaylist(viewer.user.id, playlistId);
    return { success: true };
  } catch {
    return { success: false, error: "failed" as const };
  }
}

export async function togglePlaylistItemAction(
  playlistId: string,
  practiceSlug: string,
  shouldInclude: boolean,
) {
  const viewer = await getViewer();
  if (!viewer.user) return { success: false, error: "unauthorized" as const };

  try {
    if (shouldInclude) {
      await addPracticeToPlaylist(viewer.user.id, playlistId, practiceSlug);
    } else {
      await removePracticeFromPlaylist(viewer.user.id, playlistId, practiceSlug);
    }
    return { success: true };
  } catch {
    return { success: false, error: "failed" as const };
  }
}

export async function getPlaylistsForPracticeAction(practiceSlug: string) {
  const viewer = await getViewer();
  if (!viewer.user) return { playlists: [], containing: [] };

  const [all, containing] = await Promise.all([
    getUserPlaylists(viewer.user.id),
    getPlaylistsContainingPractice(viewer.user.id, practiceSlug),
  ]);

  return { playlists: all, containing };
}

export async function getPlaylistDetailsAction(playlistId: string, locale: "en" | "fa") {
  const viewer = await getViewer();
  if (!viewer.user) return null;
  return getPlaylistWithPractices(viewer.user.id, playlistId, locale as Locale);
}
