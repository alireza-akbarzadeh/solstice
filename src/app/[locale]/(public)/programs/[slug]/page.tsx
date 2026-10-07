import { ArrowRightIcon, CalendarDaysIcon, FlameIcon, Flower2Icon, LeafIcon, PlayCircleIcon, RotateCcwIcon, TimerIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { ProgramCourseJsonLd } from "@/components/seo/json-ld";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getViewer } from "@/modules/memberships/server/viewer";
import { enrollInProgram, restartProgram } from "@/modules/programs/actions";
import { ProgramSyllabus } from "@/modules/programs/components/program-syllabus";
import { findProgramDay, getProgram } from "@/modules/programs/server/get-program";
import { countEnrollments, getProgramProgress } from "@/modules/programs/server/progress";

const DAY = 24 * 60 * 60 * 1000;

export async function generateMetadata({ params }: PageProps<"/[locale]/programs/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const program = await getProgram(locale, slug);
  if (!program) return {};
  return {
    title: program.title,
    description: program.description,
    openGraph: { title: program.title, description: program.description, images: [program.image] },
  };
}

// Stitch: 30-day-awakening-immersion-hub-desktop.html
export default async function ProgramPage({ params }: PageProps<"/[locale]/programs/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const program = await getProgram(locale, slug);
  if (!program) notFound();

  const [t, viewer, practitioners] = await Promise.all([getTranslations("Program"), getViewer(), countEnrollments(program.slug)]);
  const progress = await getProgramProgress(viewer.user?.id ?? null, program);
  const current = progress.current === null ? null : findProgramDay(program, progress.current);
  const next = progress.current === null ? null : findProgramDay(program, progress.current + 1);
  const daysUntilNext = progress.nextUnlockAt ? Math.max(1, Math.ceil((progress.nextUnlockAt.getTime() - Date.now()) / DAY)) : null;
  const finished = progress.enrolled && progress.completed.length === program.totalDays;
  const currentHref = current ? `/practices/${current.practice.slug}?program=${program.slug}&day=${current.day}` : null;

  return (
    <>
      <ProgramCourseJsonLd program={program} />
      <section className="relative w-full overflow-hidden bg-surface-container-low">
        <div aria-hidden className="pointer-events-none absolute end-0 -top-32 size-[580px] rounded-full bg-secondary-fixed/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -start-20 top-1/2 size-[420px] rounded-full bg-primary-fixed/20 blur-3xl" />
        <Container className="relative z-10 pt-space-xl pb-space-2xl">
          <div className="mb-space-md flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-surface-container-highest/60 px-3.5 py-1.5 text-primary">
              <span className="inline-block size-2 rounded-full bg-primary motion-safe:animate-pulse" />
              <span className="font-label-md text-label-md tracking-widest text-on-surface-variant uppercase">
                {t(program.pacing === "daily" ? "pulseDaily" : "pulseSelf", { days: program.totalDays })}
              </span>
            </div>
            {practitioners > 0 && (
              <div className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
                <LeafIcon className="size-4 text-clay" />
                <span>{t("practitioners", { count: practitioners })}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
            <div className="flex flex-col space-y-space-md lg:col-span-8">
              <h1 className="max-w-4xl font-display-mobile text-display-mobile leading-[1.08] tracking-tight text-primary md:font-display md:text-display">
                {program.heroTitle}
              </h1>
              <p className="max-w-2xl font-body-lg text-body-lg font-light text-on-surface-variant">{program.lede}</p>

              <div className="flex flex-wrap items-center gap-4 pt-space-sm">
                {progress.enrolled ? (
                  currentHref && current ? (
                    <Link
                      href={currentHref}
                      className="inline-flex items-center gap-3 rounded-lg bg-primary px-7 py-3.5 font-label-lg text-label-lg text-on-primary shadow-sm transition-all hover:-translate-y-px hover:bg-primary-container"
                    >
                      <PlayCircleIcon className="size-5" />
                      {progress.completed.length === 0 ? t("start", { day: current.day }) : t("resume", { day: current.day })}
                    </Link>
                  ) : (
                    <a
                      href="#syllabus"
                      className="inline-flex items-center gap-3 rounded-lg bg-primary px-7 py-3.5 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container"
                    >
                      <CalendarDaysIcon className="size-5" />
                      {finished ? t("revisit") : t("waiting")}
                    </a>
                  )
                ) : (
                  <form action={enrollInProgram}>
                    <input type="hidden" name="program" value={program.slug} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-3 rounded-lg bg-primary px-7 py-3.5 font-label-lg text-label-lg text-on-primary shadow-sm transition-all hover:-translate-y-px hover:bg-primary-container"
                    >
                      <PlayCircleIcon className="size-5" />
                      {viewer.hasAccess ? t("enroll") : t("enrollWithMembership")}
                    </button>
                  </form>
                )}
                <a
                  href="#syllabus"
                  className="inline-flex items-center gap-2.5 rounded-lg bg-surface px-6 py-3.5 font-label-lg text-label-lg text-on-surface shadow-sm transition-colors hover:bg-surface-container"
                >
                  <Flower2Icon className="size-4 text-clay" />
                  {t("viewSyllabus")}
                </a>
              </div>
              {!progress.enrolled && !viewer.hasAccess && (
                <p className="font-label-sm text-label-sm tracking-wider text-outline uppercase">{program.note}</p>
              )}
            </div>

            <aside className="relative mt-2 flex flex-col justify-between overflow-hidden rounded-xl bg-surface p-space-lg shadow-sm lg:col-span-4 lg:mt-0">
              {progress.enrolled ? (
                <>
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">{t("card.eyebrow")}</span>
                      <span className="mt-0.5 font-headline-sm text-headline-sm text-on-surface">
                        {t("card.completed", { done: progress.completed.length, total: program.totalDays })}
                      </span>
                    </div>
                    <span className="flex size-12 items-center justify-center rounded-full bg-secondary-container/60 text-on-secondary-container">
                      <Flower2Icon className="size-6" />
                    </span>
                  </div>
                  <div className="my-space-md rounded-lg bg-surface-container-low p-space-md">
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="font-label-md text-label-md font-medium text-on-surface-variant">{t("card.progress")}</span>
                      <span className="font-headline-sm text-headline-sm text-primary">{t("card.percent", { percent: progress.percent / 100 })}</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress.percent}
                      className="h-2 w-full overflow-hidden rounded-full bg-surface-variant"
                    >
                      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${progress.percent}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 font-body-sm text-body-sm text-on-surface-variant">
                      <span className="flex items-center gap-1.5">
                        <FlameIcon className="size-4 text-tertiary-container" />
                        {t("card.streak", { count: progress.streak })}
                      </span>
                      {next && program.pacing === "daily" && (
                        <span className="font-medium text-clay">{t("card.tomorrow", { title: next.practice.title })}</span>
                      )}
                    </div>
                  </div>
                  {current && currentHref ? (
                    <Link href={currentHref} className="group flex items-center justify-between gap-3 pt-2">
                      <span>
                        <span className="block font-label-sm text-label-sm text-outline uppercase">{t("card.next")}</span>
                        <span className="font-label-lg text-label-lg font-semibold text-primary">
                          {t("card.nextDay", { day: current.day, title: current.practice.title, minutes: current.practice.durationMinutes })}
                        </span>
                      </span>
                      <ArrowRightIcon className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </Link>
                  ) : (
                    <p className="pt-2 font-body-sm text-body-sm text-on-surface-variant">
                      {finished ? t("card.finished") : t("card.restDay", { count: daysUntilNext ?? 1 })}
                    </p>
                  )}
                  <form action={restartProgram} className="mt-4">
                    <input type="hidden" name="program" value={program.slug} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-outline underline-offset-4 transition-colors hover:text-primary hover:underline"
                    >
                      <RotateCcwIcon className="size-3.5" />
                      {t("card.restart")}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <span className="font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">{t("facts.eyebrow")}</span>
                  <ul className="mt-4 space-y-4">
                    <li className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
                        <CalendarDaysIcon className="size-4" />
                      </span>
                      <span className="font-body-md text-body-md text-on-surface">{t("facts.days", { count: program.totalDays })}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
                        <TimerIcon className="size-4" />
                      </span>
                      <span className="font-body-md text-body-md text-on-surface">
                        {t("facts.minutes", { min: program.minutes.min, max: program.minutes.max })}
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
                        <UsersIcon className="size-4" />
                      </span>
                      <span className="font-body-md text-body-md text-on-surface">{t(program.pacing === "daily" ? "facts.daily" : "facts.self")}</span>
                    </li>
                  </ul>
                  <p className="mt-6 rounded-lg bg-surface-container-low p-4 font-body-sm text-body-sm text-on-surface-variant">{program.description}</p>
                </>
              )}
            </aside>
          </div>
        </Container>
      </section>

      <section id="syllabus" className="scroll-mt-24">
        <Container className="py-space-2xl">
          <div className="mb-space-xl flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="mb-2 block font-label-md text-label-md tracking-widest text-clay uppercase">{t("syllabus.eyebrow")}</span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">
                {t("syllabus.title", { count: program.weeks.length })}
              </h2>
            </div>
            <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
              {t(program.pacing === "daily" ? "syllabus.bodyDaily" : "syllabus.bodySelf")}
            </p>
          </div>
          <ProgramSyllabus
            programSlug={program.slug}
            weeks={program.weeks}
            progress={{
              enrolled: progress.enrolled,
              completed: progress.completed,
              unlockedThrough: progress.unlockedThrough,
              current: progress.current,
              daysUntilNext,
            }}
          />
        </Container>
      </section>
    </>
  );
}
