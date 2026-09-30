"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type StageContextValue = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** True when a playable source is mounted. */
  hasVideo: boolean;
  /** Preview length for non-members; playback and seeking stop here. */
  limitSeconds?: number;
  currentTime: number;
  setCurrentTime: (seconds: number) => void;
  seek: (seconds: number, opts?: { play?: boolean }) => void;
  /** The "preview ended" invitation. */
  gateOpen: boolean;
  openGate: () => void;
  closeGate: () => void;
};

const StageContext = createContext<StageContextValue | null>(null);

// Shares one <video> between the player and the chapter list, and owns the preview limit.
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
  const [currentTime, setCurrentTime] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);

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
      const video = videoRef.current;
      if (!video) return;
      if (limitSeconds !== undefined && seconds >= limitSeconds) return openGate();
      const end = Number.isFinite(video.duration) ? video.duration : seconds;
      video.currentTime = Math.max(0, Math.min(seconds, end));
      setCurrentTime(video.currentTime);
      if (opts?.play) video.play().catch(() => undefined); // interrupted by pause: harmless
    },
    [limitSeconds, openGate],
  );

  const value = useMemo(
    () => ({
      videoRef,
      hasVideo,
      limitSeconds,
      currentTime,
      setCurrentTime,
      seek,
      gateOpen,
      openGate,
      closeGate: () => setGateOpen(false),
    }),
    [hasVideo, limitSeconds, currentTime, seek, gateOpen, openGate],
  );

  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

export function usePracticeStage() {
  const ctx = useContext(StageContext);
  if (!ctx) throw new Error("usePracticeStage must be used inside <PracticeStage>");
  return ctx;
}
