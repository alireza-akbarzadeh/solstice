"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/modules/memberships/server/viewer";
import {
  sendGentlePracticeNudge,
  type NudgeResult,
} from "./server/nudges";

async function ensureInstructor() {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") {
    throw new Error("Unauthorized");
  }
  return viewer;
}

export async function sendManualNudgeAction({
  userId,
  customMessage,
}: {
  userId: string;
  customMessage?: string;
}): Promise<NudgeResult> {
  await ensureInstructor();

  const result = await sendGentlePracticeNudge({
    userId,
    type: "manual_checkin",
    customMessage,
    force: true,
  });

  revalidatePath("/[locale]/instructor/insights", "page");
  revalidatePath("/[locale]/instructor/members", "page");

  return result;
}
