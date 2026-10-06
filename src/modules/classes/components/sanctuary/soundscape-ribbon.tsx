"use client";

import { useTranslations } from "next-intl";
import { MicIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { useSanctuaryStore } from "./sanctuary-store";

export function SoundscapeRibbon({
  soundscapeDetails,
}: {
  soundscapeDetails?: string | null;
}) {
  const t = useTranslations("LiveClasses");
  const isMuted = useSanctuaryStore((state) => state.isMuted);
  const voicePercent = useSanctuaryStore((state) => state.voicePercent);
  const toggleMute = useSanctuaryStore((state) => state.toggleMute);
  const setVoicePercent = useSanctuaryStore((state) => state.setVoicePercent);

  return (
    <div className="absolute bottom-4 inset-x-4 md:inset-x-5 bg-surface/90 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between gap-4 pointer-events-auto">
      {/* Audio Mute/Unmute */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMute}
          className="size-9 rounded-full bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-all"
          title={isMuted ? "Unmute soundscape" : "Mute soundscape"}
          aria-label={isMuted ? "Unmute soundscape" : "Mute soundscape"}
        >
          {isMuted ? (
            <VolumeXIcon className="size-4" />
          ) : (
            <Volume2Icon className="size-4" />
          )}
        </button>
        <div className="hidden sm:flex flex-col">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
            {t("binauralStream")}
          </span>
          <span className="font-label-md text-label-md text-primary font-semibold truncate max-w-[180px]">
            {soundscapeDetails ?? t("soundscapeBalanceSubtitle")}
          </span>
        </div>
      </div>

      {/* Soundscape Voice / Bowls Balance Slider */}
      <div className="hidden md:flex items-center gap-3 bg-surface-container-low px-3 py-1.5 rounded-lg max-w-xs w-full">
        <MicIcon className="size-3.5 text-on-surface-variant shrink-0" />
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">
            <span>{t("voiceLabel", { percent: voicePercent })}</span>
            <span>{t("bowlsLabel", { percent: 100 - voicePercent })}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={voicePercent}
            onChange={(e) => setVoicePercent(Number(e.target.value))}
            className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>
    </div>
  );
}
