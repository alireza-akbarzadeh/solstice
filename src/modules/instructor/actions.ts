"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import { env } from "@/env";
import { getPathname } from "@/i18n/navigation";
import { parseAssetForAnyProvider } from "@/infrastructure/video";
import { REFLECTION_MAX_LENGTH } from "@/modules/community/schemas";
import { createReflection, setReflectionPinned } from "@/modules/community/server/reflections";
import { setCancelAtPeriodEnd } from "@/modules/memberships/server/memberships";
import { getViewer } from "@/modules/memberships/server/viewer";
import { notifyEveryone } from "@/modules/notifications/server/send";
import { practiceCategories } from "@/modules/practices/types";
import { auth } from "@/server/better-auth";

import { endAccess, grantAccess, setMemberRole } from "./server/members";
import { unpinAnnouncements } from "./server/posts";
import { setPracticeFeatured, setPracticeStatus, setPracticeVideo, updatePracticeMeta } from "./server/publish";

export type StudioResult = { ok: true; message?: string } | { ok: false; error: "forbidden" | "invalid" | "failed" };

/** Every studio mutation is the instructor's alone; a member reaching one is simply refused. */
async function instructorOnly() {
  const viewer = await getViewer();
  return viewer.user?.role === "instructor" ? viewer.user : null;
}

// The studio reads the same data on every page, so a mutation refreshes the whole group.
const refresh = () => revalidatePath("/[locale]", "layout");

const userId = z.string().min(1).max(200);
const slug = z.string().min(1).max(200);

export async function grantMemberAccess(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ userId, plan: z.enum(["monthly", "annual"]), months: z.number().int().min(1).max(36) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  await grantAccess(parsed.data.userId, parsed.data.plan, parsed.data.months);
  refresh();
  return { ok: true };
}

export async function endMemberAccess(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ userId }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  await endAccess(parsed.data.userId);
  refresh();
  return { ok: true };
}

export async function setMemberCancelAtPeriodEnd(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ userId, cancel: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  await setCancelAtPeriodEnd(parsed.data.userId, parsed.data.cancel);
  refresh();
  return { ok: true };
}

export async function changeMemberRole(input: unknown): Promise<StudioResult> {
  const actor = await instructorOnly();
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = z.object({ userId, role: z.enum(["member", "instructor"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  // Never let the last instructor demote themselves out of the studio.
  if (parsed.data.userId === actor.id && parsed.data.role === "member") return { ok: false, error: "invalid" };

  await setMemberRole(parsed.data.userId, parsed.data.role);
  refresh();
  return { ok: true };
}

/** Sends the member the same reset link the forgotten-password form would. */
export async function sendMemberPasswordReset(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ email: z.string().email().max(320) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const locale = await getLocale();
  const redirectTo = new URL(getPathname({ href: "/reset-password", locale }), env.BETTER_AUTH_URL).toString();
  try {
    await auth.api.requestPasswordReset({ body: { email: parsed.data.email, redirectTo } });
  } catch {
    return { ok: false, error: "failed" };
  }
  return { ok: true };
}

/**
 * Posts to the circle as the instructor. Pinning it makes it the week's intention (the
 * previous one is unpinned, so there is only ever one), and it can go out as a push.
 */
export async function publishAnnouncement(input: unknown): Promise<StudioResult> {
  const actor = await instructorOnly();
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = z
    .object({ body: z.string().trim().min(1).max(REFLECTION_MAX_LENGTH), pinned: z.boolean(), notify: z.boolean() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const created = await createReflection(
    { practiceSlug: null, body: parsed.data.body, tag: null, atSeconds: null, visibility: "circle", parentId: null },
    { id: actor.id, isInstructor: true },
  );
  if (!created) return { ok: false, error: "failed" };

  if (parsed.data.pinned) {
    await unpinAnnouncements();
    await setReflectionPinned(created.id, true);
  }

  let sent = 0;
  if (parsed.data.notify) {
    const [en, fa] = await Promise.all([
      getTranslations({ locale: "en", namespace: "Studio.posts.push" }),
      getTranslations({ locale: "fa", namespace: "Studio.posts.push" }),
    ]);
    const excerpt = parsed.data.body.slice(0, 160);
    const result = await notifyEveryone({
      en: { title: en("title", { name: actor.name }), body: excerpt, url: "/community" },
      fa: { title: fa("title", { name: actor.name }), body: excerpt, url: "/community" },
    });
    sent = result.sent;
  }

  refresh();
  return { ok: true, message: String(sent) };
}

export async function publishPractice(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ slug, status: z.enum(["draft", "published"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const changed = await setPracticeStatus(parsed.data.slug, parsed.data.status);
  if (!changed) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true };
}

export async function featurePractice(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ slug, featured: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const changed = await setPracticeFeatured(parsed.data.slug, parsed.data.featured);
  if (!changed) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true };
}

/**
 * Points a practice at a video. The mock VideoProvider stores a URL; a real provider would
 * take an upload here and hand back an asset id.
 */
export async function attachPracticeVideo(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ slug, url: z.string().max(2000) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const value = parsed.data.url.trim();
  // An empty box detaches; anything else must be a link one of the providers recognises.
  const asset = value ? parseAssetForAnyProvider(value) : null;
  if (value && !asset) return { ok: false, error: "invalid" };

  const changed = await setPracticeVideo(parsed.data.slug, asset);
  if (!changed) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true };
}

export async function savePracticeMeta(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z
    .object({
      slug,
      title: z.object({ en: z.string().min(1).max(200), fa: z.string().min(1).max(200) }),
      summary: z.object({ en: z.string().min(1).max(600), fa: z.string().min(1).max(600) }),
      series: z.object({ en: z.string().min(1).max(200), fa: z.string().min(1).max(200) }),
      category: z.enum(practiceCategories),
      intensityLevel: z.enum(["gentle", "moderate", "fire"]),
      intensityLabel: z.object({ en: z.string().min(1).max(120), fa: z.string().min(1).max(120) }),
      props: z.enum(["none", "bolster-blocks", "strap"]),
      durationMinutes: z.number().int().min(1).max(600),
      access: z.enum(["open", "members"]),
      previewSeconds: z.number().int().min(0).max(3600).nullable(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const changed = await updatePracticeMeta(parsed.data);
  if (!changed) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true };
}
