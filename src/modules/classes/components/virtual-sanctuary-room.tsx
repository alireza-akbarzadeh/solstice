"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

import { localize } from "@/lib/localized";
import type { LiveClass } from "../types";
import { usePranayamaCycle } from "./sanctuary/use-pranayama-cycle";
import { useSanctuaryStore } from "./sanctuary/sanctuary-store";
import { SanctuaryBanner } from "./sanctuary/sanctuary-banner";
import { SanctuaryStage } from "./sanctuary/sanctuary-stage";
import { PranayamaCircle } from "./sanctuary/pranayama-circle";
import { SanghaPeerGrid } from "./sanctuary/sangha-peer-grid";
import { SanghaHub } from "./sanctuary/sangha-hub";

export function VirtualSanctuaryRoom({
  liveClass,
  isInstructor: _isInstructor = false,
}: {
  liveClass: LiveClass;
  isInstructor?: boolean;
}) {
  const locale = useLocale();
  const initLocale = useSanctuaryStore((state) => state.initLocale);

  // Run autonomous 4:4 breathing cycle
  usePranayamaCycle();

  useEffect(() => {
    initLocale(locale);
  }, [locale, initLocale]);

  const title = localize(liveClass.title, locale);
  const location = localize(liveClass.locationName, locale);
  const teacher = localize(liveClass.instructorName, locale);

  return (
    <div className="bg-surface text-on-surface flex min-h-[calc(100vh-80px)] w-full flex-col">
      {/* Top Presence & Sacred Attendance Banner */}
      <SanctuaryBanner title={title} />

      {/* Main Sanctuary Grid */}
      <section className="px-margin-mobile md:px-margin py-space-md w-full flex-1">
        <div className="max-w-content gap-gutter mx-auto grid grid-cols-1 items-start lg:grid-cols-12">
          {/* Main Broadcast Stage, Breathing Ribbon, & Silent Peer Circle (8 cols) */}
          <div className="gap-space-md flex flex-col lg:col-span-8">
            <SanctuaryStage
              coverImage={liveClass.coverImage}
              title={title}
              location={location}
              teacher={teacher}
              soundscapeDetails={liveClass.soundscapeDetails}
              joinUrl={liveClass.joinUrl}
            />

            <PranayamaCircle />

            <SanghaPeerGrid />
          </div>

          {/* Interactive Intentions & Somatic Inquiries Hub (4 cols) */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <SanghaHub joinUrl={liveClass.joinUrl} />
          </div>
        </div>
      </section>
    </div>
  );
}
