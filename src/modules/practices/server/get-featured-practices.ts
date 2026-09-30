import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";

import { samplePractices } from "../sample-data";
import type { PracticeSummary } from "../types";

// TODO(db): read featured practices from Drizzle once the videos schema exists.
export async function getFeaturedPractices(locale: Locale): Promise<PracticeSummary[]> {
  return samplePractices
    .filter((p) => p.featured)
    .map((p) => ({
      slug: p.slug,
      title: localize(p.title, locale),
      summary: localize(p.summary, locale),
      category: localize(p.category, locale),
      categoryTone: p.categoryTone,
      style: localize(p.style, locale),
      intensity: localize(p.intensity, locale),
      durationMinutes: p.durationMinutes,
      image: p.image,
      imageAlt: localize(p.imageAlt, locale),
    }));
}
