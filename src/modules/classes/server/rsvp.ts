import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getViewer } from "@/modules/memberships/server/viewer";
import { db } from "@/server/db";
import { liveClasses, liveClassRsvps } from "@/server/db/schema";

export type RsvpResult =
  | { ok: true; rsvpd: boolean; rsvpCount: number }
  | { ok: false; error: "unauthenticated" | "membership_required" | "class_full" | "class_not_found" };

export async function toggleClassRsvp(classId: number): Promise<RsvpResult> {
  const viewer = await getViewer();
  if (!viewer.user) {
    return { ok: false, error: "unauthenticated" };
  }

  const [liveClass] = await db
    .select()
    .from(liveClasses)
    .where(eq(liveClasses.id, classId))
    .limit(1);

  if (!liveClass) {
    return { ok: false, error: "class_not_found" };
  }

  if (liveClass.access === "members_only" && !viewer.hasAccess && viewer.user.role !== "instructor") {
    return { ok: false, error: "membership_required" };
  }

  // Check if RSVP already exists
  const [existingRsvp] = await db
    .select()
    .from(liveClassRsvps)
    .where(and(eq(liveClassRsvps.classId, classId), eq(liveClassRsvps.userId, viewer.user.id)))
    .limit(1);

  if (existingRsvp) {
    await db
      .delete(liveClassRsvps)
      .where(and(eq(liveClassRsvps.classId, classId), eq(liveClassRsvps.userId, viewer.user.id)));

    const countRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(liveClassRsvps)
      .where(eq(liveClassRsvps.classId, classId));
    const count = countRows[0]?.count ?? 0;

    revalidatePath("/classes");
    revalidatePath(`/classes/${liveClass.slug}`);
    revalidatePath(`/classes/${liveClass.slug}/live`);
    revalidatePath("/instructor/classes");

    return { ok: true, rsvpd: false, rsvpCount: count };
  }

  // Check capacity if set
  if (liveClass.capacity !== null) {
    const capacityRows = await db
      .select({ currentCount: sql<number>`count(*)::int` })
      .from(liveClassRsvps)
      .where(eq(liveClassRsvps.classId, classId));
    const currentCount = capacityRows[0]?.currentCount ?? 0;

    if (currentCount >= liveClass.capacity) {
      return { ok: false, error: "class_full" };
    }
  }

  await db.insert(liveClassRsvps).values({
    classId,
    userId: viewer.user.id,
  });

  const updatedRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(liveClassRsvps)
    .where(eq(liveClassRsvps.classId, classId));
  const count = updatedRows[0]?.count ?? 0;

  revalidatePath("/classes");
  revalidatePath(`/classes/${liveClass.slug}`);
  revalidatePath(`/classes/${liveClass.slug}/live`);
  revalidatePath("/instructor/classes");

  return { ok: true, rsvpd: true, rsvpCount: count };
}
