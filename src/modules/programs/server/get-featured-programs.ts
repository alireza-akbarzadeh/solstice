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
      phases: p.phases.map((phase) => ({
        label: localize(phase.label, locale),
        title: localize(phase.title, locale),
      })),
      cta: localize(p.cta, locale),
      note: localize(p.note, locale),
      image: p.image,
      imageAlt: localize(p.imageAlt, locale),
    }));
}
