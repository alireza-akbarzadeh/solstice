import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";

import type { SamplePractice } from "../sample-data";
import type { PracticeSummary } from "../types";

export function toPracticeSummary(p: SamplePractice, locale: Locale): PracticeSummary {
  return {
    slug: p.slug,
    title: localize(p.title, locale),
    summary: localize(p.summary, locale),
    category: p.category,
    series: localize(p.series, locale),
    intensity: { level: p.intensity.level, label: localize(p.intensity.label, locale) },
    props: p.props,
    durationMinutes: p.durationMinutes,
    rating: p.rating,
    reviewCount: p.reviewCount,
    access: p.access,
    image: p.image,
    imageAlt: localize(p.imageAlt, locale),
  };
}
