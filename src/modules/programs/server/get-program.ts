import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { getAllPracticeSummaries } from "@/modules/practices/server/get-practice";
import type { PracticeSummary } from "@/modules/practices/types";

import {
  getProgramRow,
  getPublishedProgramRows,
  type ProgramRow,
} from "./library";
import type { ProgramDay, ProgramDetail } from "../types";

// Day numbers stay fixed even if one of a program's practices is unpublished.
function toDetail(
  p: ProgramRow,
  locale: Locale,
  library: Map<string, PracticeSummary>,
): ProgramDetail {
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
  const minutes = weeks.flatMap((w) =>
    w.days.map((d) => d.practice.durationMinutes),
  );

  return {
    slug: p.slug,
    tone: p.tone,
    icon: p.icon,
    pacing: p.pacing,
    badge: localize(p.badge, locale),
    title: localize(p.title, locale),
    heroTitle: localize(p.heroTitle, locale) || localize(p.title, locale),
    description: localize(p.description, locale),
    lede: localize(p.lede, locale) || localize(p.description, locale),
    cta: localize(p.cta, locale),
    note: localize(p.note, locale),
    image: p.image,
    imageAlt: localize(p.imageAlt, locale),
    totalDays: day,
    minutes: {
      min: minutes.length ? Math.min(...minutes) : 0,
      max: minutes.length ? Math.max(...minutes) : 0,
    },
    weeks,
  };
}

// Published CMS rows are the public source of truth; drafts remain private.
const libraryOf = async (locale: Locale) =>
  new Map((await getAllPracticeSummaries(locale)).map((p) => [p.slug, p]));

export async function getPrograms(locale: Locale): Promise<ProgramDetail[]> {
  const library = await libraryOf(locale);
  return (await getPublishedProgramRows()).map((p) =>
    toDetail(p, locale, library),
  );
}

export async function getProgram(
  locale: Locale,
  slug: string,
  { includeDrafts = false } = {},
): Promise<ProgramDetail | null> {
  const program = await getProgramRow(slug);
  return program && (includeDrafts || program.status === "published")
    ? toDetail(program, locale, await libraryOf(locale))
    : null;
}

/** Validates ?program=…&day=… on a practice page: the day must be this practice. */
export async function resolveProgramDay(
  locale: Locale,
  practiceSlug: string,
  programParam: unknown,
  dayParam: unknown,
) {
  if (typeof programParam !== "string" || typeof dayParam !== "string")
    return null;
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
