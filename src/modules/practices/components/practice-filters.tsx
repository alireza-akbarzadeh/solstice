"use client";

import { ChevronDownIcon, RotateCcwIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { getPathname, Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { practiceFiltersToQuery } from "../filters";
import {
  durationRanges,
  intensityLevels,
  practiceCategories,
  propSetups,
  type PracticeFilters as Filters,
} from "../types";

type Props = {
  filters: Filters;
  shown: number;
  total: number;
};

export function PracticeFilters({ filters, shown, total }: Props) {
  const t = useTranslations("Practices");
  const tPractice = useTranslations("Practice");
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  // Any filter change resets to page 1.
  const hrefWith = (patch: Partial<Filters>) => `/practices${practiceFiltersToQuery({ ...filters, page: 1, ...patch })}`;
  const navigate = (patch: Partial<Filters>) =>
    startTransition(() => router.replace(hrefWith(patch), { scroll: false }));

  const activeCount = [filters.duration, filters.props, filters.intensity].filter(Boolean).length;
  const hasAnyFilter = activeCount > 0 || !!filters.category || !!filters.q;

  const selectClass =
    "cursor-pointer appearance-none rounded-lg bg-surface-container-high py-2 ps-3.5 pe-8 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-highest focus:ring-1 focus:ring-primary focus:outline-none";

  return (
    <div className={cn("space-y-6 transition-opacity", isPending && "opacity-70")} aria-busy={isPending}>
      <form
        role="search"
        action={getPathname({ href: "/practices", locale })}
        onSubmit={(e) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get("q");
          const q = typeof value === "string" ? value.trim() : "";
          navigate({ q: q === "" ? undefined : q });
        }}
        className="relative max-w-4xl"
      >
        <label htmlFor="library-search" className="sr-only">
          {t("searchLabel")}
        </label>
        <SearchIcon className="pointer-events-none absolute start-5 top-1/2 size-5 -translate-y-1/2 text-clay" />
        <input
          id="library-search"
          name="q"
          type="search"
          key={filters.q ?? ""}
          defaultValue={filters.q}
          placeholder={t("searchPlaceholder")}
          className="h-14 w-full rounded-xl bg-surface-container ps-14 pe-32 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
        <span className="absolute end-3.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg bg-surface-container-high/80 px-3 py-1.5 font-label-sm text-label-sm text-on-surface-variant">
          <SlidersHorizontalIcon className="size-3.5" />
          {t("activeFilters", { count: activeCount })}
        </span>
      </form>

      <nav aria-label={t("categoriesLabel")} className="-mx-margin-mobile overflow-x-auto px-margin-mobile pb-2 md:mx-0 md:px-0">
        <ul className="flex items-center gap-2">
          {[undefined, ...practiceCategories].map((category) => {
            const active = filters.category === category;
            return (
              <li key={category ?? "all"}>
                <Link
                  href={hrefWith({ category })}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-full px-4 py-2 font-label-md text-label-md whitespace-nowrap transition-all",
                    active
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-primary",
                  )}
                >
                  {category ? tPractice(`categories.${category}`) : t("allCategories")}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-container-low px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="me-1 font-label-sm text-label-sm font-bold tracking-wider text-clay uppercase">{t("refine")}</span>

          <div className="relative">
            <select
              aria-label={t("durationLabel")}
              value={filters.duration ?? ""}
              onChange={(e) => navigate({ duration: (e.target.value || undefined) as Filters["duration"] })}
              className={selectClass}
            >
              <option value="">{t("durationAll")}</option>
              {durationRanges.map((d) => (
                <option key={d} value={d}>
                  {t(`durations.${d}`)}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-outline" />
          </div>

          <div className="relative">
            <select
              aria-label={t("propsLabel")}
              value={filters.props ?? ""}
              onChange={(e) => navigate({ props: (e.target.value || undefined) as Filters["props"] })}
              className={selectClass}
            >
              <option value="">{t("propsAll")}</option>
              {propSetups.map((p) => (
                <option key={p} value={p}>
                  {tPractice(`props.${p}`)}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-outline" />
          </div>

          <div className="relative">
            <select
              aria-label={t("intensityLabel")}
              value={filters.intensity ?? ""}
              onChange={(e) => navigate({ intensity: (e.target.value || undefined) as Filters["intensity"] })}
              className={selectClass}
            >
              <option value="">{t("intensityAll")}</option>
              {intensityLevels.map((level) => (
                <option key={level} value={level}>
                  {t(`intensities.${level}`)}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-outline" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-body-sm text-body-sm text-outline" aria-live="polite">
            {t("showing", { shown, total })}
          </span>
          {hasAnyFilter && (
            <Link
              href="/practices"
              scroll={false}
              className="inline-flex items-center gap-1 font-label-md text-label-md text-clay transition-colors hover:text-primary"
            >
              <RotateCcwIcon className="size-3.5" />
              {t("reset")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
