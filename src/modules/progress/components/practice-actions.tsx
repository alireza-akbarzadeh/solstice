"use client";

import { BookmarkIcon, CheckIcon, CircleCheckIcon, LoaderCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { usePracticeStage } from "@/modules/practices/components/practice-stage";

import { completePractice, savePractice } from "../actions";

function useToggle(initial: boolean, send: (on: boolean) => Promise<{ ok: boolean; error?: string }>) {
  const t = useTranslations("PracticeActions");
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();
  useEffect(() => setOn(initial), [initial]);

  const toggle = (next = !on, done?: string) => {
    setOn(next);
    startTransition(async () => {
      const result = await send(next);
      if (!result.ok) {
        setOn(!next);
        toast.error(t(result.error === "members" ? "errors.members" : "errors.generic"));
      } else if (done) toast.success(done);
    });
  };
  return { on, pending, toggle };
}

/** "Save to Sanctuary": a labelled button on the practice page, an icon on library cards. */
export function SaveButton({
  practiceSlug,
  saved,
  signInHref,
  variant = "button",
}: {
  practiceSlug: string;
  saved: boolean;
  /** Set when signed out: saving needs an account. */
  signInHref?: string;
  variant?: "button" | "icon";
}) {
  const t = useTranslations("PracticeActions");
  const { on, pending, toggle } = useToggle(saved, (next) => savePractice({ practiceSlug, on: next }));
  const label = on ? t("saved") : t("save");

  const className =
    variant === "icon"
      ? cn(
          "relative z-10 flex size-8 items-center justify-center rounded-full bg-surface/90 shadow-sm transition-colors hover:bg-surface",
          on ? "text-primary" : "text-on-surface-variant hover:text-primary",
        )
      : cn(
          "flex h-11 items-center gap-2 rounded-lg px-4 font-label-lg text-label-lg shadow-sm transition-colors",
          on ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-primary hover:bg-surface-container-high",
        );
  const content = (
    <>
      <BookmarkIcon className={cn(variant === "icon" ? "size-4" : "size-5", on && "fill-current")} />
      {variant === "button" && <span>{label}</span>}
    </>
  );

  if (signInHref) {
    return (
      <Link href={signInHref} aria-label={variant === "icon" ? t("save") : undefined} title={t("signInToSave")} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggle(!on, !on ? t("savedToast") : undefined);
      }}
      disabled={pending}
      aria-pressed={on}
      aria-label={variant === "icon" ? label : undefined}
      className={className}
    >
      {content}
    </button>
  );
}

/** "Mark complete" — also marks itself when the video plays to the end. */
export function CompleteButton({
  practiceSlug,
  completed,
  signInHref,
}: {
  practiceSlug: string;
  completed: boolean;
  signInHref?: string;
}) {
  const t = useTranslations("PracticeActions");
  const { videoRef, hasVideo, limitSeconds } = usePracticeStage();
  const { on, pending, toggle } = useToggle(completed, (next) => completePractice({ practiceSlug, on: next }));

  const onRef = useRef(on);
  onRef.current = on;
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo || signInHref || limitSeconds !== undefined) return;
    const onEnded = () => {
      if (!onRef.current) toggle(true, t("autoCompleted"));
    };
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toggle is recreated each render; the ref keeps it current
  }, [videoRef, hasVideo, signInHref, limitSeconds]);

  const className = cn(
    "flex h-11 items-center gap-2 rounded-lg px-4 font-label-lg text-label-lg shadow-sm transition-colors",
    on ? "bg-surface-container-high text-primary" : "bg-primary text-on-primary hover:bg-primary-container",
  );
  const content = (
    <>
      {pending ? (
        <LoaderCircleIcon className="size-5 animate-spin" />
      ) : on ? (
        <CheckIcon className="size-5" />
      ) : (
        <CircleCheckIcon className="size-5" />
      )}
      <span>{on ? t("completed") : t("complete")}</span>
    </>
  );

  if (signInHref) {
    return (
      <Link href={signInHref} title={t("signInToComplete")} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => toggle()} disabled={pending} aria-pressed={on} className={className}>
      {content}
    </button>
  );
}
