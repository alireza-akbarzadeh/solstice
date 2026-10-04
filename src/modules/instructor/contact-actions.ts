"use server";

import { revalidatePath } from "next/cache";

import { contactSchema } from "@/modules/contact/schemas";
import { saveStudioContact } from "@/modules/contact/server/contact";
import type { StudioContact } from "@/modules/contact/types";
import { getViewer } from "@/modules/memberships/server/viewer";

export type ContactResult =
  | { ok: true; contact: StudioContact }
  | { ok: false; error: "forbidden" | "invalid" | "failed" };

/** Saves the studio's contact details; returns them normalized (handles become full links). */
export async function saveContact(input: unknown): Promise<ContactResult> {
  if ((await getViewer()).user?.role !== "instructor")
    return { ok: false, error: "forbidden" };
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    await saveStudioContact(parsed.data);
  } catch {
    return { ok: false, error: "failed" };
  }
  // The footer is on every public page.
  revalidatePath("/[locale]", "layout");
  return { ok: true, contact: parsed.data };
}
