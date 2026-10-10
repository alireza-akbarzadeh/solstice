import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { requireUser } from "@/modules/memberships/server/viewer";
import { MilestonesDisplay } from "@/modules/milestones/components/milestones-display";
import { getMemberMilestones } from "@/modules/milestones/server/milestones";
import { getAllPracticeSummaries } from "@/modules/practices/server/get-practice";
import type { PracticeCategory } from "@/modules/practices/types";
import { ProgressOverview } from "@/modules/progress/components/progress-overview";
import { getCompletions } from "@/modules/progress/server/completions";
import { getProgram } from "@/modules/programs/server/get-program";
import { getEnrolledProgramSlugs, getProgramProgress } from "@/modules/programs/server/progress";
import { getCategoryName } from "@/modules/categories/server/names";

export async function generateMetadata({ params }: PageProps<"/[locale]/progress">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Progress" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen: totals, streaks, a practice calendar, programs and where the minutes went.
export default async function ProgressPage({ params }: PageProps<"/[locale]/progress">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const practiceCategory = await getCategoryName("practice");

  const viewer = await requireUser(locale, "/progress");
  const [t, tPractice, format, completions, library, programSlugs, milestonesData] = await Promise.all([
    getTranslations("Progress"),
    getTranslations("Practice"),
    getFormatter(),
    getCompletions(viewer.user.id),
    getAllPracticeSummaries(locale),
    getEnrolledProgramSlugs(viewer.user.id),
    getMemberMilestones(viewer.user.id),
  ]);

  const programs = (
    await Promise.all(
      programSlugs.map(async (slug) => {
        const program = await getProgram(locale, slug);
        return program ? { program, progress: await getProgramProgress(viewer.user.id, program) } : null;
      }),
    )
  ).filter((p) => p !== null);

  const categoryOf = new Map(library.map((p) => [p.slug, p.category]));
  const minutesByCategory = new Map<PracticeCategory, number>();
  for (const c of completions) {
    const category = categoryOf.get(c.practiceSlug);
    if (category) minutesByCategory.set(category, (minutesByCategory.get(category) ?? 0) + c.minutes);
  }
  const categories = [...minutesByCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxMinutes = categories[0]?.[1] ?? 1;

  return (
    <Container className="py-space-lg md:py-space-xl">
      <header className="mb-space-lg">
        <span className="font-label-md text-label-md tracking-widest text-clay uppercase">{t("eyebrow")}</span>
        <h1 className="mt-1 font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">{t("lede")}</p>
      </header>

      <ProgressOverview sessions={completions.map((c) => ({ at: c.completedAt.toISOString(), minutes: c.minutes }))} />

      <div className="mt-space-lg grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <section className="rounded-xl bg-surface-container-low p-space-md md:p-space-lg">
          <h2 className="mb-space-md font-headline-sm text-headline-sm text-on-surface">{t("programs.title")}</h2>
          {programs.length === 0 ? (
            <Link href="/programs" className="flex items-center justify-between gap-3 font-body-md text-body-md text-on-surface-variant hover:text-primary">
              {t("programs.empty")}
              <ArrowRightIcon className="size-4 shrink-0 rtl:rotate-180" />
            </Link>
          ) : (
            <ul className="space-y-space-md">
              {programs.map(({ program, progress }) => (
                <li key={program.slug}>
                  <Link href={`/programs/${program.slug}`} className="group block">
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="font-label-lg text-label-lg text-on-surface group-hover:text-primary">{program.title}</span>
                      <span className="font-label-md text-label-md text-primary">{format.number(progress.percent / 100, { style: "percent" })}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-variant">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} />
                    </div>
                    <p className="mt-1.5 font-body-sm text-body-sm text-on-surface-variant">
                      {t("programs.days", { done: progress.completed.length, total: program.totalDays })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl bg-surface-container-low p-space-md md:p-space-lg">
          <h2 className="mb-space-md font-headline-sm text-headline-sm text-on-surface">{t("categories.title")}</h2>
          {categories.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">{t("categories.empty")}</p>
          ) : (
            <ul className="space-y-3">
              {categories.map(([category, minutes]) => (
                <li key={category}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 font-label-md text-label-md">
                    <span className="text-on-surface">{practiceCategory(category)}</span>
                    <span className="text-on-surface-variant">{tPractice("minutes", { count: minutes })}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-variant">
                    <div className="h-full rounded-full bg-clay" style={{ width: `${Math.max(4, (minutes / maxMinutes) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <MilestonesDisplay
        locale={locale}
        milestones={milestonesData.milestones}
        unlockedCount={milestonesData.unlockedCount}
        totalCount={milestonesData.totalCount}
        recentUnlocked={milestonesData.recentUnlocked}
        nextMilestone={milestonesData.nextMilestone}
      />
    </Container>
  );
}
