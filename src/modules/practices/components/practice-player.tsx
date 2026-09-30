"use client";

import {
  FlipHorizontal2Icon,
  LockIcon,
  MaximizeIcon,
  MinimizeIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  RotateCwIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { usePracticeStage } from "./practice-stage";

const SPEEDS = [0.75, 1, 1.25] as const;

type Props = {
  videoUrl?: string;
  poster: string;
  posterAlt: string;
  categoryLabel: string;
  durationSeconds: number;
  /** Where the "preview ended" invitation sends people (locale-less paths). */
  gate?: { signedIn: boolean; primaryHref: string; signInHref?: string; trialDays: number };
};

export function PracticePlayer({ videoUrl, poster, posterAlt, categoryLabel, durationSeconds, gate }: Props) {
  const t = useTranslations("PracticeDetail.player");
  const tPreview = useTranslations("PracticeDetail.preview");
  const format = useFormatter();
  const { videoRef, currentTime, setCurrentTime, seek, limitSeconds, gateOpen, openGate, closeGate } = usePracticeStage();
  const isPreview = limitSeconds !== undefined;
  const frameRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(durationSeconds);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [mirrored, setMirrored] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const clock = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const two = (n: number) => format.number(n, { minimumIntegerDigits: 2, useGrouping: false });
    return `${two(Math.floor(s / 60))}:${two(s % 60)}`;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frameRef.current?.requestFullscreen();
  };

  const tag = (
    <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 font-label-sm text-label-sm tracking-widest text-white uppercase backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-secondary-fixed" />
          {categoryLabel}
        </span>
        <span dir="ltr" className="rounded-full bg-black/40 px-3 py-1.5 font-label-sm text-label-sm text-white/90 tabular-nums backdrop-blur-md">
          {clock(duration)}
        </span>
        {isPreview && (
          <span className="flex items-center gap-1.5 rounded-full bg-secondary-fixed px-3 py-1.5 font-label-sm text-label-sm font-semibold text-on-secondary-fixed">
            <LockIcon className="size-3" />
            {tPreview("badge", { minutes: Math.round(limitSeconds / 60) })}
          </span>
        )}
      </div>
      {videoUrl && (
        <button
          type="button"
          onClick={() => setMirrored((m) => !m)}
          aria-pressed={mirrored}
          aria-label={t("mirror")}
          title={t("mirror")}
          className={cn(
            "flex size-9 items-center justify-center rounded-full backdrop-blur-md transition-colors",
            mirrored ? "bg-primary text-on-primary" : "bg-black/40 text-white hover:bg-black/60",
          )}
        >
          <FlipHorizontal2Icon className="size-4" />
        </button>
      )}
    </div>
  );

  if (!videoUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-inverse-surface shadow-2xl">
        <Image src={poster} alt={posterAlt} fill priority sizes="(min-width: 1024px) 860px, 100vw" className="object-cover" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
        {tag}
        <div className="absolute inset-x-4 bottom-4 flex justify-center">
          <p className="rounded-full bg-black/50 px-4 py-2 text-center font-body-sm text-body-sm text-white backdrop-blur-md">
            {t("unavailable")}
          </p>
        </div>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const lockedFrom = isPreview && duration > 0 ? Math.min(100, (limitSeconds / duration) * 100) : 100;

  return (
    <div
      ref={frameRef}
      role="region"
      aria-label={t("region")}
      className="group relative aspect-video w-full overflow-hidden rounded-xl bg-inverse-surface shadow-2xl select-none"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onPlay={(e) => {
          if (isPreview && e.currentTarget.currentTime >= limitSeconds) return openGate();
          setPlaying(true);
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const time = e.currentTarget.currentTime;
          setCurrentTime(time);
          if (isPreview && time >= limitSeconds) openGate();
        }}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
        className={cn("size-full object-cover transition-transform duration-300", mirrored && "-scale-x-100")}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
      {tag}

      {!playing && !gateOpen && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label={t("play")}
          className="absolute inset-0 z-20 m-auto flex size-20 items-center justify-center rounded-full bg-primary/80 text-on-primary shadow-xl backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
        >
          <PlayIcon className="ms-1 size-9 fill-current" />
        </button>
      )}

      {gateOpen && gate && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-inverse-surface/85 p-6 backdrop-blur-sm">
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-surface/15 text-secondary-fixed">
              <LockIcon className="size-5" />
            </span>
            <h2 className="font-headline-sm text-headline-sm text-inverse-on-surface">{tPreview("endedTitle")}</h2>
            <p className="font-body-sm text-body-sm text-inverse-on-surface/80">
              {gate.signedIn ? tPreview("bodyMember", { days: gate.trialDays }) : tPreview("bodyGuest", { days: gate.trialDays })}
            </p>
            <Link
              href={gate.primaryHref}
              className="rounded-lg bg-primary-fixed px-6 py-3 font-label-lg text-label-lg text-on-primary-fixed transition-colors hover:bg-primary-fixed-dim"
            >
              {gate.signedIn ? tPreview("ctaMember", { days: gate.trialDays }) : tPreview("ctaGuest")}
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-4 font-label-md text-label-md text-inverse-on-surface/80">
              {!gate.signedIn && gate.signInHref && (
                <Link href={gate.signInHref} className="underline-offset-4 hover:underline">
                  {tPreview("signIn")}
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  closeGate();
                  seek(0, { play: true });
                }}
                className="underline-offset-4 hover:underline"
              >
                {tPreview("replay")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media controls keep left-to-right order in RTL, like a timeline. */}
      <div
        dir="ltr"
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 pt-10 pb-4 transition-opacity",
          playing && "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
        )}
      >
        <div className="flex w-full items-center gap-3">
          <span className="w-12 text-end font-label-sm text-label-sm text-white/90 tabular-nums">{clock(currentTime)}</span>
          <div className="relative flex flex-1 items-center">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={Math.floor(currentTime)}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label={t("seek")}
              aria-valuetext={clock(currentTime)}
              style={{ backgroundSize: `${progress}% 100%` }}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 bg-gradient-to-r from-primary-fixed to-primary-fixed bg-no-repeat [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
            {isPreview && lockedFrom < 100 && (
              // Members-only part of the timeline.
              <span
                aria-hidden
                style={{ left: `${lockedFrom}%` }}
                className="pointer-events-none absolute inset-y-0 end-0 my-auto h-2 rounded-e-full bg-[repeating-linear-gradient(135deg,rgb(0_0_0/0.45)_0_4px,rgb(0_0_0/0.2)_4px_8px)]"
              />
            )}
          </div>
          <span className="w-12 font-label-sm text-label-sm text-white/60 tabular-nums">{clock(duration)}</span>
        </div>

        <div className="flex items-center justify-between pt-1 text-white/80">
          <div className="flex items-center gap-3">
            <button type="button" onClick={togglePlay} aria-label={playing ? t("pause") : t("play")} className="hover:text-white">
              {playing ? <PauseIcon className="size-6 fill-current" /> : <PlayIcon className="size-6 fill-current" />}
            </button>
            <button type="button" onClick={() => seek(currentTime - 10)} aria-label={t("back")} className="hover:text-white">
              <RotateCcwIcon className="size-5" />
            </button>
            <button type="button" onClick={() => seek(currentTime + 10)} aria-label={t("forward")} className="hover:text-white">
              <RotateCwIcon className="size-5" />
            </button>
            <div className="ms-2 hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => {
                  const video = videoRef.current;
                  if (!video) return;
                  video.muted = !video.muted;
                  setMuted(video.muted);
                }}
                aria-label={muted ? t("unmute") : t("mute")}
                className="hover:text-white"
              >
                {muted || volume === 0 ? <VolumeXIcon className="size-5" /> : <Volume2Icon className="size-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const video = videoRef.current;
                  if (!video) return;
                  video.volume = Number(e.target.value);
                  video.muted = video.volume === 0;
                  setVolume(video.volume);
                  setMuted(video.muted);
                }}
                aria-label={t("volume")}
                className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!;
                if (videoRef.current) videoRef.current.playbackRate = next;
                setSpeed(next);
              }}
              aria-label={t("speed")}
              className="font-label-sm text-label-sm tracking-widest hover:text-white"
            >
              {format.number(speed, { minimumFractionDigits: speed === 1 ? 1 : 2 })}×
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
              className="hover:text-white"
            >
              {fullscreen ? <MinimizeIcon className="size-5" /> : <MaximizeIcon className="size-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
