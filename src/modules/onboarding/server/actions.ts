"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/modules/memberships/server/viewer";
import { onboardingFormSchema, memberNoteSchema } from "../schemas";
import { saveMemberOnboarding } from "./onboarding";
import { createMemberNote, updateMemberNote, deleteMemberNote } from "./notes";

export async function saveOnboardingAction(input: unknown) {
  const viewer = await getViewer();
  if (!viewer.user) {
    return { ok: false, error: "unauthenticated" as const };
  }

  const parsed = onboardingFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input" as const,
      issues: parsed.error.issues,
    };
  }

  const saved = await saveMemberOnboarding(viewer.user.id, parsed.data);
  if (!saved) {
    return { ok: false, error: "failed" as const };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/instructor/members");
  revalidatePath("/instructor/insights");

  return { ok: true, data: saved };
}

export async function addMemberNoteAction(input: unknown) {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") {
    return { ok: false, error: "forbidden" as const };
  }

  const parsed = memberNoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input" as const,
      issues: parsed.error.issues,
    };
  }

  const created = await createMemberNote(
    parsed.data.userId,
    viewer.user.id,
    parsed.data.body,
  );

  if (!created) {
    return { ok: false, error: "failed" as const };
  }

  revalidatePath("/instructor/members");
  return { ok: true, data: created };
}

export async function updateMemberNoteAction(noteId: number, body: string) {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") {
    return { ok: false, error: "forbidden" as const };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, error: "invalid_input" as const };
  }

  await updateMemberNote(noteId, trimmed);
  revalidatePath("/instructor/members");
  return { ok: true };
}

export async function deleteMemberNoteAction(noteId: number) {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") {
    return { ok: false, error: "forbidden" as const };
  }

  await deleteMemberNote(noteId);
  revalidatePath("/instructor/members");
  return { ok: true };
}
