import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";

import { samplePrograms } from "../sample-data";
import type { ProgramSpotlight } from "../types";

// TODO(db): read featured programs from Drizzle once the programs schema exists.
export async function getFeaturedPrograms(locale: Locale): Promise<ProgramSpotlight[]> {
  return samplePrograms
    .filter((p) => p.featured)
    .map((p) => ({
      slug: p.slug,
      tone: p.tone,
      icon: p.icon,
      badge: localize(p.badge, locale),
      title: localize(p.title, locale),
      description: localize(p.description, locale),
      phases: p.weeks.map((week) => ({
        label: localize(week.label, locale),
        title: localize(week.title, locale),
      })),
      cta: localize(p.cta, locale),
      note: localize(p.note, locale),
      image: p.image,
      imageAlt: localize(p.imageAlt, locale),
    }));
}
