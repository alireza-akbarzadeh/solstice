"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import { env } from "@/env";
import { getPathname } from "@/i18n/navigation";
import { parseAssetForAnyProvider } from "@/infrastructure/video";
import {
  createReflection,
  setReflectionPinned,
} from "@/modules/community/server/reflections";
import { setCancelAtPeriodEnd } from "@/modules/memberships/server/memberships";
import { getPlan } from "@/modules/memberships/server/plans";
import { deleteSubscriber } from "@/modules/newsletter/server/subscribers";
import { getViewer } from "@/modules/memberships/server/viewer";
import { notifyEveryone } from "@/modules/notifications/server/send";
import { practiceFieldsSchema } from "@/modules/practices/schemas";
import { auth } from "@/server/better-auth";

import { announcementSchema, giftPassSchema } from "./schemas";
import { endAccess, grantAccess, setMemberRole } from "./server/members";
import { getPracticeRow } from "./server/content";
import { unpinAnnouncements } from "./server/posts";
import {
  createPractice,
  getPracticeUsage,
  deletePractice,
  setPracticeFeatured,
  setPracticeStatus,
  setPracticeVideo,
  uniquePracticeSlug,
  updatePracticeMeta,
} from "./server/publish";

export type StudioResult =
  | { ok: true; message?: string }
  | {
      ok: false;
      error: "forbidden" | "invalid" | "failed" | "video" | "inUse";
    };

/** Every studio mutation is the instructor's alone; a member reaching one is simply refused. */
async function instructorOnly() {
  const viewer = await getViewer();
  return viewer.user?.role === "instructor" ? viewer.user : null;
}

// The studio reads the same data on every page, so a mutation refreshes the whole group.
const refresh = () => revalidatePath("/[locale]", "layout");

const userId = z.string().trim().min(1).max(200);
const slug = z.string().min(1).max(200);

export async function grantMemberAccess(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = giftPassSchema.extend({ userId }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!(await getPlan(parsed.data.plan))) return { ok: false, error: "invalid" };

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

export async function setMemberCancelAtPeriodEnd(
  input: unknown,
): Promise<StudioResult> {
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
  const parsed = z
    .object({ userId, role: z.enum(["member", "instructor"]) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  // Never let the last instructor demote themselves out of the studio.
  if (parsed.data.userId === actor.id && parsed.data.role === "member")
    return { ok: false, error: "invalid" };

  await setMemberRole(parsed.data.userId, parsed.data.role);
  refresh();
  return { ok: true };
}

/** Sends the member the same reset link the forgotten-password form would. */
export async function sendMemberPasswordReset(
  input: unknown,
): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z
    .object({ email: z.string().email().max(320) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const locale = await getLocale();
  const redirectTo = new URL(
    getPathname({ href: "/reset-password", locale }),
    env.BETTER_AUTH_URL,
  ).toString();
  try {
    await auth.api.requestPasswordReset({
      body: { email: parsed.data.email, redirectTo },
    });
  } catch {
    return { ok: false, error: "failed" };
  }
  return { ok: true };
}

/**
 * Posts to the circle as the instructor. Pinning it makes it the week's intention (the
 * previous one is unpinned, so there is only ever one), and it can go out as a push.
 */
export async function publishAnnouncement(
  input: unknown,
): Promise<StudioResult> {
  const actor = await instructorOnly();
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const created = await createReflection(
    {
      practiceSlug: null,
      body: parsed.data.body,
      tag: null,
      atSeconds: null,
      visibility: "circle",
      parentId: null,
    },
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
      en: {
        title: en("title", { name: actor.name }),
        body: excerpt,
        url: "/community",
      },
      fa: {
        title: fa("title", { name: actor.name }),
        body: excerpt,
        url: "/community",
      },
    });
    sent = result.sent;
  }

  refresh();
  return { ok: true, message: String(sent) };
}

export async function publishPractice(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z
    .object({ slug, status: z.enum(["draft", "published"]) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  if (
    parsed.data.status === "published" &&
    !(await getPracticeRow(parsed.data.slug))?.videoAssetId
  )
    return { ok: false, error: "video" };
  const changed = await setPracticeStatus(parsed.data.slug, parsed.data.status);
  if (!changed) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true };
}

export async function featurePractice(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ slug, featured: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const changed = await setPracticeFeatured(
    parsed.data.slug,
    parsed.data.featured,
  );
  if (!changed) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true };
}

/**
 * Attaches a YouTube/Aparat link or direct media URL and records its provider.
 */
export async function attachPracticeVideo(
  input: unknown,
): Promise<StudioResult> {
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

/** Creates a practice as a draft and hands back its slug, derived from the English title. */
export async function newPractice(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = practiceFieldsSchema
    .extend({ videoUrl: z.string().max(2000).optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { videoUrl, ...fields } = parsed.data;
  const asset = videoUrl?.trim() ? parseAssetForAnyProvider(videoUrl) : null;
  if (videoUrl?.trim() && !asset) return { ok: false, error: "video" };
  const slug = await uniquePracticeSlug(fields.title.en);
  const created = await createPractice(slug, {
    ...fields,
    videoAssetId: asset?.assetId ?? null,
    videoProvider: asset?.providerId ?? null,
  });
  if (!created) return { ok: false, error: "failed" };
  // No revalidate here: it would remount the editor and discard the slug the client needs.
  return { ok: true, message: slug };
}

export async function removePractice(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ slug }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  if ((await getPracticeUsage(parsed.data.slug)).programs > 0)
    return { ok: false, error: "inUse" };
  const removed = await deletePractice(parsed.data.slug);
  if (!removed) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true };
}

export async function savePracticeMeta(input: unknown): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = practiceFieldsSchema
    .extend({ slug, videoUrl: z.string().max(2000).optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { videoUrl, ...fields } = parsed.data;
  const asset = videoUrl?.trim() ? parseAssetForAnyProvider(videoUrl) : null;
  if (videoUrl?.trim() && !asset) return { ok: false, error: "video" };
  const changed = await updatePracticeMeta({
    ...fields,
    ...(videoUrl === undefined
      ? {}
      : {
          videoAssetId: asset?.assetId ?? null,
          videoProvider: asset?.providerId ?? null,
        }),
  });
  if (!changed) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true };
}

/** Removes an address from the newsletter list (an unsubscribe on the reader's behalf). */
export async function removeNewsletterSubscriber(
  input: unknown,
): Promise<StudioResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  if (!(await deleteSubscriber(parsed.data.id))) return { ok: false, error: "failed" };
  refresh();
  return { ok: true };
}
