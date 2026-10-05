"use client";

import {
  AudioLinesIcon,
  BookmarkIcon,
  FlipHorizontal2Icon,
  InfoIcon,
  LockIcon,
  MaximizeIcon,
  MinimizeIcon,
  PauseIcon,
  PictureInPicture2Icon,
  PlayIcon,
  RectangleHorizontalIcon,
  RotateCcwIcon,
  RotateCwIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { PracticeChapter } from "../types";
import { ambiences, useAmbience } from "./ambient-sound";
import { usePracticeStage } from "./practice-stage";

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

type Props = {
  videoUrl?: string;
  poster: string;
  posterAlt: string;
  categoryLabel: string;
  durationSeconds: number;
  chapters: PracticeChapter[];
  /** Where this practice sits in a program, e.g. "Solar Awakening · Day 14". */
  episode?: string;
  /** Where the "preview ended" invitation sends people (locale-less paths). */
  gate?: { signedIn: boolean; primaryHref: string; signInHref?: string; trialDays: number };
};

const glass = "rounded-full bg-black/40 backdrop-blur-md";
const control = "flex size-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none";

export function PracticePlayer({ videoUrl, poster, posterAlt, categoryLabel, durationSeconds, chapters, episode, gate }: Props) {
  const t = useTranslations("PracticeDetail.player");
  const tPreview = useTranslations("PracticeDetail.preview");
  const format = useFormatter();
  const stage = usePracticeStage();
  const { videoRef, currentTime, setCurrentTime, seek, limitSeconds, gateOpen, openGate, closeGate } = stage;
  const { audioOnly, setAudioOnly, theater, setTheater, shortcutsOpen, setShortcutsOpen } = stage;
  const isPreview = limitSeconds !== undefined;
  const frameRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(durationSeconds);
  /**
   * While playing, the controls fade out and come back on hover — which a touch screen never
   * reports, so on a phone they were unreachable. A tap reveals them instead, then they fade
   * again a few seconds later.
   */
  const [touchControls, setTouchControls] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [mirrored, setMirrored] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [mixOpen, setMixOpen] = useState(false);
  /** Share of the sound given to the ambience when one is on; the voice gets the rest. */
  const [blend, setBlend] = useState(0.3);

  const level = muted ? 0 : volume;
  // The ambience gets its share of the overall volume; the voice keeps the rest.
  const { ambience, setAmbience } = useAmbience(playing, level * blend);
  const voiceShare = ambience === "voice" ? 1 : 1 - blend;

  // The voice is the video's own sound; the volume slider sets both voice and ambience.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.min(1, volume * voiceShare);
    video.muted = muted;
  }, [videoRef, volume, voiceShare, muted]);

  useEffect(() => {
    setPipSupported(typeof document !== "undefined" && document.pictureInPictureEnabled);
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const clock = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const two = (n: number) => format.number(n, { minimumIntegerDigits: 2, useGrouping: false });
    return `${two(Math.floor(s / 60))}:${two(s % 60)}`;
  };
  const percent = (n: number) => format.number(n, { style: "percent", maximumFractionDigits: 0 });

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  };
  const toggleMute = () => setMuted((m) => !m);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frameRef.current?.requestFullscreen();
  };
  const togglePip = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) void document.exitPictureInPicture();
    else void video.requestPictureInPicture().catch(() => undefined);
  };
  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!;
    if (videoRef.current) videoRef.current.playbackRate = next;
    setSpeed(next);
  };

  // Shortcuts work while the player (or anything in it) has focus; sliders keep their arrows.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const onSlider = e.target instanceof HTMLInputElement;
    const key = e.key.toLowerCase();
    const actions: Record<string, () => void> = {
      " ": togglePlay,
      k: togglePlay,
      j: () => seek(currentTime - 10),
      l: () => seek(currentTime + 10),
      m: toggleMute,
      f: toggleFullscreen,
      t: () => setTheater(!theater),
      a: () => setAudioOnly(!audioOnly),
      "?": () => setShortcutsOpen(!shortcutsOpen),
      escape: () => {
        setShortcutsOpen(false);
        setMixOpen(false);
      },
      ...(onSlider ? {} : { arrowleft: () => seek(currentTime - 10), arrowright: () => seek(currentTime + 10) }),
    };
    const action = actions[key];
    if (!action || (onSlider && key === " ")) return;
    if (e.target instanceof HTMLButtonElement && (key === " " || key === "enter")) return;
    e.preventDefault();
    action();
  };

  const ambiencePills = (variant: "bar" | "panel", className?: string) => (
    <div
      role="radiogroup"
      aria-label={t("ambience.title")}
      className={cn(variant === "bar" ? cn("flex items-center gap-0.5 p-1", glass) : "grid grid-cols-3 gap-1.5", className)}
    >
      {ambiences.map((kind) => (
        <button
          key={kind}
          type="button"
          role="radio"
          aria-checked={ambience === kind}
          onClick={() => setAmbience(kind)}
          className={cn(
            "font-label-sm text-label-sm transition-colors",
            variant === "bar"
              ? "rounded-full px-3 py-1 whitespace-nowrap"
              : "flex min-h-11 items-center justify-center rounded-lg bg-white/10 px-2 py-1.5 text-center leading-tight",
            ambience === kind ? "bg-primary-fixed text-on-primary-fixed" : "text-white/80 hover:bg-white/15 hover:text-white",
          )}
        >
          {t(`ambience.${kind}`)}
        </button>
      ))}
    </div>
  );

  const tag = (
    <div className="absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className={cn("flex items-center gap-1.5 px-3 py-1.5 font-label-sm text-label-sm tracking-widest text-white uppercase", glass)}>
          <span className="size-1.5 rounded-full bg-secondary-fixed" />
          {categoryLabel}
        </span>
        {episode && (
          <span className={cn("hidden truncate px-3 py-1.5 font-label-sm text-label-sm text-white/90 sm:inline", glass)}>{episode}</span>
        )}
        {!videoUrl && (
          <span dir="ltr" className={cn("px-3 py-1.5 font-label-sm text-label-sm text-white/90 tabular-nums", glass)}>
            {clock(duration)}
          </span>
        )}
        {isPreview && (
          <span className="flex items-center gap-1.5 rounded-full bg-secondary-fixed px-3 py-1.5 font-label-sm text-label-sm font-semibold text-on-secondary-fixed">
            <LockIcon className="size-3" />
            {tPreview("badge", { minutes: Math.round(limitSeconds / 60) })}
          </span>
        )}
      </div>
      {videoUrl && (
        <div className="flex shrink-0 items-center gap-2">
          {ambiencePills("bar", "hidden lg:flex")}
          <button
            type="button"
            onClick={() => setMirrored((m) => !m)}
            aria-pressed={mirrored}
            aria-label={t("mirror")}
            title={t("mirror")}
            className={cn("flex size-9 items-center justify-center rounded-full backdrop-blur-md transition-colors", mirrored ? "bg-primary text-on-primary" : "bg-black/40 text-white hover:bg-black/60")}
          >
            <FlipHorizontal2Icon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setShortcutsOpen(!shortcutsOpen)}
            aria-pressed={shortcutsOpen}
            aria-label={t("shortcuts.title")}
            title={t("shortcuts.title")}
            className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
          >
            <InfoIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  );

  if (!videoUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-inverse-surface shadow-2xl">
        <Image src={poster} alt={posterAlt} fill priority sizes="(min-width: 1024px) 860px, 100vw" className="object-cover" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
        {tag}
        <div className="absolute inset-x-4 bottom-4 flex justify-center">
          <p className="rounded-full bg-black/50 px-4 py-2 text-center font-body-sm text-body-sm text-white backdrop-blur-md">{t("unavailable")}</p>
        </div>
      </div>
    );
  }

  // Chapters cut the timeline into segments; without any, it is one segment.
  const total = duration > 0 ? duration : durationSeconds;
  const marks = chapters.length ? chapters : [{ title: "", description: "", startSeconds: 0 }];
  const segments = marks.map((chapter, i) => {
    const end = Math.min(total, marks[i + 1]?.startSeconds ?? total);
    const length = Math.max(0, end - chapter.startSeconds);
    const filled = length > 0 ? Math.min(1, Math.max(0, (currentTime - chapter.startSeconds) / length)) : 0;
    return { ...chapter, end, length, filled };
  });
  const activeIndex = segments.reduce((found, s, i) => (s.startSeconds <= currentTime ? i : found), 0);
  const active = chapters.length ? segments[activeIndex] : undefined;
  const lockedFrom = isPreview && total > 0 ? Math.min(100, (limitSeconds / total) * 100) : 100;

  const shortcutList = [
    ["K", "playPause"],
    ["J", "back"],
    ["L", "forward"],
    ["M", "mute"],
    ["F", "fullscreen"],
    ["T", "theater"],
    ["A", "audioOnly"],
  ] as const;

  return (
    <div
      ref={frameRef}
      role="region"
      aria-label={t("region")}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        setTouchControls(true);
        window.setTimeout(() => setTouchControls(false), 4000);
      }}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-inverse-surface shadow-2xl outline-none select-none focus-visible:ring-2 focus-visible:ring-primary"
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

      {audioOnly && (
        // Sound only: the poster stands in for the picture; the video keeps playing beneath.
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 overflow-hidden text-white" onClick={togglePlay}>
          <Image src={poster} alt="" fill sizes="(min-width: 1024px) 860px, 100vw" className="scale-110 object-cover blur-2xl brightness-50" />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
            <AudioLinesIcon className={cn("size-7", playing && "animate-pulse")} />
          </span>
          <p className="relative font-label-lg text-label-lg">{t("audioOnlyTitle")}</p>
          <p className="relative max-w-xs text-center font-body-sm text-body-sm text-white/75">{t("audioOnlyBody")}</p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
      {tag}

      {!playing && !gateOpen && !shortcutsOpen && !mixOpen && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label={t("play")}
          className="absolute inset-0 z-20 m-auto flex size-16 items-center justify-center rounded-full bg-primary/85 text-on-primary shadow-xl ring-8 ring-white/15 backdrop-blur-md transition-transform hover:scale-105 active:scale-95 sm:size-20"
        >
          <PlayIcon className="ms-1 size-7 fill-current sm:size-8" />
        </button>
      )}

      {shortcutsOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-inverse-surface/85 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-5 text-on-surface shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-label-lg text-label-lg">{t("shortcuts.title")}</h2>
              <button type="button" onClick={() => setShortcutsOpen(false)} aria-label={t("shortcuts.close")} className="rounded-full p-1.5 hover:bg-surface-container">
                <XIcon className="size-4" />
              </button>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-body-sm text-body-sm">
              {shortcutList.map(([key, action]) => (
                <div key={key} className="contents">
                  <dt>
                    <kbd className="inline-flex min-w-7 justify-center rounded-md bg-surface-container px-2 py-0.5 font-label-sm text-label-sm">{key}</kbd>
                  </dt>
                  <dd className="text-on-surface-variant">{t(`shortcuts.${action}`)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 font-body-sm text-body-sm text-outline">{t("shortcuts.hint")}</p>
          </div>
        </div>
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
            <Link href={gate.primaryHref} className="rounded-lg bg-primary-fixed px-6 py-3 font-label-lg text-label-lg text-on-primary-fixed transition-colors hover:bg-primary-fixed-dim">
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
          "absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pt-12 pb-2 transition-opacity sm:px-5 sm:pb-3",
          playing && !touchControls && !mixOpen && "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
        )}
      >
        {/* One segment per chapter: played ones fill pale green, the current one fills sand. */}
        <div className="relative flex h-4 items-center">
          <div aria-hidden className="pointer-events-none flex w-full gap-1">
            {segments.map((segment, i) => (
              <span key={i} style={{ flexGrow: segment.length || 1 }} className="relative h-1.5 basis-0 overflow-hidden rounded-full bg-white/25">
                <span
                  style={{ width: `${segment.filled * 100}%` }}
                  className={cn("absolute inset-y-0 start-0 rounded-full", segment.filled >= 1 ? "bg-primary-fixed" : "bg-secondary-fixed")}
                />
              </span>
            ))}
          </div>
          {isPreview && lockedFrom < 100 && (
            // Members-only part of the timeline.
            <span
              aria-hidden
              style={{ left: `${lockedFrom}%` }}
              className="pointer-events-none absolute end-0 h-1.5 rounded-e-full bg-[repeating-linear-gradient(135deg,rgb(0_0_0/0.5)_0_4px,rgb(0_0_0/0.2)_4px_8px)]"
            />
          )}
          <input
            type="range"
            min={0}
            max={total || 0}
            step={1}
            value={Math.floor(currentTime)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label={t("seek")}
            aria-valuetext={active ? `${clock(currentTime)} · ${active.title}` : clock(currentTime)}
            className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent opacity-0 focus-visible:opacity-100 [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

        <div className="flex items-center justify-between gap-2 text-white/85">
          <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
            <button type="button" onClick={togglePlay} aria-label={playing ? t("pause") : t("play")} className={control}>
              {playing ? <PauseIcon className="size-5 fill-current" /> : <PlayIcon className="size-5 fill-current" />}
            </button>
            <button type="button" onClick={() => seek(currentTime - 10)} aria-label={t("back")} className={control}>
              <RotateCcwIcon className="size-4.5" />
            </button>
            <button type="button" onClick={() => seek(currentTime + 10)} aria-label={t("forward")} className={control}>
              <RotateCwIcon className="size-4.5" />
            </button>
            <div className="group/volume hidden items-center sm:flex">
              <button type="button" onClick={toggleMute} aria-label={muted ? t("unmute") : t("mute")} className={control}>
                {muted || volume === 0 ? <VolumeXIcon className="size-4.5" /> : <Volume2Icon className="size-4.5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setMuted(Number(e.target.value) === 0);
                }}
                aria-label={t("volume")}
                className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 accent-white opacity-0 transition-[width,opacity,margin] duration-200 group-focus-within/volume:me-2 group-focus-within/volume:w-16 group-focus-within/volume:opacity-100 group-hover/volume:me-2 group-hover/volume:w-16 group-hover/volume:opacity-100"
              />
            </div>
            <span className="ms-1 font-label-sm text-label-sm whitespace-nowrap tabular-nums">
              {clock(currentTime)} <span className="text-white/50">/ {clock(total)}</span>
            </span>
            {active && (
              <span className="ms-3 hidden min-w-0 items-center gap-1.5 font-label-sm text-label-sm text-white/75 lg:flex">
                <BookmarkIcon className="size-3.5 shrink-0" />
                <span className="truncate">{t("chapterLabel", { number: activeIndex + 1, title: active.title })}</span>
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setMixOpen((o) => !o)}
                aria-expanded={mixOpen}
                aria-label={t("mix.title")}
                className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 font-label-sm text-[11px] leading-tight text-white/90 transition-colors hover:bg-white/20"
              >
                <AudioLinesIcon className="size-3.5 text-primary-fixed" />
                <span className="hidden sm:inline">
                  {ambience === "voice" ? t("mix.voiceOnly") : t("mix.label", { voice: percent(1 - blend), ambience: percent(blend) })}
                </span>
              </button>
              {mixOpen && (
                <div className="absolute end-0 bottom-full mb-2 w-80 max-w-[calc(100vw-2.5rem)] rounded-xl bg-inverse-surface/95 p-4 text-inverse-on-surface shadow-xl backdrop-blur-md">
                  <p className="mb-2 font-label-sm text-label-sm tracking-widest text-white/60 uppercase">{t("ambience.title")}</p>
                  {ambiencePills("panel")}
                  <label className={cn("mt-3 block", ambience === "voice" && "opacity-50")}>
                    <span className="flex justify-between font-label-sm text-label-sm text-white/80">
                      <span>{t("mix.voice", { value: percent(1 - blend) })}</span>
                      <span>{t("mix.ambience", { value: percent(blend) })}</span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={0.8}
                      step={0.05}
                      value={blend}
                      disabled={ambience === "voice"}
                      onChange={(e) => setBlend(Number(e.target.value))}
                      aria-label={t("mix.title")}
                      className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-primary-fixed"
                    />
                  </label>
                </div>
              )}
            </div>
            <button type="button" onClick={cycleSpeed} aria-label={t("speed")} className="flex h-10 min-w-10 items-center justify-center rounded-full px-1 font-label-sm text-label-sm tracking-wide hover:bg-white/10 hover:text-white">
              {format.number(speed, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}×
            </button>
            {pipSupported && !audioOnly && (
              <button type="button" onClick={togglePip} aria-label={t("pip")} title={t("pip")} className={cn(control, "hidden sm:flex")}>
                <PictureInPicture2Icon className="size-4.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setTheater(!theater)}
              aria-pressed={theater}
              aria-label={theater ? t("exitTheater") : t("theater")}
              title={theater ? t("exitTheater") : t("theater")}
              className={cn(control, "hidden lg:flex", theater && "text-primary-fixed")}
            >
              <RectangleHorizontalIcon className="size-4.5" />
            </button>
            <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")} className={control}>
              {fullscreen ? <MinimizeIcon className="size-4.5" /> : <MaximizeIcon className="size-4.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
