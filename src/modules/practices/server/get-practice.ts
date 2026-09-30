import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";

import { samplePracticeDetails } from "../sample-details";
import { samplePractices } from "../sample-data";
import type { PracticeDetail, PracticeSummary } from "../types";
import { toPracticeSummary } from "./to-summary";

// TODO(db): read the practice, its chapters and implements from Drizzle.
export async function getPractice(locale: Locale, slug: string): Promise<PracticeDetail | null> {
  const practice = samplePractices.find((p) => p.slug === slug);
  if (!practice) return null;

  const detail = samplePracticeDetails[slug];
  return {
    ...toPracticeSummary(practice, locale),
    poster: detail?.poster ?? practice.image,
    previewSeconds: practice.previewSeconds,
    instructorNote: detail && localize(detail.instructorNote, locale),
    focus: detail?.focus.map((f) => localize(f, locale)) ?? [],
    implements:
      detail?.implements.map((i) => ({ kind: i.kind, name: localize(i.name, locale), detail: localize(i.detail, locale) })) ??
      [],
    chapters:
      detail?.chapters.map((c) => ({
        title: localize(c.title, locale),
        description: localize(c.description, locale),
        startSeconds: c.startSeconds,
      })) ?? [],
  };
}

// Same category first, then the rest of the library; never the practice itself.
export async function getRelatedPractices(locale: Locale, practice: PracticeSummary, limit = 3) {
  const others = samplePractices.filter((p) => p.slug !== practice.slug);
  const ranked = [
    ...others.filter((p) => p.category === practice.category),
    ...others.filter((p) => p.category !== practice.category),
  ];
  return ranked.slice(0, limit).map((p) => toPracticeSummary(p, locale));
}

export async function getPracticeSlugs() {
  return samplePractices.map((p) => p.slug);
}
