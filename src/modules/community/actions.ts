"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";

import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { isPushConfigured } from "@/infrastructure/push/web-push";
import { getViewer } from "@/modules/memberships/server/viewer";
import { notifyUser } from "@/modules/notifications/server/send";
import { getPractice } from "@/modules/practices/server/get-practice";

import { newReflectionSchema, reflectionIdSchema } from "./schemas";
import { reflectAccess } from "./server/access";
import {
  createReflection,
  deleteReflection,
  getReflectionOwner,
  setReflectionPinned,
  toggleReflectionLike,
} from "./server/reflections";

type ActionResult =
  | { ok: true }
  | { ok: false; error: "signIn" | "members" | "invalid" | "forbidden" };

const refresh = () => revalidatePath("/[locale]/practices/[slug]", "page");

export async function postReflection(input: unknown): Promise<ActionResult> {
  const parsed = newReflectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [viewer, practice] = await Promise.all([
    getViewer(),
    getPractice(await getLocale(), parsed.data.practiceSlug),
  ]);
  if (!practice) return { ok: false, error: "invalid" };
  const access = reflectAccess(practice, viewer);
  if (access !== "ok" || !viewer.user)
    return { ok: false, error: access === "ok" ? "signIn" : access };

  const author = {
    id: viewer.user.id,
    isInstructor: viewer.user.role === "instructor",
  };
  const created = await createReflection(parsed.data, author);
  if (!created) return { ok: false, error: "invalid" };

  if (parsed.data.parentId !== null)
    await notifyReply(
      created.id,
      viewer.user.id,
      viewer.user.name,
      practice.slug,
    );
  refresh();
  return { ok: true };
}

// Tell the thread's author someone answered them (never yourself).
async function notifyReply(
  replyId: number,
  replierId: string,
  replierName: string,
  practiceSlug: string,
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
      const url = `${getPathname({ href: `/practices/${practiceSlug}`, locale })}#reflections`;
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
  if (!(await getReflectionOwner(parsed.data)))
    return { ok: false, error: "invalid" };

  await toggleReflectionLike(parsed.data, viewer.user.id);
  refresh();
  return { ok: true };
}

// The instructor pins guide notes to the top of a practice's reflections.
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
  if (!owner || owner.parentId !== null) return { ok: false, error: "invalid" };

  await setReflectionPinned(parsed.data, pinned);
  refresh();
  return { ok: true };
}
