"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type StageContextValue = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** True when a playable source is mounted. */
  hasVideo: boolean;
  /** Preview length for non-members; playback and seeking stop here. */
  limitSeconds?: number;
  currentTime: number;
  setCurrentTime: (seconds: number) => void;
  seek: (seconds: number, opts?: { play?: boolean }) => void;
  /** Register external player bridge (e.g. YouTube IFrame API) */
  registerSeekBridge: (
    bridge: ((seconds: number, opts?: { play?: boolean }) => void) | null,
  ) => void;
  /** Trigger completion when video ends (supports both native <video> and external embeds) */
  triggerEnded: () => void;
  /** Subscribe to video ended event */
  subscribeEnded: (cb: () => void) => () => void;
  /** The "preview ended" invitation. */
  gateOpen: boolean;
  openGate: () => void;
  closeGate: () => void;
  /** Sound only: the picture is covered by the poster while the practice keeps playing. */
  audioOnly: boolean;
  setAudioOnly: (on: boolean) => void;
  /** Wide mode: the player takes the page's full width and the sidebar moves below. */
  theater: boolean;
  setTheater: (on: boolean) => void;
  /** The keyboard-shortcuts panel over the player. */
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
};

const StageContext = createContext<StageContextValue | null>(null);

// Shares one <video> or embed between the player, chapters, and reflections, and owns preview limits.
export function PracticeStage({
  hasVideo,
  limitSeconds,
  children,
}: {
  hasVideo: boolean;
  limitSeconds?: number;
  children: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const seekBridgeRef = useRef<((seconds: number, opts?: { play?: boolean }) => void) | null>(null);
  const endedListenersRef = useRef<Set<() => void>>(new Set());

  const [currentTime, setCurrentTime] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [theater, setTheater] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const openGate = useCallback(() => {
    const video = videoRef.current;
    if (video && limitSeconds !== undefined) {
      video.pause();
      video.currentTime = limitSeconds;
    }
    setGateOpen(true);
  }, [limitSeconds]);

  const seek = useCallback(
    (seconds: number, opts?: { play?: boolean }) => {
      if (limitSeconds !== undefined && seconds >= limitSeconds) return openGate();
      if (seekBridgeRef.current) {
        seekBridgeRef.current(seconds, opts);
        setCurrentTime(seconds);
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      const end = Number.isFinite(video.duration) ? video.duration : seconds;
      video.currentTime = Math.max(0, Math.min(seconds, end));
      setCurrentTime(video.currentTime);
      if (opts?.play) video.play().catch(() => undefined); // interrupted by pause: harmless
    },
    [limitSeconds, openGate],
  );

  const registerSeekBridge = useCallback(
    (bridge: ((seconds: number, opts?: { play?: boolean }) => void) | null) => {
      seekBridgeRef.current = bridge;
    },
    [],
  );

  const triggerEnded = useCallback(() => {
    for (const cb of endedListenersRef.current) {
      try {
        cb();
      } catch (err) {
        console.error("Error in practice stage ended listener:", err);
      }
    }
    if (videoRef.current) {
      videoRef.current.dispatchEvent(new Event("ended"));
    }
  }, []);

  const subscribeEnded = useCallback((cb: () => void) => {
    endedListenersRef.current.add(cb);
    return () => {
      endedListenersRef.current.delete(cb);
    };
  }, []);

  const value = useMemo(
    () => ({
      videoRef,
      hasVideo,
      limitSeconds,
      currentTime,
      setCurrentTime,
      seek,
      registerSeekBridge,
      triggerEnded,
      subscribeEnded,
      gateOpen,
      openGate,
      closeGate: () => setGateOpen(false),
      audioOnly,
      setAudioOnly,
      theater,
      setTheater,
      shortcutsOpen,
      setShortcutsOpen,
    }),
    [
      hasVideo,
      limitSeconds,
      currentTime,
      seek,
      registerSeekBridge,
      triggerEnded,
      subscribeEnded,
      gateOpen,
      openGate,
      audioOnly,
      theater,
      shortcutsOpen,
    ],
  );

  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

export function usePracticeStage() {
  const ctx = useContext(StageContext);
  if (!ctx) throw new Error("usePracticeStage must be used inside <PracticeStage>");
  return ctx;
}

export function useOptionalPracticeStage() {
  return useContext(StageContext);
}

/**
 * The practice page's two columns. In wide mode the main column (player first) spans the page
 * and the sidebar drops below it; the server-rendered content inside is unchanged.
 */
export function PracticeColumns({ main, aside }: { main: React.ReactNode; aside: React.ReactNode }) {
  const { theater } = usePracticeStage();
  return (
    <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
      <section className={cn("flex flex-col gap-space-lg", theater ? "lg:col-span-12" : "lg:col-span-8")}>{main}</section>
      <aside className={cn("flex flex-col gap-space-lg", theater ? "lg:col-span-12" : "lg:col-span-4")}>
        {aside}
      </aside>
    </div>
  );
}
