"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { isPushConfigured } from "@/infrastructure/push/web-push";
import { getViewer } from "@/modules/memberships/server/viewer";
import { notifyUser } from "@/modules/notifications/server/send";
import { getPractice } from "@/modules/practices/server/get-practice";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";

import { newReflectionSchema, reflectionIdSchema } from "./schemas";
import { reflectAccess } from "./server/access";
import {
  createReflection,
  deleteReflection,
  getPendingIds,
  getReflectionOwner,
  setReflectionHidden,
  setReflectionPinned,
  setReflectionStatus,
  toggleReflectionLike,
} from "./server/reflections";
import type { ReflectionStatus } from "./types";

type ActionResult =
  | { ok: true }
  | { ok: false; error: "signIn" | "members" | "invalid" | "forbidden" };

const refresh = () => {
  revalidatePath("/[locale]/practices/[slug]", "page");
  revalidatePath("/[locale]/community", "page");
  // The studio sidebar counts what waits for review.
  revalidatePath("/[locale]/instructor", "layout");
};

export async function postReflection(
  input: unknown,
): Promise<{ ok: true; status: ReflectionStatus } | Exclude<ActionResult, { ok: true }>> {
  const parsed = newReflectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const slug = parsed.data.practiceSlug;
  const [viewer, practice] = await Promise.all([getViewer(), slug === null ? null : getPractice(await getLocale(), slug)]);
  if (slug !== null && !practice) return { ok: false, error: "invalid" };
  // Circle posts (no practice) are for members, like members-only practices.
  const access = reflectAccess(practice ?? { access: "members" }, viewer);
  if (access !== "ok" || !viewer.user)
    return { ok: false, error: access === "ok" ? "signIn" : access };

  const author = {
    id: viewer.user.id,
    isInstructor: viewer.user.role === "instructor",
  };
  const created = await createReflection(parsed.data, author);
  if (!created) return { ok: false, error: "invalid" };

  // A reply waiting for review notifies nobody yet; approving it sends the notice.
  if (parsed.data.parentId !== null && created.status === "approved")
    await notifyReply(created.id, viewer.user.id, viewer.user.name, slug);
  refresh();
  return { ok: true, status: created.status };
}

// Tell the thread's author someone answered them (never yourself).
async function notifyReply(
  replyId: number,
  replierId: string,
  replierName: string,
  practiceSlug: string | null,
) {
  if (!isPushConfigured()) return;
  const reply = await getReflectionOwner(replyId);
  const root = reply?.parentId
    ? await getReflectionOwner(reply.parentId)
    : null;
  if (!root || root.userId === replierId) return;

  const copy = await Promise.all(
    routing.locales.map(async (locale) => {
      const t = await getTranslations({
        locale,
        namespace: "Reflections.notification",
      });
      const href = practiceSlug === null ? "/community" : `/practices/${practiceSlug}`;
      const url = `${getPathname({ href, locale })}#reflections`;
      return [
        locale,
        {
          title: t("title", { name: replierName }),
          body: t("body"),
          url,
          tag: `reflection-${root.userId}`,
        },
      ] as const;
    }),
  );
  await notifyUser(
    root.userId,
    Object.fromEntries(copy) as Parameters<typeof notifyUser>[1],
  ).catch(() => undefined);
}

// The author learns their reflection is live; an approved reply also reaches the thread's author.
async function notifyApproved(row: { id: number; userId: string; parentId: number | null; practiceSlug: string | null }) {
  if (!isPushConfigured()) return;
  const copy = await Promise.all(
    routing.locales.map(async (locale) => {
      const t = await getTranslations({ locale, namespace: "Reflections.notification" });
      const href = row.practiceSlug === null ? "/community" : `/practices/${row.practiceSlug}`;
      return [
        locale,
        {
          title: t("approvedTitle"),
          body: t("approvedBody"),
          url: `${getPathname({ href, locale })}#reflections`,
          tag: `reflection-approved-${row.id}`,
        },
      ] as const;
    }),
  );
  await notifyUser(row.userId, Object.fromEntries(copy) as Parameters<typeof notifyUser>[1]).catch(() => undefined);
  if (row.parentId !== null) {
    const [author] = await db.select({ name: user.name }).from(user).where(eq(user.id, row.userId)).limit(1);
    await notifyReply(row.id, row.userId, author?.name ?? "", row.practiceSlug);
  }
}

/**
 * The instructor's review: approving puts reflections on the circle (and tells their authors),
 * rejecting keeps them visible only to their authors. Either call can be reversed later.
 */
export async function moderateReflections(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ ids: z.array(reflectionIdSchema).min(1).max(200), status: z.enum(["approved", "rejected"]) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") return { ok: false, error: "forbidden" };

  const changed = await setReflectionStatus(parsed.data.ids, parsed.data.status);
  if (parsed.data.status === "approved") await Promise.all(changed.map((row) => notifyApproved(row)));
  refresh();
  return { ok: true };
}

/** Approves everything waiting for review (up to 200 at a time). */
export async function approveAllReflections(): Promise<ActionResult> {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") return { ok: false, error: "forbidden" };
  const ids = await getPendingIds();
  if (ids.length === 0) return { ok: true };
  return moderateReflections({ ids: ids.slice(0, 200), status: "approved" });
}

export async function removeReflection(id: unknown): Promise<ActionResult> {
  const parsed = reflectionIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const viewer = await getViewer();
  if (!viewer.user) return { ok: false, error: "signIn" };

  const owner = await getReflectionOwner(parsed.data);
  if (!owner) return { ok: true };
  if (owner.userId !== viewer.user.id && viewer.user.role !== "instructor")
    return { ok: false, error: "forbidden" };

  await deleteReflection(parsed.data);
  refresh();
  return { ok: true };
}

export async function likeReflection(id: unknown): Promise<ActionResult> {
  const parsed = reflectionIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const viewer = await getViewer();
  if (!viewer.user) return { ok: false, error: "signIn" };
  const owner = await getReflectionOwner(parsed.data);
  if (!owner) return { ok: false, error: "invalid" };
  // Only approved reflections can be held by others; the instructor can react while reviewing.
  if (owner.status !== "approved" && viewer.user.role !== "instructor")
    return { ok: false, error: "invalid" };

  await toggleReflectionLike(parsed.data, viewer.user.id);
  refresh();
  return { ok: true };
}

// The instructor pins guide notes to the top of a practice's reflections.
/**
 * Takes a reflection off the circle, or puts it back. Unlike deleting, nothing is destroyed —
 * the author still sees their own words, so a moderation call can be reversed.
 */
export async function hideReflection(id: unknown, hidden: boolean): Promise<ActionResult> {
  const parsed = reflectionIdSchema.safeParse(id);
  if (!parsed.success || typeof hidden !== "boolean") return { ok: false, error: "invalid" };
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") return { ok: false, error: "forbidden" };

  await setReflectionHidden(parsed.data, hidden);
  refresh();
  return { ok: true };
}

export async function pinReflection(
  id: unknown,
  pinned: boolean,
): Promise<ActionResult> {
  const parsed = reflectionIdSchema.safeParse(id);
  if (!parsed.success || typeof pinned !== "boolean")
    return { ok: false, error: "invalid" };
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor")
    return { ok: false, error: "forbidden" };

  const owner = await getReflectionOwner(parsed.data);
  if (owner?.parentId !== null) return { ok: false, error: "invalid" };

  await setReflectionPinned(parsed.data, pinned);
  refresh();
  return { ok: true };
}
