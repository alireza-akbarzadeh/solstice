import { BookmarkIcon, CheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { requireUser } from "@/modules/memberships/server/viewer";
import { PracticeLibraryCard } from "@/modules/practices/components/practice-library-card";
import { getAllPracticeSummaries, getPracticeSummaries } from "@/modules/practices/server/get-practice";
import { getCompletions } from "@/modules/progress/server/completions";
import { getFavoriteSlugs } from "@/modules/progress/server/favorites";
import { getPrograms } from "@/modules/programs/server/get-program";

const HISTORY_LENGTH = 12;

export async function generateMetadata({ params }: PageProps<"/[locale]/my-practices">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "MyPractices" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen: saved practices in the library card style, and recent sessions.
export default async function MyPracticesPage({ params }: PageProps<"/[locale]/my-practices">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await requireUser(locale, "/my-practices");
  const [t, tPractice, format, favorites, completions, library, programs] = await Promise.all([
    getTranslations("MyPractices"),
    getTranslations("Practice"),
    getFormatter(),
    getFavoriteSlugs(viewer.user.id),
    getCompletions(viewer.user.id),
    getAllPracticeSummaries(locale),
    getPrograms(locale),
  ]);
  const saved = await getPracticeSummaries(locale, favorites);
  const bySlug = new Map(library.map((p) => [p.slug, p]));
  const programTitle = new Map(programs.map((p) => [p.slug, p.title]));
  const history = completions.slice(0, HISTORY_LENGTH);

  return (
    <Container className="py-space-lg md:py-space-xl">
      <header className="mb-space-lg">
        <span className="font-label-md text-label-md tracking-widest text-clay uppercase">{t("eyebrow")}</span>
        <h1 className="mt-1 font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
          {t("title")}
        </h1>
      </header>

      <section aria-labelledby="saved-title" className="mb-space-2xl">
        <div className="mb-space-md flex items-baseline justify-between gap-3">
          <h2 id="saved-title" className="font-headline-sm text-headline-sm text-on-surface">
            {t("saved.title")}
          </h2>
          <span className="font-label-md text-label-md text-on-surface-variant">{t("saved.count", { count: saved.length })}</span>
        </div>
        {saved.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-container-low p-space-xl text-center">
            <BookmarkIcon className="size-8 text-outline" />
            <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t("saved.empty")}</p>
            <Link href="/practices" className="rounded-lg bg-primary px-5 py-2.5 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container">
              {t("saved.browse")}
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {saved.map((practice) => (
              <li key={practice.slug}>
                <PracticeLibraryCard practice={practice} unlocked={viewer.hasAccess} saved />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="history-title">
        <h2 id="history-title" className="mb-space-md font-headline-sm text-headline-sm text-on-surface">
          {t("history.title")}
        </h2>
        {history.length === 0 ? (
          <p className="rounded-xl bg-surface-container-low p-space-lg font-body-md text-body-md text-on-surface-variant">{t("history.empty")}</p>
        ) : (
          <ol className="divide-y divide-hairline overflow-hidden rounded-xl bg-surface-container-low">
            {history.map((entry) => {
              const practice = bySlug.get(entry.practiceSlug);
              if (!practice) return null;
              return (
                <li key={`${entry.practiceSlug}-${entry.completedAt.toISOString()}`}>
                  <Link href={`/practices/${practice.slug}`} className="flex items-center gap-4 p-3 transition-colors hover:bg-surface-container">
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md">
                      <Image src={practice.image} alt="" fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-lg text-label-lg text-on-surface">{practice.title}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {tPractice("minutes", { count: entry.minutes })}
                        {entry.programSlug && programTitle.has(entry.programSlug) && (
                          <> · {t("history.programDay", { program: programTitle.get(entry.programSlug)!, day: entry.programDay ?? 0 })}</>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-on-surface-variant">
                      <time dateTime={entry.completedAt.toISOString()} className="hidden font-label-sm text-label-sm sm:block">
                        {format.relativeTime(entry.completedAt)}
                      </time>
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary-fixed text-primary">
                        <CheckIcon className="size-4" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </Container>
  );
}
