"use client";

import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  DownloadIcon,
  MapPinIcon,
  SparklesIcon,
  TvIcon,
  UserCheckIcon,
  VideoIcon,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LiveClass } from "../types";
import { RsvpButton } from "./rsvp-button";

export function LiveClassCard({
  liveClass,
  userRole,
  className,
}: {
  liveClass: LiveClass;
  userRole?: string | null;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("LiveClasses");
  const format = useFormatter();

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
    month: "short",
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
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low transition-all duration-300 hover:border-outline-variant hover:shadow-md",
        isLive && "border-primary/40 ring-1 ring-primary/20",
        className,
      )}
    >
      {/* Cover / Media Frame */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-container">
        <Image
          src={liveClass.coverImage || "/images/classes/kyoto-pavilion-stage.jpg"}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-sanctuary group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-inverse-surface/70 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/90 px-3 py-1 font-label-sm text-label-sm font-semibold tracking-wider text-secondary uppercase shadow-sm backdrop-blur-md">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-secondary" />
              </span>
              {t("roomLive")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-lowest/85 px-3 py-1 font-label-sm text-label-sm font-medium tracking-wider text-on-surface-variant uppercase shadow-sm backdrop-blur-md">
              <MapPinIcon className="size-3 text-primary" />
              {location}
            </span>
          )}

          <div className="flex items-center gap-1.5">
            {liveClass.access === "members_only" ? (
              <span className="rounded-full bg-surface-container-lowest/85 px-2.5 py-0.5 font-label-sm text-label-sm font-medium tracking-wider text-clay uppercase shadow-sm backdrop-blur-md">
                {t("membersOnly")}
              </span>
            ) : (
              <span className="rounded-full bg-surface-container-lowest/85 px-2.5 py-0.5 font-label-sm text-label-sm font-medium tracking-wider text-primary uppercase shadow-sm backdrop-blur-md">
                {t("openAccess")}
              </span>
            )}
            <span className="rounded-full bg-inverse-surface/60 px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-surface backdrop-blur-md">
              {t("durationMins", { minutes: liveClass.durationMinutes })}
            </span>
          </div>
        </div>

        {/* Bottom Details Over Video */}
        <div className="absolute bottom-3 inset-x-3 flex items-end justify-between">
          <div className="flex flex-col text-surface drop-shadow-sm">
            <span className="font-label-sm text-label-sm tracking-wider text-secondary-fixed uppercase">
              {teacher}
            </span>
            <span className="font-headline-sm text-headline-sm text-surface font-light leading-snug line-clamp-1">
              {formattedDate} · {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex flex-1 flex-col justify-between p-space-md">
        <div className="space-y-space-xs">
          <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight transition-colors group-hover:text-primary">
            <Link href={`/classes/${liveClass.slug}`}>{title}</Link>
          </h3>

          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Soundscape details pill if available */}
          {liveClass.soundscapeDetails && (
            <div className="flex items-center gap-1.5 pt-1 text-xs text-on-surface-variant">
              <SparklesIcon className="size-3.5 text-secondary shrink-0" />
              <span className="font-label-sm tracking-wide text-secondary truncate">
                {liveClass.soundscapeDetails}
              </span>
            </div>
          )}
        </div>

        {/* Meta & Actions Row */}
        <div className="mt-space-md border-t border-outline-variant/30 pt-space-sm space-y-space-sm">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <UserCheckIcon className="size-3.5 text-primary" />
              <span>
                {spotsLeft !== null
                  ? t("spotsLeft", { count: spotsLeft })
                  : t("unlimited")}
              </span>
            </div>
            {liveClass.rsvpCount !== undefined && liveClass.rsvpCount > 0 && (
              <span className="font-label-sm text-label-sm text-clay">
                {t("attendeesCount", { count: liveClass.rsvpCount })}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isLive ? (
              <Button asChild className="flex-1 shadow-sm">
                <Link href={`/classes/${liveClass.slug}/live`}>
                  <TvIcon className="size-4 me-2" />
                  <span>{t("enterRoom")}</span>
                </Link>
              </Button>
            ) : isPast ? (
              liveClass.replayPracticeSlug ? (
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/practices/${liveClass.replayPracticeSlug}`}>
                    <VideoIcon className="size-4 me-2 text-primary" />
                    <span>{t("watchReplay")}</span>
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled className="flex-1">
                  {t("emptyPast")}
                </Button>
              )
            ) : (
              <>
                <RsvpButton
                  classId={liveClass.id}
                  classSlug={liveClass.slug}
                  initialRsvpd={liveClass.userHasRsvp}
                  initialCount={liveClass.rsvpCount ?? 0}
                  capacity={liveClass.capacity}
                  access={liveClass.access}
                  userRole={userRole}
                  isLive={isLive}
                  className="flex-1"
                />

                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  title={t("addToCalendar")}
                  aria-label={t("addToCalendar")}
                >
                  <a
                    href={`/api/classes/${liveClass.slug}/calendar?locale=${locale}`}
                    download={`${liveClass.slug}.ics`}
                  >
                    <DownloadIcon className="size-4" />
                  </a>
                </Button>

                <Button asChild variant="ghost" size="sm">
                  <Link href={`/classes/${liveClass.slug}/live`}>
                    <TvIcon className="size-4 me-1.5 text-primary" />
                    <span className="text-xs">{t("enterRoom")}</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
