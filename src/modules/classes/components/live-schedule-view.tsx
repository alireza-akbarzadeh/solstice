"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarIcon,
  GlobeIcon,
  HistoryIcon,
  SparklesIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { LiveClass } from "../types";
import { LiveClassCard } from "./live-class-card";

export function LiveScheduleView({
  upcomingClasses,
  pastClasses,
  userRole,
}: {
  upcomingClasses: LiveClass[];
  pastClasses: LiveClass[];
  userRole?: string | null;
}) {
  const t = useTranslations("LiveClasses");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [userTimeZone, setUserTimeZone] = useState<string>("");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimeZone(tz);
    } catch {}
  }, []);

  return (
    <div className="flex flex-col space-y-space-lg w-full">
      {/* Timezone pill notice */}
      {userTimeZone && (
        <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <GlobeIcon className="size-3.5 text-primary shrink-0" />
            <span>
              All session times are automatically displayed in your local timezone:{" "}
              <strong className="text-on-surface font-medium">{userTimeZone}</strong>
            </span>
          </div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-clay">
            Kyoto Studio Host
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
        <button
          onClick={() => setTab("upcoming")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-label-md transition-all",
            tab === "upcoming"
              ? "bg-surface-container text-primary font-semibold shadow-xs"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          <CalendarIcon className="size-4" />
          <span>{t("upcomingTab")}</span>
          <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-xs text-on-surface font-semibold">
            {upcomingClasses.length}
          </span>
        </button>

        <button
          onClick={() => setTab("past")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-label-md transition-all",
            tab === "past"
              ? "bg-surface-container text-primary font-semibold shadow-xs"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          <HistoryIcon className="size-4" />
          <span>{t("pastTab")}</span>
          <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-xs text-on-surface font-semibold">
            {pastClasses.length}
          </span>
        </button>
      </div>

      {/* Content Grid */}
      {tab === "upcoming" ? (
        upcomingClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter items-stretch">
            {upcomingClasses.map((item) => (
              <LiveClassCard
                key={item.id}
                liveClass={item}
                userRole={userRole}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant/60 p-space-xl text-center">
            <SparklesIcon className="size-8 text-outline mx-auto mb-2" />
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
              {t("emptyUpcoming")}
            </p>
          </div>
        )
      ) : pastClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter items-stretch">
          {pastClasses.map((item) => (
            <LiveClassCard
              key={item.id}
              liveClass={item}
              userRole={userRole}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-outline-variant/60 p-space-xl text-center">
          <HistoryIcon className="size-8 text-outline mx-auto mb-2" />
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
            {t("emptyPast")}
          </p>
        </div>
      )}
    </div>
  );
}
