import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { memberNotes, user } from "@/server/db/schema";
import type { MemberNote } from "../types";

export async function getMemberNotes(userId: string): Promise<MemberNote[]> {
  try {
    const rows = await db
      .select({
        id: memberNotes.id,
        userId: memberNotes.userId,
        instructorId: memberNotes.instructorId,
        instructorName: user.name,
        instructorImage: user.image,
        body: memberNotes.body,
        createdAt: memberNotes.createdAt,
        updatedAt: memberNotes.updatedAt,
      })
      .from(memberNotes)
      .leftJoin(user, eq(user.id, memberNotes.instructorId))
      .where(eq(memberNotes.userId, userId))
      .orderBy(desc(memberNotes.createdAt));

    return rows.map((r) => ({
      ...r,
      instructorName: r.instructorName ?? "Instructor",
    }));
  } catch (err) {
    console.error(`Failed to get member notes for user ${userId}:`, err);
    return [];
  }
}

export async function createMemberNote(
  userId: string,
  instructorId: string,
  body: string,
): Promise<MemberNote | null> {
  const [created] = await db
    .insert(memberNotes)
    .values({
      userId,
      instructorId,
      body: body.trim(),
    })
    .returning();

  if (!created) return null;
  return created;
}

export async function updateMemberNote(
  noteId: number,
  body: string,
): Promise<boolean> {
  await db
    .update(memberNotes)
    .set({
      body: body.trim(),
      updatedAt: new Date(),
    })
    .where(eq(memberNotes.id, noteId));

  return true;
}

export async function deleteMemberNote(noteId: number): Promise<boolean> {
  await db.delete(memberNotes).where(eq(memberNotes.id, noteId));
  return true;
}
