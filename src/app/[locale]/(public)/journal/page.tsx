import { ArrowRightIcon, SearchIcon, SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Pagination } from "@/components/layout/pagination";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ArticleCard } from "@/modules/journal/components/article-card";
import { getJournal, journalFiltersToQuery, parseJournalFilters } from "@/modules/journal/server/get-articles";
import { journalCategories } from "@/modules/journal/types";
import { NewsletterForm } from "@/modules/newsletter/components/newsletter-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/journal">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Journal" });
  return { title: t("metaTitle"), description: t("lede") };
}

// Stitch: the-solstice-chronicle-editorial-journal.html
export default async function JournalPage({ params, searchParams }: PageProps<"/[locale]/journal">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const filters = parseJournalFilters(await searchParams);
  const [t, format, journal] = await Promise.all([getTranslations("Journal"), getFormatter(), getJournal(locale, filters)]);
  const featured = journal.featured;

  const pill = (active: boolean) =>
    cn(
      "shrink-0 rounded-full px-4 py-2 font-label-md text-label-md whitespace-nowrap transition-colors",
      active ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:text-on-surface",
    );

  return (
    <>
      <div className="relative w-full overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[340px] w-[720px] -translate-x-1/2 rounded-full bg-primary-fixed/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute end-12 top-48 size-[380px] rounded-full bg-secondary-fixed/20 blur-3xl" />

        <Container className="relative pt-space-xl pb-space-lg">
          <div className="max-w-4xl">
            <div className="mb-space-md inline-flex items-center gap-space-xs rounded-full bg-surface-container-high px-3 py-1 font-label-md text-label-md tracking-wider text-primary uppercase">
              <span className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
              {t("eyebrow")}
            </div>
            <h1 className="mb-space-md font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface md:font-headline-lg md:text-headline-lg lg:font-display lg:text-display">
              {t("title")}
            </h1>
            <p className="max-w-2xl font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{t("lede")}</p>
          </div>

          <div className="mt-space-xl flex flex-col items-stretch justify-between gap-space-md pb-space-md lg:flex-row lg:items-center">
            <form role="search" className="relative max-w-md flex-1">
              {filters.category && <input type="hidden" name="category" value={filters.category} />}
              <SearchIcon className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-outline" />
              <label htmlFor="journal-search" className="sr-only">
                {t("searchLabel")}
              </label>
              <input
                id="journal-search"
                name="q"
                type="search"
                defaultValue={filters.q}
                placeholder={t("searchPlaceholder")}
                className="h-12 w-full rounded-lg bg-surface-container-low ps-12 pe-4 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </form>
            <div className="hidden items-center gap-2 font-label-md text-label-md tracking-wider text-on-surface-variant uppercase xl:flex">
              <span className="inline-block size-2 rounded-full bg-surface-tint" />
              <span>{t("published", { count: journal.total })}</span>
            </div>
          </div>

          <nav aria-label={t("categoriesLabel")} className="flex items-center gap-space-xs overflow-x-auto pt-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href={`/journal${journalFiltersToQuery({ q: filters.q })}`} className={pill(!filters.category)} aria-current={!filters.category ? "page" : undefined}>
              {t("allCategories")}
            </Link>
            {journalCategories.map((category) => (
              <Link
                key={category}
                href={`/journal${journalFiltersToQuery({ q: filters.q, category })}`}
                className={pill(filters.category === category)}
                aria-current={filters.category === category ? "page" : undefined}
              >
                {t(`categories.${category}`)}
              </Link>
            ))}
          </nav>
        </Container>
      </div>

      {featured && (
        <Container className="my-space-lg">
          <article className="group relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl">
            <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-12">
              <div className="relative min-h-[340px] overflow-hidden lg:col-span-7">
                <Image
                  src={featured.image}
                  alt={featured.imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent lg:hidden" />
                <div className="absolute start-6 top-6 flex items-center gap-2">
                  <span className="rounded-full bg-surface-container-lowest/90 px-3 py-1.5 font-label-sm text-label-sm font-semibold text-primary backdrop-blur-md">
                    {featured.tags[0] ?? t(`categories.${featured.category}`)}
                  </span>
                  <span className="rounded-full bg-inverse-surface/80 px-3 py-1.5 font-label-sm text-label-sm text-inverse-on-surface backdrop-blur-md">
                    {t("issue", { issue: featured.issue })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-between bg-surface-container-lowest p-space-lg lg:col-span-5 lg:p-space-xl">
                <div>
                  <div className="mb-space-sm flex items-center gap-space-xs font-label-md text-label-md tracking-wider text-on-surface-variant uppercase">
                    <span className="text-tertiary">{t("featureEssay")}</span>
                    <span aria-hidden>•</span>
                    <span>{t("readTime", { minutes: featured.readMinutes })}</span>
                  </div>
                  <h2 className="mb-space-md font-headline-md text-headline-md leading-snug tracking-tight text-on-surface transition-colors group-hover:text-primary">
                    <Link href={`/journal/${featured.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                      {featured.title}
                    </Link>
                  </h2>
                  <p className="mb-space-lg font-body-md text-body-md leading-relaxed text-on-surface-variant">{featured.excerpt}</p>
                </div>
                <div className="flex flex-col justify-between gap-space-sm rounded-xl bg-surface-container-low/60 p-space-md sm:flex-row sm:items-center">
                  <div className="flex items-center gap-space-sm">
                    {featured.author.image && (
                      <Image src={featured.author.image} alt="" width={48} height={48} className="size-12 rounded-full object-cover shadow-sm" />
                    )}
                    <div>
                      <p className="font-label-lg text-label-lg text-on-surface">{featured.author.name}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {format.dateTime(featured.publishedAt, { dateStyle: "medium" })}
                      </p>
                    </div>
                  </div>
                  <span className="relative inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-label-md text-label-md text-on-primary transition-colors group-hover:bg-primary-container">
                    {t("readEssay")}
                    <ArrowRightIcon className="size-4 rtl:rotate-180" />
                  </span>
                </div>
              </div>
            </div>
          </article>
        </Container>
      )}

      <Container className="py-space-xl">
        <div className="mb-space-xl flex flex-col justify-between gap-space-sm md:flex-row md:items-end">
          <div>
            <span className="font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">{t("anthologyEyebrow")}</span>
            <h2 className="mt-1 font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
              {filters.category ? t(`categories.${filters.category}`) : t("anthologyTitle")}
            </h2>
          </div>
        </div>

        {journal.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-container-low p-space-xl text-center">
            <SearchXIcon className="size-8 text-outline" />
            <p className="font-headline-sm text-headline-sm text-on-surface">{t("emptyTitle")}</p>
            <Link href="/journal" className="font-label-md text-label-md text-primary underline-offset-4 hover:underline">
              {t("clear")}
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {journal.items.map((article) => (
              <li key={article.slug}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-space-2xl flex flex-col items-center justify-between gap-space-md pt-space-lg sm:flex-row">
          <Pagination
            page={journal.page}
            pageCount={journal.pageCount}
            hrefForPage={(page) => `/journal${journalFiltersToQuery({ ...filters, page })}`}
            labels={{
              nav: t("pagination"),
              previous: t("previous"),
              next: t("next"),
              page: (page) => t("pageLabel", { page }),
            }}
          />
          {journal.matching > 0 && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("showing", { from: journal.range.from, to: journal.range.to, count: journal.matching })}
            </p>
          )}
        </div>
      </Container>

      <Container className="my-space-xl">
        <figure className="relative overflow-hidden rounded-2xl bg-surface-container p-space-lg md:p-space-2xl">
          <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -end-8 -bottom-8 size-64 text-outline-variant/20" fill="currentColor">
            <path d="M100 0 C120 70 170 120 200 100 C130 120 120 170 100 200 C80 130 30 120 0 100 C70 80 80 30 100 0 Z" />
          </svg>
          <span className="mb-space-sm block font-label-sm text-label-sm tracking-widest text-surface-tint uppercase">{t("quote.eyebrow")}</span>
          <blockquote className="relative max-w-3xl font-headline-md text-headline-md leading-relaxed text-on-surface italic rtl:not-italic">
            {t("quote.text")}
          </blockquote>
          <figcaption className="mt-space-md font-label-md text-label-md tracking-wider text-on-surface-variant uppercase">{t("quote.source")}</figcaption>
        </figure>
      </Container>

      <Container className="mb-space-2xl">
        <section className="relative overflow-hidden rounded-2xl bg-primary p-space-lg text-on-primary shadow-xl md:p-space-2xl">
          <div aria-hidden className="pointer-events-none absolute -start-24 -top-24 size-80 rounded-full bg-primary-container/40 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -end-24 -bottom-24 size-96 rounded-full bg-primary-fixed/10 blur-3xl" />
          <div className="relative z-10 grid grid-cols-1 items-center gap-gutter lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="mb-space-sm inline-block rounded-full bg-on-primary/10 px-3 py-1 font-label-sm text-label-sm tracking-widest uppercase">
                {t("epistle.eyebrow")}
              </span>
              <h2 className="mb-space-sm font-headline-lg-mobile text-headline-lg-mobile leading-tight text-on-primary md:font-headline-lg md:text-headline-lg">
                {t("epistle.title")}
              </h2>
              <p className="max-w-xl font-body-md text-body-md leading-relaxed text-on-primary/80">{t("epistle.body")}</p>
            </div>
            <div className="lg:col-span-5">
              <NewsletterForm source="journal" tone="primary" />
              <p className="mt-space-xs text-center font-label-sm text-label-sm text-on-primary/60 sm:text-start">{t("epistle.note")}</p>
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}
