"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useSanctuaryStore } from "./sanctuary-store";

export function PranayamaCircle() {
  const locale = useLocale();
  const t = useTranslations("LiveClasses");

  const breathPhase = useSanctuaryStore((state) => state.breathPhase);
  const breathSeconds = useSanctuaryStore((state) => state.breathSeconds);
  const sharedBreaths = useSanctuaryStore((state) => state.sharedBreaths);
  const exhalePulse = useSanctuaryStore((state) => state.exhalePulse);
  const triggerExhale = useSanctuaryStore((state) => state.triggerExhale);

  const phaseNames = {
    inhale: locale === "fa" ? "دم" : "Inhale",
    retain: locale === "fa" ? "حبس دم" : "Retain",
    exhale: locale === "fa" ? "بازدم" : "Exhale",
    empty: locale === "fa" ? "تخلیه" : "Empty",
  };

  return (
    <div className="bg-surface-container-low rounded-2xl p-space-md border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
      {/* Visual Breath Cadence Indicator */}
      <div className="flex items-center gap-4">
        <div className="relative size-14 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/40">
          <span
            className={cn(
              "absolute inset-1 rounded-full transition-transform duration-1000 ease-sanctuary",
              breathPhase === "inhale" && "scale-100 bg-secondary/20",
              breathPhase === "retain" && "scale-100 bg-primary/25 ring-2 ring-primary/40",
              breathPhase === "exhale" && "scale-50 bg-clay/20",
              breathPhase === "empty" && "scale-25 bg-outline/20",
            )}
          />
          <span className="font-headline-sm text-headline-sm text-on-surface font-light relative z-10">
            {breathSeconds}
          </span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              {t("collectiveCadence")}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-label-sm font-semibold text-primary">
              {phaseNames[breathPhase]}
            </span>
          </div>
          <p className="font-headline-sm text-headline-sm text-on-surface">
            {t("pranayamaName")}
          </p>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {t("pranayamaDesc")}
          </span>
        </div>
      </div>

      {/* Breath Resonance Pulse Interactive Trigger */}
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-outline-variant/30">
        <div className="flex flex-col items-end">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
            {t("shareBreath")}
          </span>
          <span className="font-headline-sm text-headline-sm text-primary font-medium">
            {t("breathsShared", { count: sharedBreaths })}
          </span>
        </div>

        <button
          onClick={triggerExhale}
          className={cn(
            "relative size-12 rounded-full bg-secondary-container text-on-secondary-container flex flex-col items-center justify-center shadow-sm active:scale-95 transition-all overflow-hidden",
            exhalePulse && "scale-110 ring-4 ring-secondary/30",
          )}
          title={t("tapToExhale")}
          aria-label={t("tapToExhale")}
        >
          <span className="font-label-sm text-label-sm text-secondary font-bold">
            {t("exhale")}
          </span>
        </button>
      </div>
    </div>
  );
}
