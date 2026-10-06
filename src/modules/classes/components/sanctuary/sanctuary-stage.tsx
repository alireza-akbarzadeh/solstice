"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SoundscapeRibbon } from "./soundscape-ribbon";

export function SanctuaryStage({
  coverImage,
  title,
  location,
  teacher,
  soundscapeDetails,
  joinUrl,
}: {
  coverImage?: string | null;
  title: string;
  location: string;
  teacher: string;
  soundscapeDetails?: string | null;
  joinUrl?: string;
}) {
  const t = useTranslations("LiveClasses");

  return (
    <div className="relative w-full aspect-[16/10] bg-surface-container-high rounded-2xl overflow-hidden shadow-sm group border border-outline-variant/30">
      <Image
        src={coverImage ?? "/images/classes/kyoto-pavilion-stage.jpg"}
        alt={title}
        fill
        priority
        className="object-cover transition-transform duration-700 group-hover:scale-[1.01]"
      />

      {/* Atmospheric Gradient Scrims */}
      <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/85 via-transparent to-inverse-surface/35 pointer-events-none" />

      {/* Video Overlay: Top Bar */}
      <div className="absolute top-4 inset-x-4 md:inset-x-5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 bg-surface/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm text-on-surface">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold">
            {location}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {joinUrl && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="bg-surface/90 backdrop-blur-md hover:bg-surface text-on-surface border-outline-variant/40"
            >
              <a href={joinUrl} target="_blank" rel="noopener noreferrer">
                <span>{t("joinMeeting")}</span>
                <ExternalLinkIcon className="size-3.5 ms-1.5" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Middle Floating Instructor Identity */}
      <div className="absolute bottom-20 start-4 md:start-6 space-y-1 text-surface drop-shadow-md pointer-events-none">
        <span className="font-label-sm text-label-sm tracking-wider uppercase text-secondary-fixed">
          {t("instructorLead")}
        </span>
        <h2 className="font-headline-md text-headline-md text-surface font-light">
          {teacher}
        </h2>
        <p className="font-body-sm text-body-sm text-surface/85 max-w-md">
          {soundscapeDetails ?? t("guidingFocus")}
        </p>
      </div>

      {/* Interactive Soundscape Ribbon */}
      <SoundscapeRibbon soundscapeDetails={soundscapeDetails} />
    </div>
  );
}
