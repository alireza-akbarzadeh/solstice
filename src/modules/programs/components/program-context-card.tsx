import { CalendarIcon, CalendarClockIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import type { ProgramProgress } from "../server/progress";
import type { ProgramDay, ProgramDetail } from "../types";

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// "Active Program" card beside a practice opened as a program day (practice-detail-player-desktop).
export async function ProgramContextCard({
  program,
  day,
  next,
  progress,
}: {
  program: ProgramDetail;
  day: number;
  next: ProgramDay | null;
  progress: ProgramProgress;
}) {
  const [t, tPractice, format] = await Promise.all([getTranslations("Program.context"), getTranslations("Practice"), getFormatter()]);
  const remaining = program.totalDays - progress.completed.length;

  return (
    <section className="relative overflow-hidden rounded-xl bg-surface-container p-space-lg shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="font-label-md text-label-md font-semibold tracking-wider text-clay uppercase">{t("eyebrow")}</span>
          <h2 className="mt-1 font-headline-sm text-headline-sm text-on-surface">
            <Link href={`/programs/${program.slug}`} className="transition-colors hover:text-primary">
              {program.title}
            </Link>
          </h2>
        </div>
        <div className="relative flex size-14 shrink-0 items-center justify-center">
          <svg viewBox="0 0 48 48" className="size-full -rotate-90" aria-hidden>
            <circle cx="24" cy="24" r={RADIUS} fill="transparent" stroke="currentColor" strokeWidth="4" className="text-surface-container-highest" />
            <circle
              cx="24"
              cy="24"
              r={RADIUS}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress.percent / 100)}
              className="text-primary transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute font-label-sm text-label-sm font-bold text-primary">
            {format.number(progress.percent / 100, { style: "percent" })}
          </span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2 rounded-lg bg-surface-container-lowest p-3">
        <span className="flex items-center gap-2 font-body-sm text-body-sm font-semibold text-on-surface">
          <CalendarIcon className="size-4 text-clay" />
          {t("day", { day, total: program.totalDays })}
        </span>
        <span className="font-label-sm text-label-sm font-medium text-primary">{t("remaining", { count: remaining })}</span>
      </div>

      {next && (
        <Link
          href={`/practices/${next.practice.slug}?program=${program.slug}&day=${next.day}`}
          className="flex items-center justify-between gap-2 pt-3 font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <CalendarClockIcon className="size-4 shrink-0" />
            <span className="truncate">{t("next", { day: next.day, title: next.practice.title })}</span>
          </span>
          <span className="shrink-0 font-label-sm text-label-sm font-semibold text-primary">
            {tPractice("minutes", { count: next.practice.durationMinutes })}
          </span>
        </Link>
      )}
    </section>
  );
}
