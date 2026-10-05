"use client";

import { ClapperboardIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { MessageView } from "../types";

export const INSTRUCTOR_IMAGE = "/images/brand/elena-closeup.jpg";

/** "14:22" for a practice moment, in the reader's digits. */
export function useMomentClock() {
  const format = useFormatter();
  return (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const two = (n: number) => format.number(n, { minimumIntegerDigits: 2, useGrouping: false });
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h ? `${format.number(h)}:${two(m)}:${two(s % 60)}` : `${two(m)}:${two(s % 60)}`;
  };
}

/**
 * One message. Who wrote it is always visible: the member's own words on sage, the instructor
 * on a linen card with their portrait, and AI replies outlined with a spark and an "AI
 * assistant" label — never dressed as the instructor. `side` is whose screen this is.
 */
export function MessageBubble({
  message,
  side,
  instructorName,
  memberName,
  compact = false,
}: {
  message: MessageView;
  side: "member" | "staff";
  instructorName: string;
  memberName?: string;
  compact?: boolean;
}) {
  const t = useTranslations("Conversations.authors");
  const format = useFormatter();
  const clock = useMomentClock();
  const mine = side === "member" ? message.author === "member" : message.author === "instructor";
  const time = format.dateTime(new Date(message.createdAt), { hour: "numeric", minute: "2-digit" });
  const full = format.dateTime(new Date(message.createdAt), { dateStyle: "medium", timeStyle: "short" });

  const label =
    message.author === "ai"
      ? t("ai")
      : message.author === "instructor"
        ? side === "staff"
          ? t("you")
          : instructorName
        : side === "member"
          ? t("you")
          : memberName?.trim() ? memberName : t("member");

  return (
    <div className={cn("flex w-full gap-3", mine ? "justify-end" : "justify-start")}>
      {!mine && !compact && (
        <span className="mt-6 shrink-0">
          {message.author === "instructor" ? (
            <Image src={INSTRUCTOR_IMAGE} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
          ) : message.author === "ai" ? (
            <span className="flex size-9 items-center justify-center rounded-full bg-primary-fixed text-primary ring-1 ring-primary/30">
              <SparklesIcon className="size-4" />
            </span>
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-surface-container-high font-label-lg text-label-lg text-on-surface-variant">
              {(memberName?.trim() ? memberName : "·").charAt(0).toUpperCase()}
            </span>
          )}
        </span>
      )}
      <div className={cn("flex max-w-[min(36rem,88%)] flex-col gap-1", mine ? "items-end" : "items-start")}>
        <p className={cn("flex flex-wrap items-center gap-x-2 font-label-sm text-label-sm text-outline", mine && "flex-row-reverse")}>
          <span className={cn("font-semibold", message.author === "ai" ? "text-primary" : "text-on-surface-variant")}>{label}</span>
          {message.author === "ai" && (
            <span className="inline-flex items-center gap-1 rounded bg-primary-fixed px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-on-primary-fixed uppercase">
              <SparklesIcon className="size-3" />
              {t("aiBadge")}
            </span>
          )}
          {/* Server and browser may sit in different time zones; the browser's reading wins. */}
          <time dateTime={message.createdAt} title={full} suppressHydrationWarning>
            {time}
          </time>
        </p>
        <div
          dir="auto"
          className={cn(
            "rounded-2xl font-body-md text-body-md whitespace-pre-wrap break-words",
            compact ? "px-3.5 py-2.5 font-body-sm text-body-sm" : "px-5 py-4",
            mine && "rounded-se-sm bg-primary text-on-primary",
            !mine && message.author === "instructor" && "rounded-ss-sm border border-hairline bg-surface-container-lowest text-on-surface shadow-sm",
            !mine && message.author === "member" && "rounded-ss-sm bg-surface-container text-on-surface",
            !mine && message.author === "ai" && "rounded-ss-sm border border-dashed border-primary/40 bg-primary-fixed/25 text-on-surface",
          )}
        >
          {message.body}
          {message.practice && (
            <Link
              href={`/practices/${message.practice.slug}`}
              className={cn(
                "mt-3 flex w-fit items-center gap-2 rounded-md px-2.5 py-1.5 font-label-md text-label-md no-underline transition-colors",
                mine ? "bg-on-primary/15 text-on-primary hover:bg-on-primary/25" : "bg-surface-container text-on-surface-variant hover:text-primary",
              )}
            >
              <ClapperboardIcon className="size-3.5 shrink-0" />
              <span className="truncate">{message.practice.title}</span>
              {message.practice.at !== null && (
                <span dir="ltr" className="tabular-nums">
                  {clock(message.practice.at)}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
