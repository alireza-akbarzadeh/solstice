"use client";

import {
  BookmarkIcon,
  CheckIcon,
  CircleCheckIcon,
  DownloadIcon,
  HeadphonesIcon,
  HeartIcon,
  KeyboardIcon,
  LinkIcon,
  LoaderCircleIcon,
  MoreHorizontalIcon,
  Share2Icon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { usePracticeStage } from "@/modules/practices/components/practice-stage";
import { completePractice, likePractice, savePractice } from "@/modules/progress/actions";

type Props = {
  practiceSlug: string;
  practiceTitle: string;
  completed: boolean;
  saved: boolean;
  /** Set for guests: the actions send them to sign in instead. */
  signInHref?: string;
  programContext?: { slug: string; day: number };
  accessMode: "full" | "preview" | "locked";
  /** How many hold this practice in heart, and whether the viewer does. */
  likes: { count: number; liked: boolean };
  /** The whole video as a file; only for those who may watch all of it, and only for file videos. */
  downloadHref?: string;
};

const iconButton =
  "flex size-10 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface shadow-2xs transition-colors hover:border-outline-variant hover:bg-surface-container focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";

/** An icon button with its name in a tooltip (and as its accessible label). */
function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The row under the practice title: mark complete (also done automatically when the video
 * ends), hold in heart (a public like), save to the member's practices, share, download,
 * listen without the picture, and a menu with the rest.
 */
export function PracticeHeaderActions({
  practiceSlug,
  practiceTitle,
  completed,
  saved,
  signInHref,
  programContext,
  accessMode,
  likes,
  downloadHref,
}: Props) {
  const t = useTranslations("PracticeActions");
  const format = useFormatter();
  const { videoRef, hasVideo, limitSeconds, audioOnly, setAudioOnly, setShortcutsOpen } = usePracticeStage();

  const [isCompleted, setIsCompleted] = useState(completed);
  const [pendingComplete, startComplete] = useTransition();
  useEffect(() => setIsCompleted(completed), [completed]);

  const toggleComplete = (next = !isCompleted, doneToast?: string) => {
    setIsCompleted(next);
    startComplete(async () => {
      const res = await completePractice({ practiceSlug, on: next, program: programContext });
      if (!res.ok) {
        setIsCompleted(!next);
        toast.error(t(res.error === "members" ? "errors.members" : "errors.generic"));
      } else if (doneToast) {
        toast.success(doneToast);
      }
    });
  };

  // Finishing the video marks the practice complete, unless this is a time-limited preview.
  const completedRef = useRef(isCompleted);
  completedRef.current = isCompleted;
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo || signInHref || limitSeconds !== undefined) return;
    const onEnded = () => {
      if (!completedRef.current) toggleComplete(true, t("autoCompleted"));
    };
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, hasVideo, signInHref, limitSeconds]);

  const [liked, setLiked] = useState(likes.liked);
  const [likeCount, setLikeCount] = useState(likes.count);
  const [pendingLike, startLike] = useTransition();
  useEffect(() => {
    setLiked(likes.liked);
    setLikeCount(likes.count);
  }, [likes.liked, likes.count]);

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((n) => Math.max(0, n + (next ? 1 : -1)));
    startLike(async () => {
      const res = await likePractice({ practiceSlug, on: next });
      if (!res.ok) {
        setLiked(!next);
        setLikeCount((n) => Math.max(0, n + (next ? -1 : 1)));
        toast.error(t("errors.generic"));
      }
    });
  };

  const [isSaved, setIsSaved] = useState(saved);
  const [pendingSave, startSave] = useTransition();
  useEffect(() => setIsSaved(saved), [saved]);

  const toggleSave = () => {
    const next = !isSaved;
    setIsSaved(next);
    startSave(async () => {
      const res = await savePractice({ practiceSlug, on: next });
      if (!res.ok) {
        setIsSaved(!next);
        toast.error(t(res.error === "members" ? "errors.members" : "errors.generic"));
      } else if (next) {
        toast.success(t("savedToast"));
      }
    });
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success(t("copied"));
  };

  // Native share sheet where there is one (phones), otherwise copy the link.
  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: practiceTitle, url: window.location.href });
      } catch {
        // Dismissed.
      }
      return;
    }
    await copyLink();
  };

  const toggleAudioOnly = () => {
    setAudioOnly(!audioOnly);
    toast.info(audioOnly ? t("audioOnlyOff") : t("audioOnlyOn"));
  };

  const completeClass = "flex h-10 items-center gap-2 rounded-full px-5 font-label-md text-label-md font-semibold tracking-wider uppercase shadow-sm transition-all active:scale-95";
  const countLabel = format.number(likeCount, { notation: "compact", maximumFractionDigits: 1 });
  const heart = (
    <>
      <HeartIcon className={cn("size-4.5 text-tertiary transition-transform", liked && "scale-110 fill-current")} />
      <span className="font-label-md text-label-md font-semibold tabular-nums">{countLabel}</span>
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 pt-1 pb-3">
        <div className="flex items-center gap-3">
          {accessMode === "full" &&
            (signInHref ? (
              <Link href={signInHref} title={t("signInToComplete")} className={cn(completeClass, "bg-primary text-on-primary hover:bg-primary-container")}>
                <CircleCheckIcon className="size-4.5" />
                {t("complete")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => toggleComplete()}
                disabled={pendingComplete}
                aria-pressed={isCompleted}
                className={cn(
                  completeClass,
                  isCompleted ? "bg-surface-container-high text-primary hover:bg-surface-container" : "bg-primary text-on-primary hover:bg-primary-container",
                )}
              >
                {pendingComplete ? (
                  <LoaderCircleIcon className="size-4.5 animate-spin" />
                ) : isCompleted ? (
                  <CheckIcon className="size-4.5" />
                ) : (
                  <CircleCheckIcon className="size-4.5" />
                )}
                {isCompleted ? t("completed") : t("complete")}
              </button>
            ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tip label={signInHref ? t("signInToLike") : t("likeCount", { count: likeCount })}>
            {signInHref ? (
              <Link href={signInHref} aria-label={t("signInToLike")} className={cn(iconButton, "w-auto gap-1.5 px-3.5")}>
                {heart}
              </Link>
            ) : (
              <button
                type="button"
                onClick={toggleLike}
                disabled={pendingLike}
                aria-label={liked ? t("liked") : t("like")}
                aria-pressed={liked}
                className={cn(iconButton, "w-auto gap-1.5 px-3.5")}
              >
                {heart}
              </button>
            )}
          </Tip>

          {signInHref ? (
            <Tip label={t("signInToSave")}>
              <Link href={signInHref} aria-label={t("signInToSave")} className={iconButton}>
                <BookmarkIcon className="size-4.5 text-clay" />
              </Link>
            </Tip>
          ) : (
            <Tip label={isSaved ? t("saved") : t("save")}>
              <button
                type="button"
                onClick={toggleSave}
                disabled={pendingSave}
                aria-label={isSaved ? t("saved") : t("save")}
                aria-pressed={isSaved}
                className={cn(iconButton, isSaved && "border-secondary-container bg-secondary-container text-on-secondary-container")}
              >
                <BookmarkIcon className={cn("size-4.5", isSaved ? "fill-current" : "text-clay")} />
              </button>
            </Tip>
          )}

          <Tip label={t("share")}>
            <button type="button" onClick={share} aria-label={t("share")} className={iconButton}>
              <Share2Icon className="size-4.5 text-outline" />
            </button>
          </Tip>

          {downloadHref && (
            <Tip label={t("download")}>
              <a href={downloadHref} download aria-label={t("download")} className={iconButton}>
                <DownloadIcon className="size-4.5 text-outline" />
              </a>
            </Tip>
          )}

          {hasVideo && (
            <Tip label={audioOnly ? t("audioOnlyOff") : t("audioOnly")}>
              <button
                type="button"
                onClick={toggleAudioOnly}
                aria-label={t("audioOnly")}
                aria-pressed={audioOnly}
                className={cn(iconButton, audioOnly && "border-secondary-container bg-secondary-container text-on-secondary-container")}
              >
                <HeadphonesIcon className={cn("size-4.5", !audioOnly && "text-clay")} />
              </button>
            </Tip>
          )}

          <DropdownMenu>
            <Tip label={t("more")}>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label={t("more")} className={iconButton}>
                  <MoreHorizontalIcon className="size-4.5 text-outline" />
                </button>
              </DropdownMenuTrigger>
            </Tip>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => void copyLink()}>
                <LinkIcon />
                {t("copyLink")}
              </DropdownMenuItem>
              {downloadHref && (
                <DropdownMenuItem asChild>
                  <a href={downloadHref} download>
                    <DownloadIcon />
                    {t("download")}
                  </a>
                </DropdownMenuItem>
              )}
              {hasVideo && (
                <DropdownMenuItem onSelect={() => setShortcutsOpen(true)}>
                  <KeyboardIcon />
                  {t("shortcuts")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
