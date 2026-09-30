import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import type { practices } from "@/server/db/schema";

import type { PracticeSummary } from "../types";

export type PracticeRow = typeof practices.$inferSelect;

export function toPracticeSummary(p: PracticeRow, locale: Locale): PracticeSummary {
  return {
    slug: p.slug,
    title: localize(p.title, locale),
    summary: localize(p.summary, locale),
    category: p.category,
    series: localize(p.series, locale),
    intensity: { level: p.intensityLevel, label: localize(p.intensityLabel, locale) },
    props: p.props,
    durationMinutes: p.durationMinutes,
    rating: p.rating,
    reviewCount: p.reviewCount,
    access: p.access,
    image: p.image,
    imageAlt: localize(p.imageAlt, locale),
  };
}
