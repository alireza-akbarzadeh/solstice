"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getViewer } from "@/modules/memberships/server/viewer";
import { db } from "@/server/db";
import { liveClasses, type LiveClassStatus } from "@/server/db/schema";
import { liveClassFormSchema } from "../schemas";
import { toggleClassRsvp, type RsvpResult } from "./rsvp";

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return `${base || "session"}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function createLiveClassAction(rawInput: unknown) {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") {
    return { ok: false, error: "forbidden" as const };
  }

  const parsed = liveClassFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" as const, issues: parsed.error.issues };
  }

  const data = parsed.data;
  const slug = generateSlug(data.titleEn);
  const scheduledAt = new Date(data.scheduledAt);

  try {
    const [created] = await db
      .insert(liveClasses)
      .values({
        slug,
        status: data.status,
        title: { en: data.titleEn, fa: data.titleFa },
        description: { en: data.descriptionEn, fa: data.descriptionFa },
        instructorName: { en: "Elena Vance", fa: "النا ونس" },
        locationName: { en: data.locationNameEn, fa: data.locationNameFa },
        scheduledAt,
        durationMinutes: data.durationMinutes,
        joinUrl: data.joinUrl,
        capacity: data.capacity,
        access: data.access,
        replayPracticeSlug: data.replayPracticeSlug,
        coverImage: data.coverImage,
        soundscapeDetails: data.soundscapeDetails,
      })
      .returning();

    revalidatePath("/classes");
    revalidatePath("/instructor/classes");
    return { ok: true, class: created };
  } catch (err) {
    console.error("Failed to create live class:", err);
    return { ok: false, error: "server_error" as const };
  }
}

export async function updateLiveClassAction(id: number, rawInput: unknown) {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") {
    return { ok: false, error: "forbidden" as const };
  }

  const parsed = liveClassFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" as const, issues: parsed.error.issues };
  }

  const data = parsed.data;
  const scheduledAt = new Date(data.scheduledAt);

  try {
    const [updated] = await db
      .update(liveClasses)
      .set({
        status: data.status,
        title: { en: data.titleEn, fa: data.titleFa },
        description: { en: data.descriptionEn, fa: data.descriptionFa },
        locationName: { en: data.locationNameEn, fa: data.locationNameFa },
        scheduledAt,
        durationMinutes: data.durationMinutes,
        joinUrl: data.joinUrl,
        capacity: data.capacity,
        access: data.access,
        replayPracticeSlug: data.replayPracticeSlug,
        coverImage: data.coverImage,
        soundscapeDetails: data.soundscapeDetails,
        updatedAt: new Date(),
      })
      .where(eq(liveClasses.id, id))
      .returning();

    if (!updated) {
      return { ok: false, error: "not_found" as const };
    }

    revalidatePath("/classes");
    revalidatePath(`/classes/${updated.slug}`);
    revalidatePath(`/classes/${updated.slug}/live`);
    revalidatePath("/instructor/classes");
    return { ok: true, class: updated };
  } catch (err) {
    console.error("Failed to update live class:", err);
    return { ok: false, error: "server_error" as const };
  }
}

export async function updateLiveClassStatusAction(id: number, status: LiveClassStatus) {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") {
    return { ok: false, error: "forbidden" as const };
  }

  try {
    const [updated] = await db
      .update(liveClasses)
      .set({ status, updatedAt: new Date() })
      .where(eq(liveClasses.id, id))
      .returning();

    if (!updated) return { ok: false, error: "not_found" as const };

    revalidatePath("/classes");
    revalidatePath(`/classes/${updated.slug}`);
    revalidatePath(`/classes/${updated.slug}/live`);
    revalidatePath("/instructor/classes");
    return { ok: true, class: updated };
  } catch (err) {
    console.error("Failed to update class status:", err);
    return { ok: false, error: "server_error" as const };
  }
}

export async function deleteLiveClassAction(id: number) {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") {
    return { ok: false, error: "forbidden" as const };
  }

  try {
    await db.delete(liveClasses).where(eq(liveClasses.id, id));
    revalidatePath("/classes");
    revalidatePath("/instructor/classes");
    return { ok: true };
  } catch (err) {
    console.error("Failed to delete live class:", err);
    return { ok: false, error: "server_error" as const };
  }
}

export async function rsvpAction(classId: number): Promise<RsvpResult> {
  return toggleClassRsvp(classId);
}
