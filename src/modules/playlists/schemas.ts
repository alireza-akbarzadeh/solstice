import { z } from "zod";

export const createPlaylistSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(80, "Title cannot exceed 80 characters"),
  description: z.string().trim().max(300, "Description cannot exceed 300 characters").optional(),
});

export const updatePlaylistSchema = createPlaylistSchema.extend({
  playlistId: z.string().min(1),
});

export const togglePlaylistItemSchema = z.object({
  playlistId: z.string().min(1),
  practiceSlug: z.string().min(1),
});
