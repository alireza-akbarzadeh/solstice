"use client";

import { useTranslations } from "next-intl";
import { ExternalLinkIcon, InfoIcon, ThumbsUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSanctuaryStore } from "./sanctuary-store";

export function InquiriesStream({ joinUrl }: { joinUrl?: string }) {
  const t = useTranslations("LiveClasses");
  const questions = useSanctuaryStore((state) => state.questions);
  const upvoteInquiry = useSanctuaryStore((state) => state.upvoteInquiry);

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden p-4 pt-1">
      {/* Scrollable Questions */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pe-1 scroll-smooth">
        <div className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface-variant flex items-center gap-2">
          <InfoIcon className="size-4 text-secondary shrink-0" />
          <span>{t("qnaNotice")}</span>
        </div>

        {questions.map((q) => (
          <div
            key={q.id}
            className="bg-surface-container-low p-3.5 rounded-xl space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                {q.author}
              </span>
              <button
                onClick={() => upvoteInquiry(q.id)}
                className="flex items-center gap-1 bg-surface px-2.5 py-0.5 rounded-full text-secondary font-label-sm text-label-sm font-semibold hover:bg-surface-container transition-colors shadow-xs"
                aria-label={`Vote for inquiry from ${q.author}`}
              >
                <ThumbsUpIcon className="size-3" />
                <span>{q.votes}</span>
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {q.body}
            </p>
          </div>
        ))}
      </div>

      {/* Join Meeting Action */}
      {joinUrl && (
        <div className="pt-3 border-t border-outline-variant/30">
          <Button asChild className="w-full">
            <a href={joinUrl} target="_blank" rel="noopener noreferrer">
              <span>{t("joinMeeting")}</span>
              <ExternalLinkIcon className="size-4 ms-2" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
