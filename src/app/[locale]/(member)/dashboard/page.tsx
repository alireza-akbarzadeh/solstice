import { ArrowRightIcon, ChevronRightIcon, CircleAlertIcon, PlayIcon, SunriseIcon, TimerIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ArticleCard } from "@/modules/journal/components/article-card";
import { getJournal } from "@/modules/journal/server/get-articles";
import { RenewalNotice } from "@/modules/memberships/components/renewal-notice";
import { renewsByHand } from "@/modules/memberships/server/memberships";
import { requireUser } from "@/modules/memberships/server/viewer";
import { getAllPracticeSummaries } from "@/modules/practices/server/get-practice";
import type { PracticeSummary } from "@/modules/practices/types";
import { SaveButton } from "@/modules/progress/components/practice-actions";
import { Greeting, WeekRhythm } from "@/modules/progress/components/rhythm";
import { getCompletions } from "@/modules/progress/server/completions";
import { getFavoriteSlugs } from "@/modules/progress/server/favorites";
import { findProgramDay, getProgram } from "@/modules/programs/server/get-program";
import { getEnrolledProgramSlugs, getProgramProgress } from "@/modules/programs/server/progress";
import { getCategoryName } from "@/modules/categories/server/names";
import { getMemberOnboarding } from "@/modules/onboarding/server/onboarding";
import { DashboardCuratedRhythm } from "@/modules/onboarding/components/dashboard-curated-rhythm";

