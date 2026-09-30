"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type StageContextValue = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** True when a real video source is mounted (sample content has none). */
  hasVideo: boolean;
  currentTime: number;
  setCurrentTime: (seconds: number) => void;
  seek: (seconds: number, opts?: { play?: boolean }) => void;
};

const StageContext = createContext<StageContextValue | null>(null);

// Shares one <video> between the player and the chapter list.
export function PracticeStage({ hasVideo, children }: { hasVideo: boolean; children: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const seek = useCallback((seconds: number, opts?: { play?: boolean }) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(seconds, Number.isFinite(video.duration) ? video.duration : seconds));
    setCurrentTime(video.currentTime);
    if (opts?.play) video.play().catch(() => undefined); // interrupted by pause: harmless
  }, []);

  const value = useMemo(
    () => ({ videoRef, hasVideo, currentTime, setCurrentTime, seek }),
    [hasVideo, currentTime, seek],
  );

  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

export function usePracticeStage() {
  const ctx = useContext(StageContext);
  if (!ctx) throw new Error("usePracticeStage must be used inside <PracticeStage>");
  return ctx;
}
