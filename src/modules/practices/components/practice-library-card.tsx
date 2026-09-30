import { ClockIcon, LockIcon, PlayIcon, StarIcon } from "lucide-react";
import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SaveButton } from "@/modules/progress/components/practice-actions";

import type { IntensityLevel, PracticeSummary } from "../types";

const intensityTone: Record<IntensityLevel, string> = {
  gentle: "text-primary-fixed [&>span]:bg-primary-fixed",
  moderate: "text-secondary-fixed [&>span]:bg-secondary-fixed",
  fire: "text-tertiary-fixed [&>span]:bg-tertiary-fixed",
};

// Library grid card (practice-library-desktop).
export async function PracticeLibraryCard({
  practice,
  priority = false,
  unlocked = false,
  saved = false,
  signInHref,
}: {
  practice: PracticeSummary;
  priority?: boolean;
  /** The viewer is entitled to members-only practices: hide the lock. */
  unlocked?: boolean;
  /** In the viewer's saved practices. */
  saved?: boolean;
  /** Set when signed out: the bookmark leads to sign-in. */
  signInHref?: string;
}) {
  const [t, tBrand, format] = await Promise.all([getTranslations("Practice"), getTranslations("Brand"), getFormatter()]);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl bg-surface-container-low shadow-sm transition-all duration-300 ease-sanctuary hover:-translate-y-1 hover:shadow-xl motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container-high">
        <Image
          src={practice.image}
          alt={practice.imageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40" />

        <span className="absolute start-3.5 top-3.5 rounded-md bg-inverse-surface/70 px-2.5 py-1 font-label-sm text-label-sm text-inverse-on-surface backdrop-blur-md">
          {t(`categories.${practice.category}`)}
        </span>
        <div className="absolute end-3.5 top-3.5 flex items-center gap-2">
          {practice.access === "members" && !unlocked && (
            <span className="flex items-center gap-1 rounded-md bg-surface/90 px-2 py-1 font-label-sm text-label-sm text-clay">
              <LockIcon className="size-3" />
              {t("membersOnly")}
            </span>
          )}
          <span className="flex items-center gap-1 rounded-md bg-inverse-surface/70 px-2.5 py-1 font-label-sm text-label-sm text-inverse-on-surface backdrop-blur-md">
            <ClockIcon className="size-3" />
            {t("minutes", { count: practice.durationMinutes })}
          </span>
          <SaveButton practiceSlug={practice.slug} saved={saved} signInHref={signInHref} variant="icon" />
        </div>

        <div className="absolute inset-x-3.5 bottom-3 flex items-center justify-between gap-2 text-inverse-on-surface">
          <span
            className={cn(
              "flex items-center gap-1.5 font-label-sm text-label-sm tracking-widest uppercase",
              intensityTone[practice.intensity.level],
            )}
          >
            <span className="size-1.5 rounded-full" />
            {practice.intensity.label}
          </span>
          <span className="font-label-sm text-label-sm text-inverse-on-surface/80">{t(`props.${practice.props}`)}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-space-md">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-label-sm text-label-sm font-medium tracking-wider text-clay uppercase">{practice.series}</span>
            <span
              className="inline-flex shrink-0 items-center gap-1 font-label-sm text-label-sm text-outline"
              aria-label={t("rating", { rating: format.number(practice.rating), count: practice.reviewCount })}
            >
              <StarIcon aria-hidden className="size-3 fill-current text-clay" />
              <span aria-hidden>
                {format.number(practice.rating, { minimumFractionDigits: 1 })} ({format.number(practice.reviewCount)})
              </span>
            </span>
          </div>
          <h3 className="font-headline-sm text-headline-sm leading-snug text-on-surface transition-colors group-hover:text-primary">
            <Link href={`/practices/${practice.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {practice.title}
            </Link>
          </h3>
          <p className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{practice.summary}</p>
        </div>

        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/brand/elena-portrait.jpg"
              alt=""
              width={28}
              height={28}
              className="size-7 rounded-full object-cover shadow-sm"
            />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm font-semibold text-on-surface">{tBrand("instructor")}</span>
              <span className="font-label-sm text-label-sm text-outline">{t("leadGuide")}</span>
            </div>
          </div>
          <span
            aria-hidden
            className="inline-flex items-center gap-1 rounded-lg bg-surface-container-high px-3.5 py-2 font-label-sm text-label-sm text-on-surface transition-colors group-hover:bg-primary group-hover:text-on-primary"
          >
            {t("beginPractice")}
            <PlayIcon className="size-3.5 fill-current" />
          </span>
        </div>
      </div>
      <span className="pointer-events-none absolute inset-0 rounded-xl ring-primary group-has-[a:focus-visible]:ring-2" />
    </article>
  );
}
