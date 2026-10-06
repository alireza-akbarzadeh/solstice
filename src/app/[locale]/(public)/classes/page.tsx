import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";
import { getViewer } from "@/modules/memberships/server/viewer";
import {
  getPastLiveClasses,
  getUpcomingLiveClasses,
} from "@/modules/classes/server/classes";
import { LiveScheduleView } from "@/modules/classes/components/live-schedule-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "LiveClasses" });

  return {
    title: `${t("title")} · Arte Yoga Studio`,
    description: t("subtitle"),
  };
}

export default async function ClassesSchedulePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await getViewer();
  const t = await getTranslations("LiveClasses");

  const [upcoming, past] = await Promise.all([
    getUpcomingLiveClasses(viewer.user?.id),
    getPastLiveClasses(viewer.user?.id),
  ]);

  return (
    <div className="flex flex-col w-full py-space-lg md:py-space-xl">
      <div className="mx-auto w-full max-w-content px-margin-mobile md:px-margin space-y-space-lg">
        {/* Editorial Header */}
        <header className="max-w-3xl space-y-space-xs">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            <span className="size-1.5 rounded-full bg-secondary" />
            <span>{t("eyebrow")}</span>
          </div>

          <h1 className="font-display-mobile text-display-mobile text-primary md:font-display md:text-display leading-tight">
            {t("title")}
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            {t("subtitle")}
          </p>
        </header>

        {/* Schedule & Sangha Sessions */}
        <LiveScheduleView
          upcomingClasses={upcoming}
          pastClasses={past}
          userRole={viewer.user?.role}
        />
      </div>
    </div>
  );
}
