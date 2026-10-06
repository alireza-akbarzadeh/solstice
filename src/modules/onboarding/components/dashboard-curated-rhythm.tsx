"use client";

import { useTranslations } from "next-intl";
import { CompassIcon, SparklesIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { PracticeSummary } from "@/modules/practices/types";
import type { MemberOnboarding } from "../types";
import { OnboardingDialog } from "./onboarding-dialog";

export function DashboardCuratedRhythm({
  onboarding,
  library = [],
}: {
  onboarding?: MemberOnboarding | null;
  library?: PracticeSummary[];
}) {
  const t = useTranslations("Onboarding");

  if (!onboarding) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-space-md rounded-2xl bg-secondary-container/20 border border-secondary/30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-secondary/15 flex items-center justify-center shrink-0">
            <CompassIcon className="size-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {t("uncompletedTitle")}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("uncompletedSubtitle")}
            </p>
          </div>
        </div>

        <OnboardingDialog />
      </div>
    );
  }

  // Find a recommended practice from the library matching their goals/level
  const recommended =
    library.find((p) => {
      if (onboarding.experienceLevel === "beginner" && p.intensity.level === "gentle") return true;
      if (onboarding.experienceLevel === "advanced" && p.intensity.level === "fire") return true;
      return true;
    }) ?? library[0];

  return (
    <div className="flex flex-col gap-3 p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-xs">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold">
            {t("curatedForYou")}
          </span>
          <span className="text-outline-variant">·</span>
          <span className="text-xs text-on-surface-variant capitalize">
            {t(`levels.${onboarding.experienceLevel}`)} · {t(`times.${onboarding.timeAvailable}`)}
          </span>
        </div>

        <OnboardingDialog
          initialData={onboarding}
          trigger={
            <button className="text-xs text-primary hover:underline font-label-sm">
              {t("editPreferences")}
            </button>
          }
        />
      </div>

      {recommended && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <h4 className="font-headline-sm text-headline-sm text-on-surface">
              {recommended.title}
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
              {recommended.summary}
            </p>
          </div>

          <Button asChild size="sm" className="shrink-0">
            <Link href={`/practices/${recommended.slug}`}>
              <span>{t("startCurated")}</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
