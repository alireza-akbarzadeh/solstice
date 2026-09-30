"use client";

import { AudioLinesIcon, CirclePlayIcon, LockIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { PracticeChapter } from "../types";
import { usePracticeStage } from "./practice-stage";

export function PracticeChapters({ chapters, durationSeconds }: { chapters: PracticeChapter[]; durationSeconds: number }) {
  const t = useTranslations("PracticeDetail");
  const format = useFormatter();
  const { hasVideo, currentTime, seek, limitSeconds, openGate } = usePracticeStage();

  const clock = (seconds: number) => {
    const two = (n: number) => format.number(n, { minimumIntegerDigits: 2, useGrouping: false });
    return `${two(Math.floor(seconds / 60))}:${two(Math.floor(seconds % 60))}`;
  };

  // The chapter containing the playhead; only meaningful once something has played.
  const activeIndex =
    hasVideo && currentTime > 0
      ? chapters.reduce((found, c, i) => (c.startSeconds <= currentTime ? i : found), -1)
      : -1;

  return (
    <section className="space-y-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="mb-1 block font-label-md text-label-md tracking-widest text-clay uppercase">{t("chaptersEyebrow")}</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("chaptersTitle")}</h2>
        </div>
        <span className="font-label-sm text-label-sm text-outline">{t("chaptersCount", { count: chapters.length })}</span>
      </div>

      <ol className="space-y-2">
        {chapters.map((chapter, i) => {
          const end = chapters[i + 1]?.startSeconds ?? durationSeconds;
          const active = i === activeIndex;
          // Starts after the free preview: members only.
          const locked = limitSeconds !== undefined && chapter.startSeconds >= limitSeconds;
          const body = (
            <>
              <div className="flex items-center gap-3 text-start">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full font-label-sm text-label-sm",
                    active ? "bg-primary text-on-primary" : "bg-outline-variant/30 text-outline",
                  )}
                >
                  {active ? <AudioLinesIcon className="size-4" /> : format.number(i + 1)}
                </span>
                <div>
                  <h3
                    className={cn(
                      "font-body-md text-body-md font-semibold transition-colors",
                      active ? "text-white" : "text-on-surface group-hover:text-primary",
                    )}
                  >
                    {chapter.title}
                  </h3>
                  <p className={cn("font-body-sm text-body-sm", active ? "text-on-primary-container" : "text-outline")}>
                    {chapter.description}
                  </p>
                </div>
              </div>
              <div className={cn("flex shrink-0 items-center gap-3 font-label-sm text-label-sm", active ? "text-white" : "text-outline")}>
                <span dir="ltr" className="tabular-nums">
                  {clock(chapter.startSeconds)} – {clock(end)}
                </span>
                {locked ? (
                  <LockIcon aria-label={t("preview.lockedChapter")} className="size-4 text-clay" />
                ) : (
                  hasVideo &&
                  !active && (
                    <CirclePlayIcon className="size-5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                  )
                )}
              </div>
            </>
          );
          const rowClass = cn(
            "group flex w-full items-center justify-between gap-3 rounded-lg p-3.5 transition-colors",
            active ? "bg-primary-container shadow-sm" : "bg-surface-container",
            hasVideo && !active && "hover:bg-surface-container-high",
          );

          return (
            <li key={chapter.startSeconds}>
              {hasVideo ? (
                <button
                  type="button"
                  onClick={() => (locked ? openGate() : seek(chapter.startSeconds, { play: true }))}
                  aria-label={t("playChapter", { time: clock(chapter.startSeconds) })}
                  aria-current={active ? "step" : undefined}
                  className={rowClass}
                >
                  {body}
                </button>
              ) : (
                <div className={rowClass}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
