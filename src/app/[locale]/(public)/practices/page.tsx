import { SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Pagination } from "@/components/layout/pagination";
import { routing } from "@/i18n/routing";
import { withNext } from "@/lib/safe-next";
import { LibraryUpsell } from "@/modules/memberships/components/library-upsell";
import { getViewer } from "@/modules/memberships/server/viewer";
import { LibraryAccessIndicator } from "@/modules/practices/components/library-access-indicator";
import { PracticeFilters } from "@/modules/practices/components/practice-filters";
import { PracticeLibraryCard } from "@/modules/practices/components/practice-library-card";
import { parsePracticeFilters, practiceFiltersToQuery } from "@/modules/practices/filters";
import { getPractices } from "@/modules/practices/server/get-practices";
import { getFavoriteSlugs } from "@/modules/progress/server/favorites";

export async function generateMetadata({ params }: PageProps<"/[locale]/practices">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Practices" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

// Stitch: practice-library-desktop.html (+ practice-library.html for mobile)
export default async function PracticesPage({ params, searchParams }: PageProps<"/[locale]/practices">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const filters = parsePracticeFilters(await searchParams);
  const [t, result, viewer] = await Promise.all([getTranslations("Practices"), getPractices(locale, filters), getViewer()]);
  const savedSlugs = new Set(viewer.user ? await getFavoriteSlugs(viewer.user.id) : []);
  const signInHref = viewer.user ? undefined : withNext("/sign-in", `/practices${practiceFiltersToQuery(filters)}`);

  return (
    <>
      <section className="relative w-full overflow-hidden pt-10 pb-12">
        <div aria-hidden className="pointer-events-none absolute end-12 -top-32 -z-10 size-96 rounded-full bg-secondary-fixed/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute start-1/4 top-24 -z-10 size-80 rounded-full bg-primary-fixed/30 blur-3xl" />
        <Container>
          <div className="mb-10 grid grid-cols-12 items-end gap-gutter">
            <div className="col-span-12 space-y-4 lg:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm tracking-widest text-clay uppercase">
                <span className="size-1.5 rounded-full bg-clay" />
                {t("eyebrow")}
              </div>
              <h1 className="font-display-mobile text-display-mobile leading-none tracking-tight text-primary md:font-display md:text-display">
                {t("titleLine1")}
                <br />
                <span className="font-normal text-clay italic rtl:not-italic">{t("titleLine2")}</span>
              </h1>
              <p className="max-w-2xl pt-2 font-body-lg text-body-lg text-on-surface-variant">{t("lede")}</p>
            </div>
            <div className="col-span-12 flex items-end pb-2 lg:col-span-4 lg:justify-end">
              <LibraryAccessIndicator open={result.library.open} total={result.library.total} />
            </div>
          </div>

          <PracticeFilters filters={filters} shown={result.items.length} total={result.total} />
        </Container>
      </section>

      <Container className="pb-16">
        {result.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {result.items.map((practice, i) => (
              <PracticeLibraryCard
                key={practice.slug}
                practice={practice}
                priority={i < 3}
                unlocked={viewer.hasAccess}
                saved={savedSlugs.has(practice.slug)}
                signInHref={signInHref}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-container-low px-6 py-space-2xl text-center">
            <SearchXIcon className="size-8 text-clay" />
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("emptyTitle")}</h2>
            <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t("emptyBody")}</p>
          </div>
        )}

        {result.pageCount > 1 && (
          <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-xl bg-surface-container-low px-8 py-6 shadow-sm sm:flex-row">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-label-sm text-label-sm font-semibold tracking-wider text-clay uppercase">{t("volume")}</span>
              <span className="font-body-sm text-body-sm text-on-surface">
                {t("pageSummary", { page: result.page, pages: result.pageCount, total: result.total })}
              </span>
            </div>
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              hrefForPage={(page) => `/practices${practiceFiltersToQuery({ ...filters, page })}`}
              labels={{
                nav: t("pagination"),
                previous: t("previous"),
                next: t("next"),
                page: (page) => t("pageLabel", { page }),
              }}
            />
          </div>
        )}
      </Container>

      {!viewer.hasAccess && (
        <Container className="pb-20">
          <LibraryUpsell openCount={result.library.open} />
        </Container>
      )}
    </>
  );
}
