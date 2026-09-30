import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";

import type { PracticeDetail, PracticeSummary } from "../types";
import { getPracticeRows, getPublishedRows } from "./library";
import { toPracticeSummary } from "./to-summary";

/** A published practice; `includeDrafts` lets the instructor preview unpublished ones. */
export async function getPractice(
  locale: Locale,
  slug: string,
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
): Promise<PracticeDetail | null> {
  const rows = includeDrafts ? await getPracticeRows() : await getPublishedRows();
  const practice = rows.find((p) => p.slug === slug);
  if (!practice) return null;

  return {
    ...toPracticeSummary(practice, locale),
    status: practice.status,
    poster: practice.poster ?? practice.image,
    previewSeconds: practice.previewSeconds ?? undefined,
    videoAssetId: practice.videoAssetId,
    instructorNote: practice.instructorNote ? localize(practice.instructorNote, locale) : undefined,
    focus: practice.focus.map((f) => localize(f, locale)),
    implements: practice.implements.map((i) => ({ kind: i.kind, name: localize(i.name, locale), detail: localize(i.detail, locale) })),
    chapters: practice.chapters.map((c) => ({
      title: localize(c.title, locale),
      description: localize(c.description, locale),
      startSeconds: c.startSeconds,
    })),
  };
}

/** Summaries for the given slugs, in that order; unknown or unpublished slugs are skipped. */
export async function getPracticeSummaries(locale: Locale, slugs: string[]): Promise<PracticeSummary[]> {
  const bySlug = new Map((await getPublishedRows()).map((p) => [p.slug, p]));
  return slugs.flatMap((slug) => {
    const practice = bySlug.get(slug);
    return practice ? [toPracticeSummary(practice, locale)] : [];
  });
}

export async function getAllPracticeSummaries(locale: Locale): Promise<PracticeSummary[]> {
  return (await getPublishedRows()).map((p) => toPracticeSummary(p, locale));
}

// Same category first, then the rest of the library; never the practice itself.
export async function getRelatedPractices(locale: Locale, practice: PracticeSummary, limit = 3) {
  const others = (await getPublishedRows()).filter((p) => p.slug !== practice.slug);
  const ranked = [
    ...others.filter((p) => p.category === practice.category),
    ...others.filter((p) => p.category !== practice.category),
  ];
  return ranked.slice(0, limit).map((p) => toPracticeSummary(p, locale));
}
