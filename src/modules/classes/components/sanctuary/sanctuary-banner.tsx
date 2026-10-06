"use client";

import { useTranslations } from "next-intl";
import { SparklesIcon } from "lucide-react";

export function SanctuaryBanner({ title }: { title: string }) {
  const t = useTranslations("LiveClasses");

  return (
    <section className="w-full bg-surface-container-low px-margin-mobile md:px-margin py-3 border-b border-outline-variant/30">
      <div className="max-w-content mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex size-2.5">
            <span className="animate-ping absolute inline-flex size-full rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex rounded-full size-2.5 bg-secondary" />
          </span>
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
            {t("roomLive")}
          </span>
          <span className="text-outline-variant hidden md:inline">·</span>
          <span className="font-label-md text-label-md text-on-surface hidden md:inline font-medium">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <SparklesIcon className="size-4 text-primary" />
            <span>{t("sacredAttendance", { count: 148 })}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-surface px-3 py-1 rounded-full shadow-xs border border-outline-variant/30">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="font-label-sm text-label-sm tracking-wide text-primary">
              {t("synchronizedResonance")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
