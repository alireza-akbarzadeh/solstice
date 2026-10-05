"use client";

import {
  BookmarkIcon,
  CheckIcon,
  CircleCheckIcon,
  CopyIcon,
  DownloadIcon,
  HeadphonesIcon,
  HeartIcon,
  LoaderCircleIcon,
  MoreHorizontalIcon,
  ReplyIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { usePracticeStage } from "@/modules/practices/components/practice-stage";
import { completePractice, savePractice } from "@/modules/progress/actions";

interface PracticeHeaderActionsProps {
  practiceSlug: string;
  practiceTitle: string;
  completed: boolean;
  saved: boolean;
  signInHref?: string;
  programContext?: { slug: string; day: number };
  accessMode?: "full" | "preview" | "locked";
}

export function PracticeHeaderActions({
  practiceSlug,
  practiceTitle,
  completed,
  saved,
  signInHref,
  programContext,
  accessMode = "full",
}: PracticeHeaderActionsProps) {
  const t = useTranslations("PracticeActions");
  const { videoRef, hasVideo, limitSeconds } = usePracticeStage();

  // 1. Complete Button State
  const [isCompleted, setIsCompleted] = useState(completed);
  const [pendingComplete, startCompleteTransition] = useTransition();

  useEffect(() => {
    setIsCompleted(completed);
  }, [completed]);

  const toggleComplete = (next = !isCompleted, doneToast?: string) => {
    setIsCompleted(next);
    startCompleteTransition(async () => {
      const res = await completePractice({ practiceSlug, on: next, program: programContext });
      if (!res.ok) {
        setIsCompleted(!next);
        toast.error(t(res.error === "members" ? "errors.members" : "errors.generic"));
      } else if (doneToast) {
        toast.success(doneToast);
      }
    });
  };

  const onRef = useRef(isCompleted);
  onRef.current = isCompleted;
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo || signInHref || limitSeconds !== undefined) return;
    const onEnded = () => {
      if (!onRef.current) toggleComplete(true, t("autoCompleted"));
    };
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, hasVideo, signInHref, limitSeconds]);

  // 2. Held in Heart (Like) State
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(1400);

  const toggleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => (next ? c + 1 : c - 1));
      return next;
    });
  };

  const formattedLikeCount = likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount.toString();

  // 3. Save to Sanctuary State
  const [isSaved, setIsSaved] = useState(saved);
  const [pendingSave, startSaveTransition] = useTransition();

  useEffect(() => {
    setIsSaved(saved);
  }, [saved]);

  const toggleSave = () => {
    const next = !isSaved;
    setIsSaved(next);
    startSaveTransition(async () => {
      const res = await savePractice({ practiceSlug, on: next });
      if (!res.ok) {
        setIsSaved(!next);
        toast.error(t(res.error === "members" ? "errors.members" : "errors.generic"));
      } else if (next) {
        toast.success(t("savedToast"));
      }
    });
  };

  // 4. Share action
  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: practiceTitle,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("savedToast") ? "Link copied to clipboard" : "Copied");
    }
  };

  // 5. Download offline action
  const handleDownload = () => {
    toast.success(t("downloadToast"));
  };

  // 6. Audio only mode
  const [audioOnly, setAudioOnly] = useState(false);
  const toggleAudioOnly = () => {
    setAudioOnly((prev) => !prev);
    toast.info(t("audioOnlyToast"));
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ded7ce]/60 pt-1 pb-3">
      {/* Primary Action: Mark Complete */}
      <div className="flex items-center gap-3">
        {accessMode === "full" && (
          signInHref ? (
            <Link
              href={signInHref}
              title={t("signInToComplete")}
              className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 font-label-md text-xs font-semibold tracking-wider text-on-primary uppercase shadow-sm transition-all hover:bg-primary-container active:scale-95"
            >
              <CircleCheckIcon className="size-4.5" />
              <span>{t("complete")}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => toggleComplete()}
              disabled={pendingComplete}
              className={cn(
                "flex h-10 items-center gap-2 rounded-full px-5 font-label-md text-xs font-semibold tracking-wider uppercase shadow-sm transition-all active:scale-95",
                isCompleted
                  ? "bg-surface-container-high text-primary hover:bg-surface-container"
                  : "bg-primary text-on-primary hover:bg-primary-container",
              )}
            >
              {pendingComplete ? (
                <LoaderCircleIcon className="size-4.5 animate-spin" />
              ) : isCompleted ? (
                <CheckIcon className="size-4.5" />
              ) : (
                <CircleCheckIcon className="size-4.5" />
              )}
              <span>{isCompleted ? t("completed") : t("complete")}</span>
            </button>
          )
        )}
      </div>

      {/* Secondary Action Icon Pills with Hover Tooltips */}
      <div className="flex items-center gap-2">
        {/* Held in Heart (Like) */}
        <div className="group relative">
          <button
            type="button"
            onClick={toggleLike}
            aria-label={t("heldInHeartLabel")}
            className="flex h-10 items-center gap-1.5 rounded-full border border-[#ded7ce] bg-surface-container-lowest px-3.5 font-label-md text-xs font-semibold text-on-surface shadow-2xs transition-colors hover:border-outline-variant hover:bg-surface-container"
          >
            <HeartIcon className={cn("size-[18px] transition-colors", liked ? "fill-tertiary text-tertiary" : "text-tertiary")} />
            <span>{formattedLikeCount}</span>
          </button>
          <div className="pointer-events-none absolute bottom-full start-1/2 z-20 mb-2 hidden -translate-x-1/2 items-center justify-center rounded bg-inverse-surface px-2.5 py-1 font-label-sm text-xs whitespace-nowrap text-inverse-on-surface shadow-md transition-opacity group-hover:flex rtl:translate-x-1/2">
            {t("heldInHeart", { count: formattedLikeCount })}
          </div>
        </div>

        {/* Save to Sanctuary (Bookmark) */}
        <div className="group relative">
          {signInHref ? (
            <Link
              href={signInHref}
              aria-label={t("save")}
              title={t("signInToSave")}
              className="flex size-10 items-center justify-center rounded-full border border-[#ded7ce] bg-surface-container-lowest text-on-surface shadow-2xs transition-colors hover:border-outline-variant hover:bg-surface-container"
            >
              <BookmarkIcon className="size-[18px] text-clay" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={toggleSave}
              disabled={pendingSave}
              aria-label={isSaved ? t("saved") : t("save")}
              className={cn(
                "flex size-10 items-center justify-center rounded-full border border-[#ded7ce] bg-surface-container-lowest text-on-surface shadow-2xs transition-colors hover:border-outline-variant hover:bg-surface-container",
                isSaved && "border-secondary-container bg-secondary-container text-on-secondary-container",
              )}
            >
              <BookmarkIcon className={cn("size-[18px]", isSaved ? "fill-current text-on-secondary-container" : "text-clay")} />
            </button>
          )}
          <div className="pointer-events-none absolute bottom-full start-1/2 z-20 mb-2 hidden -translate-x-1/2 items-center justify-center rounded bg-inverse-surface px-2.5 py-1 font-label-sm text-xs whitespace-nowrap text-inverse-on-surface shadow-md transition-opacity group-hover:flex rtl:translate-x-1/2">
            {isSaved ? t("saved") : t("save")}
          </div>
        </div>

        {/* Share */}
        <div className="group relative">
          <button
            type="button"
            onClick={handleShare}
            aria-label={t("share")}
            className="flex size-10 items-center justify-center rounded-full border border-[#ded7ce] bg-surface-container-lowest text-on-surface shadow-2xs transition-colors hover:border-outline-variant hover:bg-surface-container"
          >
            <ReplyIcon className="size-[18px] text-outline rtl:rotate-180" />
          </button>
          <div className="pointer-events-none absolute bottom-full start-1/2 z-20 mb-2 hidden -translate-x-1/2 items-center justify-center rounded bg-inverse-surface px-2.5 py-1 font-label-sm text-xs whitespace-nowrap text-inverse-on-surface shadow-md transition-opacity group-hover:flex rtl:translate-x-1/2">
            {t("share")}
          </div>
        </div>

        {/* Download Offline */}
        <div className="group relative">
          <button
            type="button"
            onClick={handleDownload}
            aria-label={t("downloadTooltip")}
            className="flex size-10 items-center justify-center rounded-full border border-[#ded7ce] bg-surface-container-lowest text-on-surface shadow-2xs transition-colors hover:border-outline-variant hover:bg-surface-container"
          >
            <DownloadIcon className="size-[18px] text-outline" />
          </button>
          <div className="pointer-events-none absolute bottom-full start-1/2 z-20 mb-2 hidden -translate-x-1/2 items-center justify-center rounded bg-inverse-surface px-2.5 py-1 font-label-sm text-xs whitespace-nowrap text-inverse-on-surface shadow-md transition-opacity group-hover:flex rtl:translate-x-1/2">
            {t("download")}
          </div>
        </div>

        {/* Audio Only Mode */}
        <div className="group relative">
          <button
            type="button"
            onClick={toggleAudioOnly}
            aria-label={t("audioOnlyTooltip")}
            className={cn(
              "flex size-10 items-center justify-center rounded-full border border-[#ded7ce] bg-surface-container-lowest text-on-surface shadow-2xs transition-colors hover:border-outline-variant hover:bg-surface-container",
              audioOnly && "border-secondary-container bg-secondary-container text-on-secondary-container",
            )}
          >
            <HeadphonesIcon className={cn("size-[18px]", audioOnly ? "text-on-secondary-container" : "text-clay")} />
          </button>
          <div className="pointer-events-none absolute bottom-full start-1/2 z-20 mb-2 hidden -translate-x-1/2 items-center justify-center rounded bg-inverse-surface px-2.5 py-1 font-label-sm text-xs whitespace-nowrap text-inverse-on-surface shadow-md transition-opacity group-hover:flex rtl:translate-x-1/2">
            {t("audioOnly")}
          </div>
        </div>

        {/* More Options */}
        <DropdownMenu>
          <div className="group relative">
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("moreOptions")}
                className="flex size-10 items-center justify-center rounded-full border border-[#ded7ce] bg-surface-container-lowest text-on-surface shadow-2xs outline-none transition-colors hover:border-outline-variant hover:bg-surface-container"
              >
                <MoreHorizontalIcon className="size-[18px] text-outline" />
              </button>
            </DropdownMenuTrigger>
            <div className="pointer-events-none absolute bottom-full start-1/2 z-20 mb-2 hidden -translate-x-1/2 items-center justify-center rounded bg-inverse-surface px-2.5 py-1 font-label-sm text-xs whitespace-nowrap text-inverse-on-surface shadow-md transition-opacity group-hover:flex rtl:translate-x-1/2">
              {t("moreOptions")}
            </div>
          </div>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={handleShare}>
              <CopyIcon className="me-2 size-4" />
              <span>{t("share")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload}>
              <DownloadIcon className="me-2 size-4" />
              <span>{t("download")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleAudioOnly}>
              <HeadphonesIcon className="me-2 size-4" />
              <span>{t("audioOnly")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
