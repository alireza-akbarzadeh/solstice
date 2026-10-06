"use client";

import { useTranslations } from "next-intl";
import { AlertCircleIcon, CompassIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MemberOnboarding } from "@/modules/onboarding/types";

export function DossierOnboardingCard({
  onboarding,
}: {
  onboarding?: MemberOnboarding | null;
}) {
  const t = useTranslations("Onboarding");
  const tStudio = useTranslations("Studio.members.dossier");

  if (!onboarding) {
    return (
      <div className="rounded-lg bg-surface p-space-sm shadow-sm text-xs text-on-surface-variant flex items-center gap-2">
        <CompassIcon className="size-4 text-outline shrink-0" />
        <span>{tStudio("noOnboarding")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface p-space-sm shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-clay uppercase font-semibold">
          {tStudio("onboardingTitle")}
        </span>
        <Badge variant="outline" className="text-xs">
          {t(`levels.${onboarding.experienceLevel}`)}
        </Badge>
      </div>

      {/* Goals */}
      {onboarding.primaryGoals.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {onboarding.primaryGoals.map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 rounded-md bg-surface-container text-[11px] font-label-sm text-on-surface-variant"
            >
              {t(`goals.${g}`)}
            </span>
          ))}
          <span className="px-2 py-0.5 rounded-md bg-surface-container text-[11px] font-label-sm text-primary font-medium">
            {t(`times.${onboarding.timeAvailable}`)}
          </span>
        </div>
      )}

      {/* Physical Sensitivities / Injuries */}
      {onboarding.injuriesAndLimits && (
        <div className="mt-1 p-2 rounded-md bg-secondary/10 border border-secondary/20 flex items-start gap-2 text-xs text-on-surface">
          <AlertCircleIcon className="size-3.5 text-secondary shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-secondary block font-label-sm">
              {tStudio("physicalLimits")}:
            </strong>
            <p className="font-body-sm text-xs leading-relaxed">
              {onboarding.injuriesAndLimits}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
