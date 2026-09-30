"use client";

import { CheckIcon, Flower2Icon, LeafIcon } from "lucide-react";
import { useLocale, useNow, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

// Days are the member's own calendar days, so everything here runs in the browser.

const DAY = 24 * 60 * 60 * 1000;

export const localDayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/** 0 = Sunday … 6 = Saturday. Persian weeks start on Saturday. */
export function firstDayOfWeek(locale: string) {
  return locale === "fa" ? 6 : 1;
}

export function currentStreak(days: Set<string>, today: Date) {
  const cursor = new Date(today);
  if (!days.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Renders nothing until mounted: the server can't know the member's timezone. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function Greeting({ name }: { name: string }) {
  const t = useTranslations("Dashboard");
  const mounted = useMounted();
  const hour = new Date().getHours();
  const part = !mounted ? "day" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return <>{t(`greeting.${part}`, { name })}</>;
}

/** "Your rhythm this week": one dot per day, filled when you practiced. */
export function WeekRhythm({ completedAt }: { completedAt: string[] }) {
  const t = useTranslations("Dashboard.rhythm");
  const locale = useLocale();
  // Native Intl on purpose: next-intl formats in the server time zone, these are local days.
  const weekday = (day: Date, style: "narrow" | "long") => new Intl.DateTimeFormat(locale, { weekday: style }).format(day);
  const now = useNow({ updateInterval: 60 * 60 * 1000 });
  const mounted = useMounted();

  const days = new Set(completedAt.map((iso) => localDayKey(new Date(iso))));
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() - firstDayOfWeek(locale) + 7) % 7));
  const week = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * DAY + 2 * 60 * 60 * 1000));
  const todayKey = localDayKey(now);
  const thisWeek = mounted ? completedAt.filter((iso) => new Date(iso) >= start).length : 0;
  const streak = mounted ? currentStreak(days, now) : 0;

  return (
    <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm">
      <ol className="grid grid-cols-7 gap-1.5 text-center sm:gap-2">
        {week.map((day) => {
          const key = localDayKey(day);
          const done = mounted && days.has(key);
          const isToday = mounted && key === todayKey;
          return (
            <li key={key} className="flex flex-col items-center gap-1">
              <span className={cn("font-label-sm text-label-sm", isToday ? "font-semibold text-clay" : "text-on-surface-variant")}>
                {weekday(day, "narrow")}
              </span>
              <span
                aria-label={`${weekday(day, "long")}: ${done ? t("practiced") : t("rest")}`}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  done ? "bg-primary-fixed text-primary" : isToday ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container-high",
                )}
              >
                {done ? (
                  <CheckIcon className="size-4" strokeWidth={3} />
                ) : isToday ? (
                  <Flower2Icon className="size-4 motion-safe:animate-pulse" />
                ) : (
                  <span className="size-1.5 rounded-full bg-outline-variant" />
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-on-surface-variant">
        <span className="flex items-center gap-2 font-body-sm text-body-sm">
          <LeafIcon className="size-4 text-primary" />
          {t("thisWeek", { count: thisWeek })}
        </span>
        <span className="font-label-md text-label-md font-medium text-clay">{t("streak", { count: streak })}</span>
      </div>
    </div>
  );
}
