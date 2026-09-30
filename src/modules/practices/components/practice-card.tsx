import { PlayIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { PracticeCategory, PracticeSummary } from "../types";

const categoryTone: Record<PracticeCategory, string> = {
  morning: "text-primary",
  vinyasa: "text-primary",
  mobility: "text-primary",
  restorative: "text-tertiary",
  yin: "text-tertiary",
  pranayama: "text-clay",
  evening: "text-clay",
};

// Featured card used on the home page.
export async function PracticeCard({ practice }: { practice: PracticeSummary }) {
  const [t, tBrand] = await Promise.all([getTranslations("Practice"), getTranslations("Brand")]);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm transition-shadow duration-300 ease-sanctuary hover:shadow-bloom">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
        <Image
          src={practice.image}
          alt={practice.imageAlt}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-sanctuary group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <span className="absolute end-4 top-4 rounded-full bg-inverse-surface/75 px-3 py-1 font-label-sm text-label-sm text-inverse-on-surface backdrop-blur-sm">
          {t("minutes", { count: practice.durationMinutes })}
        </span>
        <span
          className={cn(
            "absolute start-4 bottom-4 rounded-full bg-surface/90 px-3 py-1 font-label-sm text-label-sm font-semibold tracking-wider uppercase backdrop-blur-sm",
            categoryTone[practice.category],
          )}
        >
          {t(`categories.${practice.category}`)}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2 font-label-sm text-label-sm tracking-wider text-clay uppercase">
            <span>{practice.series}</span>
            <span className="rounded bg-secondary-fixed/50 px-2 py-0.5 text-on-secondary-fixed">{practice.intensity.label}</span>
          </div>
          <h3 className="mb-3 font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">
            {/* The title link covers the whole card. */}
            <Link href={`/practices/${practice.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {practice.title}
            </Link>
          </h3>
          <p className="mb-6 line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{practice.summary}</p>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/brand/elena-portrait.jpg"
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-full object-cover"
            />
            <span className="font-label-sm text-label-sm font-medium text-on-surface">{tBrand("instructor")}</span>
          </div>
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-full bg-surface-container-high text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-on-primary"
          >
            <PlayIcon className="size-4 fill-current" />
          </span>
        </div>
      </div>
      {/* Focus ring for the stretched title link. */}
      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-primary group-has-[a:focus-visible]:ring-2" />
    </article>
  );
}
