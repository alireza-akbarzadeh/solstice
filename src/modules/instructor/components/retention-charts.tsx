"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ActivityIcon, RepeatIcon, SparklesIcon, TrendingUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CohortCurvePoint, HabitRhythmBreakdown } from "../retention";

/**
 * 30-Day Cohort Retention Curve SVG Chart.
 * Displays Week 1 through Week 4 retention progression for cohorts of students.
 */
export function RetentionCurveChart({
  points,
  thirtyDayRate,
  cohortCount,
  eligibleMembers,
  retainedMembers,
}: {
  points: CohortCurvePoint[];
  thirtyDayRate: number | null;
  cohortCount: number;
  eligibleMembers: number;
  retainedMembers: number;
}) {
  const t = useTranslations("Studio.insights.retention");
  const format = useFormatter();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const n = (val: number) => format.number(val);

  const hasData = cohortCount > 0 && points.some((p) => p.rate > 0);

  // Chart layout dimensions
  const width = 420;
  const height = 160;
  const paddingX = 42;
  const paddingY = 24;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const coords = points.map((p, i) => {
    const x = paddingX + (i / Math.max(1, points.length - 1)) * graphWidth;
    const y = paddingY + (1 - p.rate / 100) * graphHeight;
    return { x, y, point: p };
  });

  // Construct SVG path
  const linePath = coords.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = coords[idx - 1]!;
    const cpx1 = prev.x + (curr.x - prev.x) / 2;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (curr.x - prev.x) / 2;
    const cpy2 = curr.y;
    return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
  }, "");

  const areaPath = hasData && coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1]!.x} ${height - paddingY} L ${coords[0]!.x} ${height - paddingY} Z`
    : "";

  const getWeekLabel = (week: number) => {
    if (week === 1) return t("weeksLabel.1");
    if (week === 2) return t("weeksLabel.2");
    if (week === 3) return t("weeksLabel.3");
    if (week === 4) return t("weeksLabel.4");
    return `W${week}`;
  };

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUpIcon aria-hidden className="size-4 text-primary" />
          <span className="font-label-md text-label-md font-medium text-on-surface">
            {t("cohortCurveTitle")}
          </span>
        </div>
        {thirtyDayRate !== null ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-primary">
            <SparklesIcon aria-hidden className="size-3" />
            {t("rateBadge", { percent: thirtyDayRate })}
          </span>
        ) : (
          <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
            {t("awaitingData")}
          </span>
        )}
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {eligibleMembers > 0
          ? t("curveSummary", {
              retained: n(retainedMembers),
              eligible: n(eligibleMembers),
              percent: thirtyDayRate ?? 0,
            })
          : t("newCommunityNote")}
      </p>

      {/* SVG Retention Curve */}
      <div dir="ltr" className="relative mt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible"
          role="img"
          aria-label={t("cohortCurveTitle")}
        >
          <defs>
            <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((level) => {
            const y = paddingY + (1 - level / 100) * graphHeight;
            return (
              <g key={level} className="text-outline-variant/40">
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-outline text-[10px] tabular-nums"
                >
                  {level}%
                </text>
              </g>
            );
          })}

          {/* Area & Line */}
          {hasData && (
            <>
              <path d={areaPath} fill="url(#retentionGradient)" />
              <path
                d={linePath}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Points */}
          {coords.map(({ x, y, point }, idx) => {
            const isHovered = activeIdx === idx;
            return (
              <g key={idx}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  className={cn(
                    "cursor-pointer transition-all",
                    point.rate > 0 ? "fill-primary stroke-surface" : "fill-outline stroke-surface",
                  )}
                  strokeWidth="2"
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseLeave={() => setActiveIdx(null)}
                  onFocus={() => setActiveIdx(idx)}
                  onBlur={() => setActiveIdx(null)}
                  tabIndex={0}
                  aria-label={`${point.label}: ${point.rate}% (${point.activeCount}/${point.totalMembers})`}
                />
                <text
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-on-surface-variant text-[11px] font-medium"
                >
                  {getWeekLabel(point.week)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {activeIdx !== null && coords[activeIdx] && (
          <div
            className={cn(
              "pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded-lg bg-on-surface px-3 py-1.5 text-center text-surface shadow-md",
              activeIdx === 0 && "translate-x-0",
              activeIdx === coords.length - 1 && "-translate-x-full",
            )}
            style={{
              left: `${(coords[activeIdx].x / width) * 100}%`,
              top: `${(coords[activeIdx].y / height) * 100 - 32}px`,
            }}
          >
            <div className="font-label-sm text-label-sm font-semibold tabular-nums text-surface">
              {coords[activeIdx].point.rate}% {t("retained")}
            </div>
            <div className="text-[10px] text-surface/80">
              {t("activeStudentsCount", {
                active: coords[activeIdx].point.activeCount,
                total: coords[activeIdx].point.totalMembers,
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-outline-variant/20 pt-2 text-[11px] text-on-surface-variant">
        <span>{t("benchmarkNote")}</span>
        <span className="tabular-nums">{t("cohortEvaluated", { count: cohortCount })}</span>
      </div>
    </div>
  );
}

/**
 * Habit Consistency & Practice Rhythm Card.
 * Displays distribution across Frequent (3+/wk), Steady (1-2/wk), Occasional (<1/wk), and Dormant.
 */
export function HabitRhythmCard({
  breakdown,
  repeatRate,
  avgSessionsPerMember,
}: {
  breakdown: HabitRhythmBreakdown;
  repeatRate: number;
  avgSessionsPerMember: number;
}) {
  const t = useTranslations("Studio.insights.retention");
  const format = useFormatter();
  const n = (val: number) => format.number(val);

  const total = Math.max(1, breakdown.total);
  const freqPct = Math.round((breakdown.frequent / total) * 100);
  const regPct = Math.round((breakdown.regular / total) * 100);
  const occPct = Math.round((breakdown.occasional / total) * 100);
  const dormPct = Math.max(0, 100 - (freqPct + regPct + occPct));

  return (
    <div className="flex flex-col justify-between gap-space-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ActivityIcon aria-hidden className="size-4 text-clay" />
          <span className="font-label-md text-label-md font-medium text-on-surface">
            {t("rhythmTitle")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-primary">
          <RepeatIcon aria-hidden className="size-3.5" />
          <span className="font-semibold tabular-nums">{repeatRate}%</span>
          <span className="text-on-surface-variant font-normal">{t("repeatLabel")}</span>
        </div>
      </div>

      {/* KPI highlight strip */}
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface p-2.5">
        <div>
          <div className="text-[11px] text-on-surface-variant">{t("avgPracticesPerStudent")}</div>
          <div className="font-headline-sm text-headline-sm text-on-surface tabular-nums">
            {avgSessionsPerMember}
            <span className="ms-1 text-xs font-normal text-on-surface-variant">/ {t("student")}</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] text-on-surface-variant">{t("consistentStudents")}</div>
          <div className="font-headline-sm text-headline-sm text-primary tabular-nums">
            {freqPct + regPct}%
            <span className="ms-1 text-xs font-normal text-on-surface-variant">1+ {t("perWeek")}</span>
          </div>
        </div>
      </div>

      {/* Multi-segment distribution bar */}
      <div className="space-y-1.5">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-container">
          {breakdown.frequent > 0 && (
            <div
              className="bg-primary transition-all"
              style={{ width: `${freqPct}%` }}
              title={`${t("frequent")}: ${breakdown.frequent} (${freqPct}%)`}
            />
          )}
          {breakdown.regular > 0 && (
            <div
              className="bg-clay transition-all"
              style={{ width: `${regPct}%` }}
              title={`${t("regular")}: ${breakdown.regular} (${regPct}%)`}
            />
          )}
          {breakdown.occasional > 0 && (
            <div
              className="bg-secondary-container transition-all"
              style={{ width: `${occPct}%` }}
              title={`${t("occasional")}: ${breakdown.occasional} (${occPct}%)`}
            />
          )}
          {dormPct > 0 && (
            <div
              className="bg-outline-variant/50 transition-all"
              style={{ width: `${dormPct}%` }}
              title={`${t("dormant")}: ${breakdown.dormant} (${dormPct}%)`}
            />
          )}
        </div>

        {/* Legend grid */}
        <div className="grid grid-cols-2 gap-2 pt-1 font-body-sm text-body-sm">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary shrink-0" />
            <span className="truncate text-on-surface-variant">{t("frequent")} (3+/wk):</span>
            <span className="font-semibold text-on-surface tabular-nums ms-auto">{n(breakdown.frequent)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-clay shrink-0" />
            <span className="truncate text-on-surface-variant">{t("regular")} (1-2/wk):</span>
            <span className="font-semibold text-on-surface tabular-nums ms-auto">{n(breakdown.regular)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-secondary-container shrink-0" />
            <span className="truncate text-on-surface-variant">{t("occasional")} (&lt;1/wk):</span>
            <span className="font-semibold text-on-surface tabular-nums ms-auto">{n(breakdown.occasional)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-outline-variant/60 shrink-0" />
            <span className="truncate text-on-surface-variant">{t("dormant")}:</span>
            <span className="font-semibold text-on-surface tabular-nums ms-auto">{n(breakdown.dormant)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
