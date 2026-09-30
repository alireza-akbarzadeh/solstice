import { ArrowRightIcon, BrainIcon, SunriseIcon } from "lucide-react";
import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { ProgramSpotlight as Program } from "../types";

const icons = { sunrise: SunriseIcon, brain: BrainIcon };

const tone = {
  primary: {
    badge: "bg-primary-fixed text-on-primary-fixed",
    cta: "bg-primary text-on-primary hover:bg-primary-container",
  },
  clay: {
    badge: "bg-secondary-container text-on-secondary-container",
    cta: "bg-clay text-on-clay hover:bg-on-secondary-fixed-variant",
  },
};

// `reversed` puts the image first on desktop, alternating spotlights as in the design.
export function ProgramSpotlight({ program, reversed = false }: { program: Program; reversed?: boolean }) {
  const Icon = icons[program.icon];

  return (
    <div className="rounded-3xl bg-surface p-6 shadow-sm transition-shadow duration-300 hover:shadow-md md:p-8 lg:p-12">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        <div className={cn("flex flex-col justify-between lg:col-span-6", reversed && "lg:order-2")}>
          <div>
            <div className={cn("mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1", tone[program.tone].badge)}>
              <Icon className="size-3.5" />
              <span className="font-label-sm text-label-sm font-semibold tracking-wider uppercase">{program.badge}</span>
            </div>
            <h3 className="mb-4 font-headline-md text-headline-md text-primary">{program.title}</h3>
            <p className="mb-6 font-body-md text-body-md leading-relaxed text-on-surface-variant">{program.description}</p>
            <ol
              className={cn(
                "mb-8 grid grid-cols-2 gap-3 rounded-xl bg-surface-container-low p-4",
                program.phases.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3",
              )}
            >
              {program.phases.map((phase) => (
                <li key={phase.label} className="flex flex-col">
                  <span className="font-label-sm text-label-sm font-semibold text-clay uppercase">{phase.label}</span>
                  <span className="font-body-sm text-body-sm font-medium text-on-surface">{phase.title}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/programs/${program.slug}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-6 py-3 font-label-lg text-label-lg transition-colors duration-300",
                tone[program.tone].cta,
              )}
            >
              {program.cta}
              <ArrowRightIcon className="size-4 rtl:rotate-180" />
            </Link>
            <span className="font-body-sm text-body-sm text-outline">{program.note}</span>
          </div>
        </div>

        <div className={cn("lg:col-span-6", reversed && "lg:order-1")}>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-inner">
            <Image
              src={program.image}
              alt={program.imageAlt}
              fill
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
