"use client";

import { useTranslations } from "next-intl";
import { CompassIcon } from "lucide-react";
import type { OnboardingAggregate, PrimaryGoal } from "@/modules/onboarding/types";

export function InsightsOnboardingTile({
  aggregate,
}: {
  aggregate: OnboardingAggregate;
}) {
  const t = useTranslations("Onboarding");
  const tInsights = useTranslations("Studio.insights");

  const total = Math.max(1, aggregate.totalCompleted);

  return (
    <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-low p-space-md border border-outline-variant/30 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CompassIcon className="size-5 text-secondary" />
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            {tInsights("onboardingTitle")}
          </h3>
        </div>
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
          {tInsights("onboardingResponses", { count: aggregate.totalCompleted })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* 1. Experience Levels */}
        <div className="space-y-2 p-3 rounded-xl bg-surface">
          <span className="font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
            {t("levelLabel")}
          </span>
          <div className="space-y-1.5 pt-1">
            {(["beginner", "intermediate", "advanced"] as const).map((lvl) => {
              const count = aggregate.levels[lvl];
              const percent = Math.round((count / total) * 100);
              return (
                <div key={lvl} className="space-y-0.5">
                  <div className="flex justify-between text-xs font-label-sm">
                    <span className="text-on-surface">{t(`levels.${lvl}`)}</span>
                    <span className="text-outline">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Top Sanctuary Intentions */}
        <div className="space-y-2 p-3 rounded-xl bg-surface">
          <span className="font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
            {t("goalsLabel")}
          </span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(Object.entries(aggregate.goals) as [PrimaryGoal, number][])
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([goal, count]) => (
                <span
                  key={goal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/30 text-on-secondary-container text-xs font-label-sm"
                >
                  <span>{t(`goals.${goal}`)}</span>
                  <span className="text-outline font-semibold">({count})</span>
                </span>
              ))}
          </div>
        </div>

        {/* 3. Session Rhythms */}
        <div className="space-y-2 p-3 rounded-xl bg-surface">
          <span className="font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
            {t("timeLabel")}
          </span>
          <div className="space-y-1.5 pt-1">
            {(["15_mins", "30_mins", "45_plus"] as const).map((tm) => {
              const count = aggregate.timeAvailable[tm];
              const percent = Math.round((count / total) * 100);
              return (
                <div key={tm} className="space-y-0.5">
                  <div className="flex justify-between text-xs font-label-sm">
                    <span className="text-on-surface">{t(`times.${tm}`)}</span>
                    <span className="text-outline">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