const DAY = 24 * 60 * 60 * 1000;

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Stitch: today-sanctuary.html (mobile), widened into two columns on desktop.
export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const practiceCategory = await getCategoryName("practice");

  const viewer = await requireUser(locale, "/dashboard");
  const userId = viewer.user.id;
  const [t, tPractice, format, completions, favorites, programSlugs, library, journal, onboarding] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("Practice"),
    getFormatter(),
    getCompletions(userId),
    getFavoriteSlugs(userId),
    getEnrolledProgramSlugs(userId),
    getAllPracticeSummaries(locale),
    getJournal(locale, { page: 1 }),
    getMemberOnboarding(userId),
  ]);

  // Programs the member follows, with where they are in each.
  const programs = (
    await Promise.all(
      programSlugs.map(async (slug) => {
        const program = await getProgram(locale, slug);
        if (!program) return null;
        const progress = await getProgramProgress(userId, program);
        return { program, progress, current: progress.current === null ? null : findProgramDay(program, progress.current) };
      }),
    )
  ).filter((p) => p !== null);

  // What to practice now: today's program day, else a saved practice, else something new.
  const recent = new Set(completions.filter((c) => Date.now() - c.completedAt.getTime() < 7 * DAY).map((c) => c.practiceSlug));
  const bySlug = new Map(library.map((p) => [p.slug, p]));
  const playable = (p: PracticeSummary) => p.access === "open" || viewer.hasAccess;
  const activeProgram = programs.find((p) => p.current);
  const savedPick = favorites.map((s) => bySlug.get(s)).find((p): p is PracticeSummary => !!p && playable(p) && !recent.has(p.slug));
  const freshPick = library.find((p) => playable(p) && !recent.has(p.slug)) ?? library[0]!;
  const hero = activeProgram?.current
    ? {
        practice: activeProgram.current.practice,
        href: `/practices/${activeProgram.current.practice.slug}?program=${activeProgram.program.slug}&day=${activeProgram.current.day}`,
        badge: t("hero.programDay", { day: activeProgram.current.day, total: activeProgram.program.totalDays, program: activeProgram.program.title }),
        cta: activeProgram.progress.completed.length === 0 ? t("hero.begin") : t("hero.resume"),
        percent: activeProgram.progress.percent,
      }
    : {
        practice: savedPick ?? freshPick,
        href: `/practices/${(savedPick ?? freshPick).slug}`,
        badge: savedPick ? t("hero.saved") : t("hero.suggested"),
        cta: t("hero.start"),
        percent: null,
      };

  const suggestions = [...library]
    .filter((p) => p.slug !== hero.practice.slug && !recent.has(p.slug))
    .sort((a, b) => Number(playable(b)) - Number(playable(a)))
    .slice(0, 4);
  const saved = new Set(favorites);
  const membership = viewer.membership;
  const firstName = viewer.user.name.split(/\s+/)[0] ?? viewer.user.name;

  return (
    <Container className="py-space-lg md:py-space-xl">
      <section className="mb-space-lg flex flex-col gap-space-xs">
        <span className="inline-flex items-center gap-space-xs self-start rounded-full bg-surface-container px-3 py-1 text-on-surface-variant">
          <SunriseIcon className="size-4 text-clay" />
          <span className="font-label-sm text-label-sm tracking-wide">{format.dateTime(new Date(), { dateStyle: "full" })}</span>
        </span>
        <h1 className="pt-space-xs font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface md:font-headline-lg md:text-headline-lg">
          <Greeting name={firstName} />
        </h1>
        <p className="font-body-md text-body-md font-light text-on-surface-variant italic rtl:not-italic">{t("intention")}</p>
      </section>

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
        <div className="flex flex-col gap-space-lg lg:col-span-8">
          <RenewalNotice viewer={viewer} back="/dashboard" />
          {!viewer.hasAccess && (
            <div role="note" className="flex flex-col gap-3 rounded-xl bg-secondary-fixed/50 p-space-md sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <CircleAlertIcon className="mt-0.5 size-5 shrink-0 text-on-secondary-fixed-variant" />
                <div>
                  <p className="font-label-lg text-label-lg text-on-secondary-fixed">
                    {membership?.status === "past_due" ? t("notice.pastDueTitle") : membership ? t("notice.endedTitle") : t("notice.freeTitle")}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant">{t("notice.body")}</p>
                </div>
              </div>
              <Link
                href="/membership"
                className="shrink-0 rounded-lg bg-primary px-4 py-2 text-center font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container"
              >
                {membership ? t("notice.renew") : t("notice.join")}
              </Link>
            </div>
          )}

          <DashboardCuratedRhythm onboarding={onboarding} library={library} />

          <section className="overflow-hidden rounded-xl bg-surface-container-low shadow-sm">
            <Link href={hero.href} className="group block">
              <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/8]">
                <Image
                  src={hero.practice.image}
                  alt={hero.practice.imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 860px, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/10 to-transparent" />
                <span className="absolute start-3 top-3 rounded-full bg-surface-container-lowest/90 px-2.5 py-1 font-label-sm text-label-sm font-semibold tracking-wider text-primary uppercase backdrop-blur-sm">
                  {hero.badge}
                </span>
                <span className="absolute end-3 top-3 flex items-center gap-1 rounded-full bg-inverse-surface/60 px-2.5 py-1 font-label-sm text-label-sm text-inverse-on-surface backdrop-blur-sm">
                  <TimerIcon className="size-3.5" />
                  {tPractice("minutes", { count: hero.practice.durationMinutes })}
                </span>
                <div className="absolute inset-x-3 bottom-3 text-inverse-on-surface md:inset-x-5 md:bottom-5">
                  <span className="font-label-md text-label-md tracking-wider text-secondary-fixed uppercase opacity-90">
                    {practiceCategory(hero.practice.category)}
                  </span>
                  <h2 className="font-headline-sm text-headline-sm leading-snug md:font-headline-md md:text-headline-md">{hero.practice.title}</h2>
                </div>
              </div>
              <div className="flex flex-col gap-space-sm p-space-md">
                <p className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{hero.practice.summary}</p>
                {hero.percent !== null && (
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>{t("hero.progress", { percent: hero.percent / 100 })}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                      <div className="h-full rounded-full bg-primary-container" style={{ width: `${hero.percent}%` }} />
                    </div>
                  </div>
                )}
                <span className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-container text-on-primary shadow-sm transition-colors group-hover:bg-primary">
                  <PlayIcon className="size-5 fill-current" />
                  <span className="font-label-lg text-label-lg tracking-wide">{hero.cta}</span>
                </span>
              </div>
            </Link>
          </section>

          <section className="flex flex-col gap-space-xs">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("suggestions.title")}</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{t("suggestions.body")}</p>
              </div>
              <Link href="/practices" className="flex shrink-0 items-center gap-0.5 font-label-md text-label-md text-clay hover:underline">
                {t("suggestions.explore")}
                <ChevronRightIcon className="size-4 rtl:rotate-180" />
              </Link>
            </div>
            <ul className="-mx-margin-mobile flex snap-x gap-space-sm overflow-x-auto px-margin-mobile pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
              {suggestions.map((practice) => (
                <li
                  key={practice.slug}
                  className="group relative flex max-w-[260px] min-w-[240px] snap-start flex-col overflow-hidden rounded-xl bg-surface-container-low shadow-sm md:max-w-none md:min-w-0"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={practice.image}
                      alt=""
                      fill
                      sizes="260px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                    />
                    <div className="absolute end-2.5 top-2.5">
                      <SaveButton practiceSlug={practice.slug} saved={saved.has(practice.slug)} variant="icon" />
                    </div>
                    <span className="absolute start-2.5 bottom-2.5 rounded-full bg-inverse-surface/70 px-2 py-0.5 font-label-sm text-label-sm text-inverse-on-surface">
                      {tPractice("minutes", { count: practice.durationMinutes })}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-2 p-3.5">
                    <div>
                      <span className="font-label-sm text-label-sm tracking-wider text-primary uppercase">{practiceCategory(practice.category)}</span>
                      <h3 className="mt-0.5 line-clamp-2 font-headline-sm text-[1.1rem] leading-tight text-on-surface">
                        <Link href={`/practices/${practice.slug}`} className="after:absolute after:inset-0">
                          {practice.title}
                        </Link>
                      </h3>
                    </div>
                    <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>{practice.intensity.label}</span>
                      {!playable(practice) && <span className="font-medium text-clay">{tPractice("membersOnly")}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-space-lg lg:col-span-4">
          <section className="flex flex-col gap-space-xs">
            <div className="flex items-baseline justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("rhythm.title")}</h2>
              <Link href="/progress" className="font-label-sm text-label-sm tracking-widest text-clay uppercase hover:underline">
                {t("rhythm.more")}
              </Link>
            </div>
            <WeekRhythm completedAt={completions.slice(0, 60).map((c) => c.completedAt.toISOString())} />
          </section>

          <section className="flex flex-col gap-space-xs">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("programs.title")}</h2>
            {programs.length === 0 ? (
              <Link href="/programs" className="group flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-space-md transition-colors hover:bg-surface-container">
                <span className="font-body-sm text-body-sm text-on-surface-variant">{t("programs.empty")}</span>
                <ArrowRightIcon className="size-4 shrink-0 text-primary rtl:rotate-180" />
              </Link>
            ) : (
              <ul className="flex flex-col gap-2">
                {programs.map(({ program, progress }) => (
                  <li key={program.slug}>
                    <Link href={`/programs/${program.slug}`} className="block rounded-xl bg-surface-container-low p-space-md transition-colors hover:bg-surface-container">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-label-lg text-label-lg text-on-surface">{program.title}</span>
                        <span className="font-label-sm text-label-sm text-primary">{format.number(progress.percent / 100, { style: "percent" })}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                        <div className={cn("h-full rounded-full bg-primary")} style={{ width: `${progress.percent}%` }} />
                      </div>
                      <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
                        {t("programs.days", { done: progress.completed.length, total: program.totalDays })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {membership && viewer.hasAccess && (
            <section className="rounded-xl bg-surface-container-low p-space-md">
              <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("membership.eyebrow")}</span>
              <p className="mt-1 font-body-sm text-body-sm text-on-surface">
                {renewsByHand(membership)
                  ? t("membership.paidThrough", { date: format.dateTime(membership.currentPeriodEnd, { dateStyle: "long" }) })
                  : membership.cancelAtPeriodEnd
                  ? t("membership.ends", { date: format.dateTime(membership.currentPeriodEnd, { dateStyle: "long" }) })
                  : membership.status === "trialing"
                    ? t("membership.trial", { date: format.dateTime(membership.currentPeriodEnd, { dateStyle: "long" }) })
                    : t("membership.renews", { date: format.dateTime(membership.currentPeriodEnd, { dateStyle: "long" }) })}
              </p>
              <Link href="/profile" className="mt-2 inline-block font-label-md text-label-md text-primary hover:underline">
                {t("membership.manage")}
              </Link>
            </section>
          )}

          {journal.featured && (
            <section className="flex flex-col gap-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("journal")}</h2>
              <ArticleCard article={journal.featured} />
            </section>
          )}
        </aside>
      </div>
    </Container>
  );
}
