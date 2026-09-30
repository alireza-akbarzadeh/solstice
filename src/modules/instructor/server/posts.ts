import { and, countDistinct, desc, eq, exists, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/server/db";
import { commentLikes, comments, user } from "@/server/db/schema";

// A circle post is a comment with no practice; the instructor's are the studio's announcements.
const reply = alias(comments, "reply");
const author = alias(user, "author");

/** Clears the current week's intention, so pinning a new announcement replaces it. */
export async function unpinAnnouncements() {
  await db
    .update(comments)
    .set({ pinned: false })
    .where(
      and(
        isNull(comments.practiceSlug),
        eq(comments.pinned, true),
        exists(
          db
            .select({ one: sql`1` })
            .from(author)
            .where(and(eq(author.id, comments.userId), eq(author.role, "instructor"))),
        ),
      ),
    );
}

export type Announcement = Awaited<ReturnType<typeof listAnnouncements>>[number];

/**
 * Everything the instructor has posted to the circle, newest first, with its reach. Likes and
 * replies are counted over two joins, so both are counted distinctly to avoid multiplying.
 */
export async function listAnnouncements(limit = 40) {
  return db
    .select({
      id: comments.id,
      body: comments.body,
      pinned: comments.pinned,
      createdAt: comments.createdAt,
      authorName: user.name,
      authorImage: user.image,
      likes: countDistinct(commentLikes.userId),
      replies: countDistinct(reply.id),
    })
    .from(comments)
    .innerJoin(user, eq(user.id, comments.userId))
    .leftJoin(commentLikes, eq(commentLikes.commentId, comments.id))
    .leftJoin(reply, eq(reply.parentId, comments.id))
    .where(and(isNull(comments.practiceSlug), isNull(comments.parentId), eq(user.role, "instructor")))
    .groupBy(comments.id, user.name, user.image)
    .orderBy(desc(comments.createdAt))
    .limit(limit);
}
