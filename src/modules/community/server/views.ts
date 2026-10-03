import { getFormatter } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { getPracticeSummaries } from "@/modules/practices/server/get-practice";

import type { ReflectionView } from "../components/reflections-panel";
import type { Reflection } from "../types";

/** Threads → what ReflectionsPanel renders, for feeds that span practices. */
export async function toReflectionViews(
  reflections: Reflection[],
  { locale, reader }: { locale: Locale; reader: { id: string; isInstructor: boolean } },
): Promise<ReflectionView[]> {
  const slugs = [...new Set(reflections.map((r) => r.practiceSlug).filter((s): s is string => s !== null))];
  const [format, practices] = await Promise.all([getFormatter(), getPracticeSummaries(locale, slugs)]);
  const titles = new Map(practices.map((p) => [p.slug, p.title]));
  const now = new Date();

  const toView = (r: Reflection): ReflectionView => ({
    id: r.id,
    practice: r.practiceSlug ? { slug: r.practiceSlug, title: titles.get(r.practiceSlug) ?? r.practiceSlug } : null,
    author: r.author,
    body: r.body,
    tag: r.tag,
    atSeconds: r.atSeconds,
    atChapter: null,
    private: r.visibility === "private",
    pinned: r.pinned,
    hidden: r.hidden,
    status: r.status,
    ago: format.relativeTime(r.createdAt, now),
    likes: r.likes,
    liked: r.likedByViewer,
    canDelete: reader.isInstructor || reader.id === r.author.id,
    replies: r.replies.map(toView),
  });
  return reflections.map(toView);
}
