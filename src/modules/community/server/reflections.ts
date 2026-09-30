import { and, asc, desc, eq, inArray, isNull, or, type SQL, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { commentLikes, comments, user } from "@/server/db/schema";

import type { NewReflection } from "../schemas";
import type { Reflection } from "../types";

type Reader = { id: string; isInstructor: boolean } | null;

// Private reflections are seen by their author, the instructor, and — for private
// replies — the author of the reflection being answered.
function visibleTo(reader: Reader): SQL | undefined {
  if (reader?.isInstructor) return undefined;
  if (!reader) return eq(comments.visibility, "circle");
  return or(
    eq(comments.visibility, "circle"),
    eq(comments.userId, reader.id),
    sql`${comments.parentId} in (select ${comments.id} from ${comments} where ${comments.userId} = ${reader.id})`,
  );
}

const reflectionColumns = (reader: Reader) => ({
  id: comments.id,
  parentId: comments.parentId,
  practiceSlug: comments.practiceSlug,
  body: comments.body,
  tag: comments.tag,
  atSeconds: comments.atSeconds,
  visibility: comments.visibility,
  pinned: comments.pinned,
  createdAt: comments.createdAt,
  authorId: user.id,
  authorName: user.name,
  authorImage: user.image,
  authorRole: user.role,
  likes: sql<number>`(select count(*)::int from ${commentLikes} where ${commentLikes.commentId} = ${comments.id})`,
  liked: reader
    ? sql<boolean>`exists(select 1 from ${commentLikes} where ${commentLikes.commentId} = ${comments.id} and ${commentLikes.userId} = ${reader.id})`
    : sql<boolean>`false`,
});

type Row = Awaited<ReturnType<typeof selectReflections>>[number];

function selectReflections(reader: Reader, where: SQL | undefined) {
  return db
    .select(reflectionColumns(reader))
    .from(comments)
    .innerJoin(user, eq(user.id, comments.userId))
    .where(and(where, visibleTo(reader)))
    .orderBy(asc(comments.createdAt));
}

/** Threads from rows (tops + replies); replies whose parent is hidden from this reader are dropped. */
function toThreads(rows: Row[]): Reflection[] {
  const byId = new Map<number, Reflection>();
  const top: Reflection[] = [];
  for (const row of rows) {
    const reflection: Reflection = {
      id: row.id,
      practiceSlug: row.practiceSlug,
      author: { id: row.authorId, name: row.authorName, image: row.authorImage, isInstructor: row.authorRole === "instructor" },
      body: row.body,
      tag: row.tag,
      atSeconds: row.atSeconds,
      visibility: row.visibility,
      pinned: row.pinned,
      createdAt: row.createdAt,
      likes: row.likes,
      likedByViewer: row.liked,
      replies: [],
    };
    byId.set(row.id, reflection);
    if (row.parentId === null) top.push(reflection);
    else byId.get(row.parentId)?.replies.push(reflection);
  }
  return top;
}

/** A practice's reflections: pinned first, then newest, each with its replies (oldest first). */
export async function getPracticeReflections(practiceSlug: string, reader: Reader): Promise<Reflection[]> {
  const threads = toThreads(await selectReflections(reader, eq(comments.practiceSlug, practiceSlug)));
  return threads.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.getTime() - a.createdAt.getTime());
}

/** The community feed: the newest threads across every practice and the circle itself. */
export async function getCircleFeed(reader: Reader, limit = 30): Promise<Reflection[]> {
  const tops = await db
    .select({ id: comments.id })
    .from(comments)
    .where(and(isNull(comments.parentId), visibleTo(reader)))
    .orderBy(desc(comments.createdAt))
    .limit(limit);
  if (tops.length === 0) return [];
  const ids = tops.map((t) => t.id);
  const threads = toThreads(await selectReflections(reader, or(inArray(comments.id, ids), inArray(comments.parentId, ids))));
  return threads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createReflection(
  input: NewReflection,
  author: { id: string; isInstructor: boolean },
) {
  let parentId = input.parentId;
  let visibility = input.visibility;

  if (parentId !== null) {
    const [parent] = await db
      .select({
        id: comments.id,
        parentId: comments.parentId,
        practiceSlug: comments.practiceSlug,
      })
      .from(comments)
      .where(eq(comments.id, parentId))
      .limit(1);
    if (parent?.practiceSlug !== input.practiceSlug) return null;
    // Replies stay one level deep: answering a reply joins its thread.
    parentId = parent.parentId ?? parent.id;
    const [root] = await db
      .select({ visibility: comments.visibility })
      .from(comments)
      .where(eq(comments.id, parentId))
      .limit(1);
    // A reply to a private reflection stays private.
    if (root?.visibility === "private") visibility = "private";
  }

  const [row] = await db
    .insert(comments)
    .values({
      practiceSlug: input.practiceSlug,
      userId: author.id,
      parentId,
      body: input.body,
      tag: input.tag,
      atSeconds: input.atSeconds,
      visibility,
    })
    .returning({ id: comments.id });
  return row ?? null;
}

export async function getReflectionOwner(id: number) {
  const [row] = await db
    .select({
      userId: comments.userId,
      parentId: comments.parentId,
      practiceSlug: comments.practiceSlug,
    })
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);
  return row ?? null;
}

export async function deleteReflection(id: number) {
  await db.delete(comments).where(eq(comments.id, id));
}

export async function toggleReflectionLike(id: number, userId: string) {
  const removed = await db
    .delete(commentLikes)
    .where(and(eq(commentLikes.commentId, id), eq(commentLikes.userId, userId)))
    .returning({ id: commentLikes.commentId });
  if (removed.length === 0)
    await db
      .insert(commentLikes)
      .values({ commentId: id, userId })
      .onConflictDoNothing();
}

export async function setReflectionPinned(id: number, pinned: boolean) {
  await db.update(comments).set({ pinned }).where(eq(comments.id, id));
}
