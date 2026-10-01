import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";

import { getPublishedProgramRows } from "./library";
import type { ProgramSpotlight } from "../types";

// The home page shows only published programs selected by the instructor.
export async function getFeaturedPrograms(
  locale: Locale,
): Promise<ProgramSpotlight[]> {
  return (await getPublishedProgramRows())
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
