import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { getAllPracticeSummaries } from "@/modules/practices/server/get-practice";
import type { PracticeSummary } from "@/modules/practices/types";

import { type SampleProgram, samplePrograms } from "../sample-data";
import type { ProgramDay, ProgramDetail } from "../types";

// Day numbers stay fixed even if one of a program's practices is unpublished.
function toDetail(p: SampleProgram, locale: Locale, library: Map<string, PracticeSummary>): ProgramDetail {
  let day = 0;
  const weeks = p.weeks.map((week, index) => ({
    index,
    label: localize(week.label, locale),
    title: localize(week.title, locale),
    description: localize(week.description, locale),
    focus: localize(week.focus, locale),
    days: week.practices.flatMap((slug): ProgramDay[] => {
      const practice = library.get(slug);
      day += 1;
      return practice ? [{ day, practice }] : [];
    }),
  }));
  const minutes = weeks.flatMap((w) => w.days.map((d) => d.practice.durationMinutes));

  return {
    slug: p.slug,
    tone: p.tone,
    icon: p.icon,
    pacing: p.pacing,
    badge: localize(p.badge, locale),
    title: localize(p.title, locale),
    heroTitle: localize(p.heroTitle, locale),
    description: localize(p.description, locale),
    lede: localize(p.lede, locale),
    cta: localize(p.cta, locale),
    note: localize(p.note, locale),
    image: p.image,
    imageAlt: localize(p.imageAlt, locale),
    totalDays: day,
    minutes: { min: Math.min(...minutes), max: Math.max(...minutes) },
    weeks,
  };
}

// TODO(db): read programs, weeks and days from Drizzle once the programs schema exists.
const libraryOf = async (locale: Locale) => new Map((await getAllPracticeSummaries(locale)).map((p) => [p.slug, p]));

export async function getPrograms(locale: Locale): Promise<ProgramDetail[]> {
  const library = await libraryOf(locale);
  return samplePrograms.map((p) => toDetail(p, locale, library));
}

export async function getProgram(locale: Locale, slug: string): Promise<ProgramDetail | null> {
  const program = samplePrograms.find((p) => p.slug === slug);
  return program ? toDetail(program, locale, await libraryOf(locale)) : null;
}

/** Validates ?program=…&day=… on a practice page: the day must be this practice. */
export async function resolveProgramDay(locale: Locale, practiceSlug: string, programParam: unknown, dayParam: unknown) {
  if (typeof programParam !== "string" || typeof dayParam !== "string") return null;
  const day = Number(dayParam);
  if (!Number.isInteger(day) || day < 1) return null;
  const program = await getProgram(locale, programParam);
  const found = program && findProgramDay(program, day);
  if (!program || found?.practice.slug !== practiceSlug) return null;
  return { program, day, next: findProgramDay(program, day + 1) };
}

export function findProgramDay(program: ProgramDetail, day: number) {
  for (const week of program.weeks) {
    const found = week.days.find((d) => d.day === day);
    if (found) return { ...found, week };
  }
  return null;
}
