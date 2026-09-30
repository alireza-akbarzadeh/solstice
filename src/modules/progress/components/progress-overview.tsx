"use client";

import { FlameIcon, HourglassIcon, MedalIcon, SparklesIcon } from "lucide-react";
import { useFormatter, useLocale, useNow, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { currentStreak, firstDayOfWeek, localDayKey } from "./rhythm";

type Session = { at: string; minutes: number };

const WEEKS = 12;

function longestStreak(days: Set<string>) {
  const sorted = [...days]
    .map((key) => {
      const [y, m, d] = key.split("-").map(Number);
      return new Date(y ?? 0, m ?? 0, d ?? 1).getTime();
    })
    .sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let previous = Number.NaN;
  for (const time of sorted) {
    // Consecutive calendar days (DST-safe: compare dates, not 24h steps).
    const expected = new Date(previous);
    expected.setDate(expected.getDate() + 1);
    run = expected.getTime() === time ? run + 1 : 1;
    best = Math.max(best, run);
    previous = time;
  }
  return best;
}

/** Totals, streaks and a 12-week calendar — in the member's own days, so computed in the browser. */
export function ProgressOverview({ sessions }: { sessions: Session[] }) {
  const t = useTranslations("Progress");
  const format = useFormatter();
  const locale = useLocale();
  const now = useNow({ updateInterval: 60 * 60 * 1000 });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const minutesByDay = new Map<string, number>();
  for (const s of sessions) {
    const key = localDayKey(new Date(s.at));
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + s.minutes);
  }
  const days = new Set(minutesByDay.keys());
  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);

  const stats = [
    { icon: SparklesIcon, label: t("stats.sessions"), value: format.number(sessions.length) },
    { icon: HourglassIcon, label: t("stats.minutes"), value: format.number(totalMinutes) },
    { icon: FlameIcon, label: t("stats.streak"), value: mounted ? t("stats.days", { count: currentStreak(days, now) }) : "—" },
    { icon: MedalIcon, label: t("stats.longest"), value: mounted ? t("stats.days", { count: longestStreak(days) }) : "—" },
  ];

  // Columns are weeks (oldest first), rows are weekdays in the locale's order.
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() - firstDayOfWeek(locale) + 7) % 7) - (WEEKS - 1) * 7);
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      return day;
    }),
  );
  const level = (minutes: number) => (minutes === 0 ? 0 : minutes < 20 ? 1 : minutes < 40 ? 2 : 3);
  const tone = ["bg-surface-container-high", "bg-primary-fixed", "bg-primary-fixed-dim", "bg-primary"];
  const dayLabel = (day: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(day);

  return (
    <div className="flex flex-col gap-space-lg">
      <dl className="grid grid-cols-2 gap-gutter lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col-reverse gap-1 rounded-xl bg-surface-container-low p-space-md">
            <dt className="font-label-sm text-label-sm tracking-wider text-on-surface-variant uppercase">{label}</dt>
            <dd className="flex items-center gap-2 font-headline-md text-headline-md text-primary">
              <Icon className="size-5 text-clay" />
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="rounded-xl bg-surface-container-low p-space-md md:p-space-lg">
        <h2 className="mb-space-md font-headline-sm text-headline-sm text-on-surface">{t("calendar.title", { weeks: WEEKS })}</h2>
        <div className="overflow-x-auto pb-2">
          <div className="flex w-max gap-1.5" role="grid" aria-label={t("calendar.title", { weeks: WEEKS })}>
            {weeks.map((week) => (
              <div key={localDayKey(week[0]!)} role="row" className="flex flex-col gap-1.5">
                {week.map((day) => {
                  const minutes = mounted ? (minutesByDay.get(localDayKey(day)) ?? 0) : 0;
                  const future = day > now;
                  return (
                    <span
                      key={localDayKey(day)}
                      role="gridcell"
                      title={`${dayLabel(day)} · ${t("calendar.minutes", { count: minutes })}`}
                      aria-label={`${dayLabel(day)}: ${t("calendar.minutes", { count: minutes })}`}
                      className={cn("size-4 rounded-[4px] md:size-5", future ? "bg-transparent" : tone[level(minutes)])}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span>{t("calendar.less")}</span>
          {tone.map((c) => (
            <span key={c} className={cn("size-3.5 rounded-[3px]", c)} />
          ))}
          <span>{t("calendar.more")}</span>
        </div>
      </section>
    </div>
  );
}
