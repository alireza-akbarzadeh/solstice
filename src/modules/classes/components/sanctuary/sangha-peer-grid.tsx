"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { MicOffIcon, TvIcon } from "lucide-react";
import type { PeerPractitioner } from "./types";

const DEFAULT_PEERS: PeerPractitioner[] = [
  {
    id: "clara",
    name: "Clara M.",
    location: "Zurich",
    image: "/images/classes/peer-clara.jpg",
  },
  {
    id: "marcus",
    name: "Marcus T.",
    location: "London",
    image: "/images/classes/peer-marcus.jpg",
  },
  {
    id: "amina",
    name: "Amina K.",
    location: "Montreal",
    image: "/images/classes/peer-amina.jpg",
  },
  {
    id: "david",
    name: "David S.",
    location: "Kyoto",
    image: "/images/classes/peer-david.jpg",
  },
];

export function SanghaPeerGrid() {
  const locale = useLocale();
  const t = useTranslations("LiveClasses");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold">
            {t("silentCircle")}
          </span>
          <span className="text-xs bg-surface-container-high px-2.5 py-0.5 rounded-full text-on-surface-variant font-label-sm">
            {t("sharingVideo", { count: 38 })}
          </span>
        </div>
        <span className="font-label-sm text-label-sm text-outline">
          {t("holdingSilence")}
        </span>
      </div>

      {/* Video Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {DEFAULT_PEERS.map((peer) => (
          <div
            key={peer.id}
            className="bg-surface-container-low rounded-xl p-2 flex flex-col gap-1.5 shadow-xs border border-outline-variant/30"
          >
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container">
              {peer.image && (
                <Image
                  src={peer.image}
                  alt={peer.name}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute bottom-1 end-1 bg-inverse-surface/60 text-surface rounded-full p-0.5">
                <MicOffIcon className="size-2.5" />
              </div>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="font-label-sm text-label-sm text-on-surface font-medium truncate">
                {peer.name}
              </span>
              <span className="font-label-sm text-label-sm text-outline truncate">
                {peer.location}
              </span>
            </div>
          </div>
        ))}

        {/* Self View Tile */}
        <div className="bg-surface-container rounded-xl p-2 flex flex-col gap-1.5 shadow-xs border border-outline-variant/40">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-high flex items-center justify-center">
            <div className="flex flex-col items-center gap-1 text-on-surface-variant">
              <TvIcon className="size-4 text-primary" />
              <span className="text-[10px] uppercase tracking-wider font-label-sm">
                {locale === "fa" ? "تصویر شما" : "Self View"}
              </span>
            </div>
            <div className="absolute top-1 start-1 bg-primary text-on-primary text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold">
              {locale === "fa" ? "شما" : "You"}
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="font-label-sm text-label-sm text-primary font-semibold truncate">
              {locale === "fa" ? "مت متصل است" : "Mat Connected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
