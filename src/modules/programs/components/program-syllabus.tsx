"use client";

import { ArrowRightIcon, CheckIcon, CircleCheckIcon, ClockIcon, LockIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useCategoryName } from "@/modules/categories/names";

import type { ProgramDay, ProgramWeek } from "../types";

export type SyllabusProgress = {
  enrolled: boolean;
  completed: number[];
  unlockedThrough: number;
  current: number | null;
  /** Days until the next day opens (daily pacing). */
  daysUntilNext: number | null;
};

type DayState = "done" | "today" | "open" | "locked" | "preview";

export function ProgramSyllabus({
  programSlug,
  weeks,
  progress,
}: {
  programSlug: string;
  weeks: ProgramWeek[];
  progress: SyllabusProgress;
}) {
  const t = useTranslations("Program.syllabus");
  const tPractice = useTranslations("Practice");
  const practiceCategory = useCategoryName("practice");
  const done = new Set(progress.completed);

  const weekOfDay = (day: number | null) => (day === null ? -1 : weeks.findIndex((w) => w.days.some((d) => d.day === day)));
  const currentWeek = weekOfDay(progress.current);
  const [selected, setSelected] = useState(Math.max(0, currentWeek));
  const week = weeks[selected]!;

  const stateOf = (day: number): DayState => {
    if (!progress.enrolled) return "preview";
    if (done.has(day)) return "done";
    if (day > progress.unlockedThrough) return "locked";
    return day === progress.current ? "today" : "open";
  };

  const unlocksIn = (day: number) =>
    progress.daysUntilNext === null ? null : day - progress.unlockedThrough - 1 + progress.daysUntilNext;

  const dayHref = (day: ProgramDay) =>
    progress.enrolled
      ? `/practices/${day.practice.slug}?program=${programSlug}&day=${day.day}`
      : `/practices/${day.practice.slug}`;

  return (
    <>
      <div role="tablist" aria-label={t("weeksLabel")} className="mb-space-xl grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
        {weeks.map((w, i) => {
          const total = w.days.length;
          const complete = w.days.filter((d) => done.has(d.day)).length;
          const first = w.days[0]?.day ?? 0;
          const last = w.days.at(-1)?.day ?? 0;
          const isCurrent = progress.enrolled && i === currentWeek;
          const locked = progress.enrolled && first > progress.unlockedThrough;
          const wait = locked ? unlocksIn(first) : null;
          return (
            <button
              key={w.index}
              type="button"
              role="tab"
              aria-selected={selected === i}
              onClick={() => setSelected(i)}
              className={cn(
                "relative flex flex-col justify-between rounded-xl p-space-md text-start transition-colors",
                isCurrent ? "bg-surface-container-highest shadow-sm ring-2 ring-primary/40" : "bg-surface-container-low hover:bg-surface-container",
                locked && "opacity-80 hover:opacity-100",
                selected === i && !isCurrent && "ring-1 ring-primary/30",
              )}
            >
              {isCurrent && (
                <span className="absolute end-4 -top-3 rounded-full bg-primary px-3 py-0.5 font-label-sm text-label-sm tracking-wider text-on-primary uppercase">
                  {t("currentFocus")}
                </span>
              )}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className={cn("font-label-sm text-label-sm font-bold tracking-widest uppercase", locked ? "text-outline" : "text-clay")}>
                  {t("weekRange", { label: w.label, first, last })}
                </span>
                {progress.enrolled &&
                  (locked ? (
                    <span className="flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 font-label-sm text-label-sm text-outline">
                      <LockIcon className="size-3" />
                      {wait === null ? t("locked") : t("unlocksIn", { count: wait })}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 font-label-sm text-label-sm font-semibold text-primary">
                      {complete === total && <CircleCheckIcon className="size-3.5" />}
                      {t("complete", { done: complete, total })}
                    </span>
                  ))}
              </div>
              <div className="my-2">
                <h3 className={cn("mb-2 font-headline-sm text-headline-sm", locked ? "text-on-surface-variant" : "text-primary")}>{w.title}</h3>
                <p className={cn("font-body-sm text-body-sm", locked ? "text-outline" : "text-on-surface-variant")}>{w.description}</p>
              </div>
              <div className="mt-4 flex items-center justify-between pt-3 font-label-sm text-label-sm text-outline">
                <span>{w.focus}</span>
                <span className="font-medium text-primary">{t("daysCount", { count: total })}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="rounded-xl bg-surface-container p-space-md md:p-space-lg">
        <div className="mb-6 flex flex-col justify-between gap-2 pb-2 sm:flex-row sm:items-end">
          <div>
            <span className="block font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">{t("pathwayEyebrow")}</span>
            <h3 className="font-headline-md text-headline-md text-primary">{t("pathwayTitle", { label: week.label, title: week.title })}</h3>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {week.days.map((day) => {
            const state = stateOf(day.day);
            const wait = state === "locked" ? unlocksIn(day.day) : null;
            const card = (
              <>
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={day.practice.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                    className={cn(
                      "object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100",
                      state === "locked" && "opacity-80",
                    )}
                  />
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-t to-transparent",
                      state === "today" ? "from-primary/80 via-primary/20" : "from-on-surface/70 via-transparent",
                    )}
                  />
                  {state === "today" && (
                    <span className="absolute start-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-label-sm text-label-sm text-on-primary shadow-md">
                      <span className="size-2 rounded-full bg-secondary-fixed motion-safe:animate-ping" />
                      {t("today", { day: day.day })}
                    </span>
                  )}
                  {state === "done" && (
                    <span className="absolute end-3 top-3 flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 font-label-sm text-label-sm text-primary shadow-sm backdrop-blur-sm">
                      <CheckIcon className="size-3" />
                      {t("completed")}
                    </span>
                  )}
                  {state === "locked" && (
                    <span className="absolute end-3 top-3 flex items-center gap-1 rounded-full bg-surface-container-highest/90 px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant shadow-sm">
                      <ClockIcon className="size-3" />
                      {wait === 1 ? t("tomorrow") : wait === null ? t("locked") : t("unlocksIn", { count: wait })}
                    </span>
                  )}
                  <div className="absolute start-3 bottom-3 end-14 text-on-primary">
                    <span className="block font-label-sm text-label-sm tracking-wider uppercase opacity-90">{t("dayLabel", { day: day.day })}</span>
                    <h4 className="line-clamp-2 font-headline-sm text-headline-sm">{day.practice.title}</h4>
                  </div>
                  {state === "today" && (
                    <span className="absolute end-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-clay text-on-clay shadow-lg transition-transform group-hover:scale-110">
                      <PlayIcon className="size-5 fill-current" />
                    </span>
                  )}
                </div>
                <div className={cn("flex flex-1 flex-col justify-between p-space-md", state === "today" && "bg-surface-bright")}>
                  <p className="mb-4 line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{day.practice.summary}</p>
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 font-label-sm text-label-sm",
                          state === "today" ? "bg-primary-fixed font-semibold text-on-primary-fixed" : "bg-surface-container text-on-surface-variant",
                        )}
                      >
                        {practiceCategory(day.practice.category)}
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">{tPractice("minutes", { count: day.practice.durationMinutes })}</span>
                    </div>
                    {state === "done" && (
                      <span className="flex items-center gap-1 font-label-sm text-label-sm font-semibold tracking-wider text-primary uppercase">
                        {t("replay")}
                        <RotateCcwIcon className="size-3.5" />
                      </span>
                    )}
                    {(state === "today" || state === "open") && (
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-md px-3.5 py-1.5 font-label-sm text-label-sm font-semibold tracking-wider uppercase",
                          state === "today" ? "bg-primary text-on-primary" : "text-primary",
                        )}
                      >
                        {t("begin")}
                        <ArrowRightIcon className="size-3.5 rtl:rotate-180" />
                      </span>
                    )}
                    {state === "preview" && (
                      <span className="flex items-center gap-1 font-label-sm text-label-sm font-semibold tracking-wider text-primary uppercase">
                        {t("preview")}
                        <ArrowRightIcon className="size-3.5 rtl:rotate-180" />
                      </span>
                    )}
                  </div>
                </div>
              </>
            );
            const className = cn(
              "group flex h-full flex-col justify-between overflow-hidden rounded-xl bg-surface transition-all",
              state === "today" ? "shadow-md ring-2 ring-primary hover:shadow-xl" : "shadow-sm hover:shadow-md",
            );
            return (
              <li key={day.day} id={state === "today" ? "today" : undefined} className="scroll-mt-28">
                {state === "locked" ? (
                  <div className={className} aria-disabled>
                    {card}
                  </div>
                ) : (
                  <Link href={dayHref(day)} className={className}>
                    {card}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
