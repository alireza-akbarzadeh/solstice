"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";

import { getViewer } from "@/modules/memberships/server/viewer";
import { resolvePracticeAccess } from "@/modules/practices/server/access";
import { getPractice } from "@/modules/practices/server/get-practice";
import { findProgramDay, getProgram } from "@/modules/programs/server/get-program";
import { getProgramProgress } from "@/modules/programs/server/progress";

import { recordCompletion, undoRecentCompletion } from "./server/completions";
import { setFavorite } from "./server/favorites";

type ActionResult = { ok: true } | { ok: false; error: "signIn" | "members" | "invalid" };

const inputSchema = z.object({
  practiceSlug: z.string().min(1).max(200),
  on: z.boolean(),
  /** Completing a day of a program the member follows. */
  program: z.object({ slug: z.string().min(1).max(200), day: z.number().int().positive() }).optional(),
});

// Pages that show saved / completed state.
const refresh = () => revalidatePath("/[locale]", "layout");

export async function savePractice(input: unknown): Promise<ActionResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const viewer = await getViewer();
  if (!viewer.user) return { ok: false, error: "signIn" };
  if (!(await getPractice(await getLocale(), parsed.data.practiceSlug))) return { ok: false, error: "invalid" };

  await setFavorite(viewer.user.id, parsed.data.practiceSlug, parsed.data.on);
  refresh();
  return { ok: true };
}

// Only someone who can watch the whole practice can complete it.
export async function completePractice(input: unknown): Promise<ActionResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const locale = await getLocale();
  const [viewer, practice] = await Promise.all([getViewer(), getPractice(locale, parsed.data.practiceSlug)]);
  if (!viewer.user) return { ok: false, error: "signIn" };
  if (!practice) return { ok: false, error: "invalid" };
  if (resolvePracticeAccess(practice, viewer).mode !== "full") return { ok: false, error: "members" };

  const program = parsed.data.program;
  if (program) {
    // The day must be this practice, in a program the member follows, and already open.
    const detail = await getProgram(locale, program.slug);
    const day = detail && findProgramDay(detail, program.day);
    if (!detail || day?.practice.slug !== practice.slug) return { ok: false, error: "invalid" };
    const progress = await getProgramProgress(viewer.user.id, detail);
    if (!progress.enrolled || program.day > progress.unlockedThrough) return { ok: false, error: "invalid" };
  }

  if (parsed.data.on) await recordCompletion(viewer.user.id, practice.slug, practice.durationMinutes, program);
  else await undoRecentCompletion(viewer.user.id, practice.slug, program);
  refresh();
  return { ok: true };
}
