"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { getViewer } from "@/modules/memberships/server/viewer";
import type { Locale } from "@/i18n/routing";
import {
  workshopRegistrationSchema,
  type WorkshopRegistrationFormValues,
} from "./schemas";
import {
  getWorkshopAttendeeStats,
  getWorkshopRegistrations,
  registerForWorkshop,
  removeRegistration,
  updateRegistrationStatus,
  type RegisterResult,
} from "./server/registrations";
import type { WorkshopRegistrationStatus } from "./types";

async function ensureInstructor() {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") {
    throw new Error("Unauthorized");
  }
  return viewer;
}

export async function registerWorkshopAction(
  rawInput: WorkshopRegistrationFormValues,
): Promise<RegisterResult> {
  const parsed = workshopRegistrationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "failed" };
  }

  const locale = (await getLocale()) as Locale;
  const viewer = await getViewer();
  const userId = viewer.user?.id;

  const result = await registerForWorkshop(parsed.data, locale, userId);
  revalidatePath(`/${parsed.data.pageSlug}`);
  revalidatePath(`/fa/${parsed.data.pageSlug}`);

  return result;
}

export async function getWorkshopAttendeesAction(pageSlug: string) {
  await ensureInstructor();
  const registrations = await getWorkshopRegistrations(pageSlug);
  const stats = await getWorkshopAttendeeStats(pageSlug);

  return { registrations, stats };
}

export async function updateWorkshopRegistrationStatusAction({
  id,
  status,
  pageSlug,
}: {
  id: number;
  status: WorkshopRegistrationStatus;
  pageSlug: string;
}) {
  await ensureInstructor();
  const ok = await updateRegistrationStatus(id, status);
  if (ok) {
    revalidatePath(`/instructor/pages`);
    revalidatePath(`/${pageSlug}`);
    revalidatePath(`/fa/${pageSlug}`);
  }
  return { ok };
}

export async function removeWorkshopRegistrationAction({
  id,
  pageSlug,
}: {
  id: number;
  pageSlug: string;
}) {
  await ensureInstructor();
  const ok = await removeRegistration(id);
  if (ok) {
    revalidatePath(`/instructor/pages`);
    revalidatePath(`/${pageSlug}`);
    revalidatePath(`/fa/${pageSlug}`);
  }
  return { ok };
}
