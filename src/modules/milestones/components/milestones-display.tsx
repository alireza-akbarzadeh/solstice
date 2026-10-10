import {
  AwardIcon,
  CrownIcon,
  FlameIcon,
  HeartIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
  SunriseIcon,
  TreePineIcon,
  WindIcon,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import type { EvaluatedMilestone } from "../types";

type Props = {
  locale: "en" | "fa";
  milestones: EvaluatedMilestone[];
  unlockedCount: number;
  totalCount: number;
  recentUnlocked: EvaluatedMilestone | null;
  nextMilestone: EvaluatedMilestone | null;
};

function MilestoneIcon({ icon, className }: { icon: EvaluatedMilestone["icon"]; className?: string }) {
  switch (icon) {
    case "sparkles":
      return <SparklesIcon className={className} />;
    case "flame":
      return <FlameIcon className={className} />;
    case "heart":
      return <HeartIcon className={className} />;
    case "sun":
      return <SunIcon className={className} />;
    case "tree":
      return <TreePineIcon className={className} />;
    case "crown":
      return <CrownIcon className={className} />;
    case "wind":
      return <WindIcon className={className} />;
    case "moon":
      return <MoonIcon className={className} />;
    case "sunrise":
      return <SunriseIcon className={className} />;
    default:
      return <AwardIcon className={className} />;
  }
}

export async function MilestonesDisplay({
  locale,
  milestones,
  unlockedCount,
  totalCount,
  recentUnlocked: _,
  nextMilestone,
}: Props) {
  const t = await getTranslations("Milestones");
  const format = await getFormatter();

  return (
    <section aria-labelledby="milestones-heading" className="mt-space-xl">
      <div className="mb-space-md flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="font-label-md text-label-md tracking-widest text-clay uppercase">
            {t("eyebrow")}
          </span>
          <h2 id="milestones-heading" className="mt-1 font-headline-md text-headline-md text-on-surface">
            {t("title")}
          </h2>
        </div>
        <span className="font-label-md text-label-md rounded-full bg-surface-container-high px-3.5 py-1 text-on-surface-variant font-medium">
          {t("unlockedProgress", { count: unlockedCount, total: totalCount })}
        </span>
      </div>

      {/* Featured Callout: Next up or Recent Unlocked */}
      {nextMilestone && (
        <div className="mb-space-lg rounded-2xl border border-secondary-container/40 bg-gradient-to-r from-surface-container-low to-surface-container-lowest p-space-md shadow-xs md:p-space-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <MilestoneIcon icon={nextMilestone.icon} className="size-6" />
              </div>
              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-clay font-medium">
                  {t("nextMilestone")}
                </p>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {nextMilestone.title[locale]}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                  {nextMilestone.description[locale]}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-56 shrink-0">
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                <span>{t("progress")}</span>
                <span className="font-medium text-secondary">{nextMilestone.progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-variant">
                <div
                  className="h-full rounded-full bg-secondary transition-all"
                  style={{ width: `${nextMilestone.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestones Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {milestones.map((m) => {
          return (
            <div
              key={m.id}
              className={cn(
                "relative flex flex-col justify-between rounded-2xl p-space-md transition-all duration-300",
                m.unlocked
                  ? "border border-clay/30 bg-surface-container-low shadow-xs hover:border-clay/50"
                  : "border border-outline-variant/30 bg-surface-container-lowest/70 opacity-80 hover:opacity-100",
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl transition-transform",
                      m.unlocked
                        ? "bg-clay/15 text-clay ring-1 ring-clay/40"
                        : "bg-surface-variant/40 text-on-surface-variant",
                    )}
                  >
                    <MilestoneIcon icon={m.icon} className="size-5" />
                  </div>
                  {m.unlocked ? (
                    <span className="rounded-full bg-clay/15 px-2.5 py-0.5 font-label-xs text-label-xs font-semibold text-clay">
                      {t("earned")}
                    </span>
                  ) : (
                    <span className="font-label-xs text-label-xs font-medium text-on-surface-variant tabular-nums">
                      {m.current} / {m.target}
                    </span>
                  )}
                </div>

                <h3 className="font-label-lg text-label-lg font-semibold text-on-surface">
                  {m.title[locale]}
                </h3>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                  {m.description[locale]}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-hairline">
                {m.unlocked ? (
                  <p className="font-label-xs text-label-xs text-on-surface-variant flex items-center justify-between">
                    <span>{t("unlockedOn")}</span>
                    <span className="font-medium">
                      {m.unlockedAt ? format.dateTime(m.unlockedAt, { dateStyle: "medium" }) : "—"}
                    </span>
                  </p>
                ) : (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all"
                        style={{ width: `${m.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
