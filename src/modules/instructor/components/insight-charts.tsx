"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** "Nice" round axis maximum: 1, 2, 2.5, 5 or 10 × a power of ten. */
function niceMax(value: number) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * power >= value) ?? 10;
  return step * power;
}

export type ColumnPoint = {
  /** Short axis label (e.g. "Sep 29"). */
  label: string;
  value: number;
  /** The value as the reader should see it, already localized. */
  display: string;
  /** Extra tooltip line, e.g. minutes or active members. */
  detail?: string;
};

/**
 * Weekly columns: one series, thin bars grown from one baseline, a hairline grid with three
 * round ticks, a label on the latest week only, and a tooltip on hover or keyboard focus.
 * The plot reads left to right in both languages, like the studio's other charts.
 */
export function ColumnChart({ points, label, maxLabels = 4 }: { points: ColumnPoint[]; label: string; /** Axis dates shown at most; fewer on narrow cards. */ maxLabels?: number }) {
  const format = useFormatter();
  const ticks = (n: number) => format.number(n, { notation: "compact", maximumFractionDigits: 1 });
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...points.map((p) => p.value)));
  const last = points.length - 1;
  // Fewer axis labels as the range grows, so they never collide.
  const every = Math.ceil(points.length / maxLabels);

  return (
    <div dir="ltr" className="flex gap-2" role="group" aria-label={label}>
      <div className="flex h-44 w-10 shrink-0 flex-col justify-between pb-6 text-end font-label-sm text-label-sm text-outline tabular-nums">
        {[max, max / 2, 0].map((n) => (
          <span key={n} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
            {ticks(n)}
          </span>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-px w-full bg-outline-variant/50" />
          ))}
        </div>
        <ul className="relative flex h-44 items-stretch gap-0.5">
          {points.map((point, i) => {
            const height = (point.value / max) * 100;
            const showValue = i === last && point.value > 0;
            return (
              <li key={point.label + i} className="flex min-w-0 flex-1 flex-col">
                <button
                  type="button"
                  className="group relative flex flex-1 items-end justify-center outline-none"
                  aria-label={`${point.label}: ${point.display}${point.detail ? `, ${point.detail}` : ""}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive((a) => (a === i ? null : a))}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive((a) => (a === i ? null : a))}
                >
                  {showValue && (
                    <span className="absolute font-label-sm text-label-sm text-on-surface tabular-nums" style={{ bottom: `calc(${height}% + 4px)` }}>
                      {point.display}
                    </span>
                  )}
                  <span
                    className={cn(
                      "w-full max-w-6 rounded-t transition-colors",
                      point.value > 0 ? "bg-primary-container" : "bg-transparent",
                      active === i && "bg-primary",
                      "group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primary",
                    )}
                    style={{ height: point.value > 0 ? `max(${height}%, 2px)` : 0 }}
                  />
                  {active === i && (
                    <span
                      role="tooltip"
                      className={cn(
                        "absolute bottom-full z-10 mb-1 min-w-28 rounded-lg bg-on-surface px-2.5 py-1.5 text-start whitespace-nowrap text-surface shadow-md",
                        i < points.length / 3 ? "left-0" : i > (points.length * 2) / 3 ? "right-0" : "left-1/2 -translate-x-1/2",
                      )}
                    >
                      <span className="block font-label-md text-label-md font-semibold tabular-nums">{point.display}</span>
                      <span className="block font-label-sm text-label-sm opacity-80">{point.label}</span>
                      {point.detail && <span className="block font-label-sm text-label-sm opacity-80">{point.detail}</span>}
                    </span>
                  )}
                </button>
                <span className="flex h-6 justify-center overflow-visible pt-1.5 font-label-sm text-label-sm whitespace-nowrap text-outline">
                  {i % every === (last % every) ? point.label : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const STEPS = [0, 22, 45, 70, 100];

/**
 * When members practise: weekdays × hours in the viewer's own time zone. The server counts
 * half-hour slots in UTC (Sunday first); here they are shifted by the browser's offset, which
 * also handles half-hour zones such as Tehran. Rendered after mount, since the server can't
 * know the time zone.
 */
export function PracticeHeatmap({ slots, weekStartsOn }: { slots: number[]; /** 0 = Sunday, 1 = Monday, 6 = Saturday. */ weekStartsOn: number }) {
  const t = useTranslations("Studio.insights.heatmap");
  const format = useFormatter();
  // 2023-01-01 was a Sunday; formatted in UTC so the names never shift.
  const dayNames = Array.from({ length: 7 }, (_, d) => format.dateTime(new Date(Date.UTC(2023, 0, 1 + d)), { weekday: "short", timeZone: "UTC" }));
  const hourLabel = Array.from({ length: 24 }, (_, h) => format.dateTime(new Date(Date.UTC(2023, 0, 1, h)), { hour: "numeric", timeZone: "UTC" }));
  const cellLabel = (day: string, hour: string, count: number) => t("cell", { day, hour, count });
  const [grid, setGrid] = useState<number[][] | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const shift = Math.round(-new Date().getTimezoneOffset() / 30);
    const local = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    slots.forEach((n, i) => {
      if (!n) return;
      const j = (((i + shift) % 336) + 336) % 336;
      local[Math.floor(j / 48)]![Math.floor((j % 48) / 2)]! += n;
    });
    setGrid(local);
  }, [slots]);

  if (!grid) return <div className="h-56" />;
  const peak = Math.max(1, ...grid.flat());
  const order = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / peak) * 4)));

  return (
    <div dir="ltr" className="flex flex-col gap-2">
      <div className="grid grid-cols-[2.75rem_repeat(24,minmax(0,1fr))] gap-0.5">
        {order.map((day) => (
          <div key={day} className="contents">
            <span className="flex items-center pe-1 font-label-sm text-label-sm text-outline">{dayNames[day]}</span>
            {grid[day]!.map((n, hour) => {
              const key = `${day}:${hour}`;
              const text = cellLabel(dayNames[day]!, hourLabel[hour]!, n);
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={text}
                  onPointerEnter={() => setActive(key)}
                  onPointerLeave={() => setActive((a) => (a === key ? null : a))}
                  onFocus={() => setActive(key)}
                  onBlur={() => setActive((a) => (a === key ? null : a))}
                  className="relative aspect-square rounded-[3px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                  style={{ background: `color-mix(in oklab, var(--primary-container) ${STEPS[level(n)]}%, var(--surface-container))` }}
                >
                  {active === key && (
                    <span
                      role="tooltip"
                      className={cn(
                        "absolute bottom-full z-10 mb-1 rounded-lg bg-on-surface px-2.5 py-1.5 font-label-sm text-label-sm whitespace-nowrap text-surface shadow-md",
                        hour < 8 ? "left-0" : hour > 15 ? "right-0" : "left-1/2 -translate-x-1/2",
                      )}
                    >
                      {text}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
        <span />
        {hourLabel.map((h, hour) => (
          <span key={hour} className="text-center font-label-sm text-[10px] text-outline">
            {hour % 6 === 0 ? h : ""}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 font-label-sm text-label-sm text-outline">
        <span>{t("less")}</span>
        {STEPS.map((step) => (
          <span key={step} className="size-3 rounded-[3px]" style={{ background: `color-mix(in oklab, var(--primary-container) ${step}%, var(--surface-container))` }} />
        ))}
        <span>{t("more")}</span>
      </div>
    </div>
  );
}
