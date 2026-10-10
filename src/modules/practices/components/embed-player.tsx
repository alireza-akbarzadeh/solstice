"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { useOptionalPracticeStage } from "./practice-stage";
import {
  loadYouTubeIframeApi,
  YT_PLAYER_STATE,
  type YouTubePlayer,
} from "@/infrastructure/video/youtube-api";

/**
 * Embedded video player with YouTube IFrame API Bridge.
 * When a YouTube video is played inside PracticeStage, it establishes a two-way bridge:
 * - Continuously syncs currentTime to PracticeStage for live chapter highlighting & reflections.
 * - Handles seeking when chapters or reflection timestamp chips are clicked.
 * - Honors preview gating (limitSeconds) if active.
 * - Triggers auto-completion (solstice_practice_completion) when the video finishes.
 * Non-YouTube embeds (like Aparat) fall back cleanly to a standard responsive iframe.
 */
export function EmbedPlayer({ src, title }: { src: string; title: string }) {
  const t = useTranslations("PracticeDetail.player");
  const stage = useOptionalPracticeStage();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const iframeId = useId().replace(/:/g, "_");

  const isYouTube =
    Boolean(src) &&
    (src.includes("youtube.com") ||
      src.includes("youtube-nocookie.com") ||
      src.includes("youtu.be"));

  // Ensure enablejsapi=1 is present in the iframe src for YouTube
  const finalSrc = (() => {
    if (!src || !isYouTube) return src;
    try {
      const url = new URL(src);
      if (!url.searchParams.has("enablejsapi")) {
        url.searchParams.set("enablejsapi", "1");
      }
      return url.toString();
    } catch {
      return src;
    }
  })();

  useEffect(() => {
    if (!isYouTube || !stage || !iframeRef.current) return;

    let mounted = true;

    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const startPolling = (player: YouTubePlayer) => {
      stopPolling();
      pollTimerRef.current = setInterval(() => {
        try {
          const time = player.getCurrentTime();
          if (typeof time === "number" && !Number.isNaN(time)) {
            stage.setCurrentTime(time);
            if (stage.limitSeconds !== undefined && time >= stage.limitSeconds) {
              player.pauseVideo();
              player.seekTo(stage.limitSeconds, true);
              stage.openGate();
            }
          }
        } catch {
          // ignore transient iframe poll exceptions
        }
      }, 250);
    };

    loadYouTubeIframeApi()
      .then((YT) => {
        if (!mounted || !iframeRef.current) return;

        new YT.Player(iframeRef.current, {
          events: {
            onReady: (event) => {
              if (!mounted) return;
              playerRef.current = event.target;

              // Register seek bridge handler with PracticeStage
              stage.registerSeekBridge((seconds, opts) => {
                try {
                  event.target.seekTo(seconds, true);
                  if (opts?.play) {
                    event.target.playVideo();
                  }
                } catch (err) {
                  console.error("Error seeking YouTube player:", err);
                }
              });
            },
            onStateChange: (event) => {
              if (!mounted) return;
              const state = event.data;
              if (state === YT_PLAYER_STATE.PLAYING) {
                startPolling(event.target);
              } else if (state === YT_PLAYER_STATE.ENDED) {
                stopPolling();
                try {
                  const duration = event.target.getDuration();
                  if (duration) stage.setCurrentTime(duration);
                } catch {
                  // ignore
                }
                stage.triggerEnded();
              } else {
                stopPolling();
                try {
                  const time = event.target.getCurrentTime();
                  if (typeof time === "number" && !Number.isNaN(time)) {
                    stage.setCurrentTime(time);
                  }
                } catch {
                  // ignore
                }
              }
            },
          },
        });
      })
      .catch((err) => {
        console.warn("Could not load YouTube Player API:", err);
      });

    return () => {
      mounted = false;
      stopPolling();
      stage.registerSeekBridge(null);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [isYouTube, stage]);

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-inverse-surface p-space-lg text-center shadow-2xl">
        <p className="font-body-md text-body-md text-inverse-on-surface/80">
          {t("embedMissing")}
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-inverse-surface shadow-2xl">
      <iframe
        ref={iframeRef}
        id={iframeId}
        src={finalSrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 size-full border-0"
      />
    </div>
  );
}
