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
    <div className="flex flex-col w-full min-h-[calc(100vh-80px)] bg-surface text-on-surface">
      {/* Top Presence & Sacred Attendance Banner */}
      <SanctuaryBanner title={title} />

      {/* Main Sanctuary Grid */}
      <section className="w-full px-margin-mobile md:px-margin py-space-md flex-1">
        <div className="max-w-content mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Main Broadcast Stage, Breathing Ribbon, & Silent Peer Circle (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-space-md">
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
          <div className="lg:col-span-4 flex flex-col gap-4">
            <SanghaHub joinUrl={liveClass.joinUrl} />
          </div>
        </div>
      </section>
    </div>
  );
}
