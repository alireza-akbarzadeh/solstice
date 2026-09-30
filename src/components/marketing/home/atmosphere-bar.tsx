"use client";

import { AudioLinesIcon, DropletsIcon, SlidersHorizontalIcon, WindIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

const soundscapes = [
  { id: "rain", icon: DropletsIcon },
  { id: "binaural", icon: AudioLinesIcon },
  { id: "breeze", icon: WindIcon },
] as const;

type Soundscape = (typeof soundscapes)[number]["id"];

// Selection only for now — audio playback arrives with the soundscape feature.
export function AtmosphereBar() {
  const t = useTranslations("Home.atmosphere");
  const [selected, setSelected] = useState<Soundscape>("rain");

  return (
    <section className="w-full bg-surface-container py-6">
      <Container className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-3">
          <SlidersHorizontalIcon className="size-5 text-clay" />
          <h2 className="font-label-md text-label-md tracking-wider text-on-surface uppercase">{t("title")}</h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {soundscapes.map(({ id, icon: Icon }) => {
            const active = selected === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 font-label-sm text-label-sm tracking-wide transition-colors duration-300",
                  active
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-highest text-on-surface-variant hover:text-primary",
                )}
              >
                <Icon className="size-3.5" />
                {t(id)}
              </button>
            );
          })}
        </div>
        <p className="font-body-sm text-body-sm text-clay italic rtl:not-italic">{t("quote")}</p>
      </Container>
    </section>
  );
}
