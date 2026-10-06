import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  DownloadIcon,
  MapPinIcon,
  SparklesIcon,
  TvIcon,
  VideoIcon,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/modules/memberships/server/viewer";
import { getLiveClassBySlug } from "@/modules/classes/server/classes";
import { RsvpButton } from "@/modules/classes/components/rsvp-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const liveClass = await getLiveClassBySlug(slug);
  if (!liveClass) notFound();

  const title = localize(liveClass.title, locale);
  const description = localize(liveClass.description, locale);

  return {
    title: `${title} · Arte Yoga Studio`,
    description,
  };
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await getViewer();
  const liveClass = await getLiveClassBySlug(slug, viewer.user?.id);
  if (!liveClass) notFound();

  const t = await getTranslations("LiveClasses");
  const format = await getFormatter();

  const title = localize(liveClass.title, locale);
  const description = localize(liveClass.description, locale);
  const location = localize(liveClass.locationName, locale);
  const teacher = localize(liveClass.instructorName, locale);

  const start = new Date(liveClass.scheduledAt);
  const now = new Date();
  const isPast =
    liveClass.status === "completed" ||
    start.getTime() + liveClass.durationMinutes * 60 * 1000 < now.getTime();
  const isLive =
    liveClass.status === "live" ||
    (now >= new Date(start.getTime() - 15 * 60 * 1000) &&
      now <= new Date(start.getTime() + liveClass.durationMinutes * 60 * 1000));

  const formattedDate = format.dateTime(start, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = format.dateTime(start, {
    hour: "numeric",
    minute: "2-digit",
  });

  const spotsLeft =
    liveClass.capacity !== null
      ? Math.max(0, liveClass.capacity - (liveClass.rsvpCount ?? 0))
      : null;

  return (
    <div className="flex flex-col w-full py-space-lg md:py-space-xl">
      <div className="mx-auto w-full max-w-content px-margin-mobile md:px-margin space-y-space-lg">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-label-sm text-on-surface-variant">
          <Link href="/classes" className="hover:text-primary transition-colors">
            {t("title")}
          </Link>
          <span>/</span>
          <span className="text-on-surface truncate">{title}</span>
        </nav>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Cover & Media Frame (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-space-sm">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md">
              <Image
                src={liveClass.coverImage || "/images/classes/kyoto-pavilion-stage.jpg"}
                alt={title}
                fill
                priority
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent" />

              <div className="absolute top-4 inset-x-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/90 px-3.5 py-1 text-xs font-label-sm font-semibold tracking-wider text-secondary uppercase shadow-sm backdrop-blur-md">
                  <MapPinIcon className="size-3.5 text-primary" />
                  {location}
                </span>

                <span className="rounded-full bg-inverse-surface/70 px-3 py-1 text-xs font-label-sm font-semibold text-surface backdrop-blur-md">
                  {t("durationMins", { minutes: liveClass.durationMinutes })}
                </span>
              </div>

              <div className="absolute bottom-4 inset-x-4 text-surface drop-shadow-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed block mb-0.5">
                  {teacher}
                </span>
                <p className="font-headline-sm text-headline-sm text-surface font-light">
                  {formattedDate} · {formattedTime}
                </p>
              </div>
            </div>

            {/* Room Banner if Live */}
            {isLive && (
              <div className="p-space-md rounded-2xl bg-secondary-container text-on-secondary-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex size-full rounded-full bg-secondary opacity-75" />
                    <span className="relative inline-flex rounded-full size-2.5 bg-secondary" />
                  </span>
                  <span className="font-label-md text-label-md uppercase tracking-wider font-bold">
                    {t("roomLive")}
                  </span>
                </div>

                <Button asChild className="shadow-sm">
                  <Link href={`/classes/${liveClass.slug}/live`}>
                    <TvIcon className="size-4 me-2" />
                    <span>{t("enterRoom")}</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Details & Reservation Card (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="p-space-lg rounded-3xl bg-surface-container-low border border-outline-variant/30 shadow-sm space-y-space-md">
              <div className="space-y-space-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {liveClass.access === "members_only" ? (
                    <span className="rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm text-clay uppercase">
                      {t("membersOnly")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-primary/10 px-3 py-1 font-label-sm text-label-sm text-primary uppercase">
                      {t("openAccess")}
                    </span>
                  )}
                  {spotsLeft !== null && (
                    <span className="rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
                      {t("spotsLeft", { count: spotsLeft })}
                    </span>
                  )}
                </div>

                <h1 className="font-headline-lg text-headline-lg text-primary leading-tight">
                  {title}
                </h1>

                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Soundscape & Guidance details */}
              {liveClass.soundscapeDetails && (
                <div className="p-3.5 rounded-xl bg-surface-container flex items-center gap-3">
                  <SparklesIcon className="size-5 text-secondary shrink-0" />
                  <div className="flex flex-col text-xs">
                    <span className="font-label-sm text-on-surface font-semibold">
                      {t("soundBalance")}
                    </span>
                    <span className="text-on-surface-variant">
                      {liveClass.soundscapeDetails}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-space-xs space-y-space-xs border-t border-outline-variant/30">
                {isPast ? (
                  liveClass.replayPracticeSlug ? (
                    <Button asChild className="w-full">
                      <Link href={`/practices/${liveClass.replayPracticeSlug}`}>
                        <VideoIcon className="size-4 me-2" />
                        <span>{t("watchReplay")}</span>
                      </Link>
                    </Button>
                  ) : (
                    <p className="text-xs text-on-surface-variant text-center py-2">
                      {t("emptyPast")}
                    </p>
                  )
                ) : (
                  <div className="flex flex-col gap-2">
                    <RsvpButton
                      classId={liveClass.id}
                      classSlug={liveClass.slug}
                      initialRsvpd={liveClass.userHasRsvp}
                      initialCount={liveClass.rsvpCount ?? 0}
                      capacity={liveClass.capacity}
                      access={liveClass.access}
                      userRole={viewer.user?.role}
                      isLive={isLive}
                      className="w-full py-6 text-base"
                    />

                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" className="flex-1">
                        <a
                          href={`/api/classes/${liveClass.slug}/calendar?locale=${locale}`}
                          download={`${liveClass.slug}.ics`}
                        >
                          <DownloadIcon className="size-4 me-2 text-primary" />
                          <span>{t("addToCalendar")}</span>
                        </a>
                      </Button>

                      <Button asChild variant="secondary" className="flex-1">
                        <Link href={`/classes/${liveClass.slug}/live`}>
                          <TvIcon className="size-4 me-2" />
                          <span>{t("enterRoom")}</span>
                        </Link>
                      </Button>
                    </div>

                    <p className="text-[11px] text-outline text-center pt-1">
                      {t("roomOpensSoon")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Teacher Dossier Card */}
            <div className="p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-4">
              <div className="relative size-14 rounded-full overflow-hidden shrink-0 border border-outline-variant/40">
                <Image
                  src="/images/classes/peer-clara.jpg"
                  alt={teacher}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                  {t("instructorLead")}
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  {teacher}
                </span>
                <span className="font-body-sm text-xs text-on-surface-variant">
                  Kyoto Lineage · Somatic Down-Regulation
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
