import { ArrowRightIcon, BadgeCheckIcon, CircleDollarSignIcon, Flower2Icon, MegaphoneIcon, MessagesSquareIcon, TimerIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { StatBars, StatCard, StatMeter } from "@/modules/instructor/components/stat-card";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { getLibrarySummary } from "@/modules/instructor/server/content";
import { getRevenueSeries } from "@/modules/instructor/server/revenue";
import { getStudioOverview } from "@/modules/instructor/server/studio";
import { requireInstructor } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.overview" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Stitch: the welcome panel and metric bento shared by the studio-admin-* screens.
export default async function StudioOverviewPage({ params }: PageProps<"/[locale]/instructor">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await requireInstructor(locale, "/instructor");
  const [t, format, overview, library, series] = await Promise.all([
    getTranslations("Studio.overview"),
    getFormatter(),
    getStudioOverview(),
    getLibrarySummary(),
    getRevenueSeries(6),
  ]);

  const money = (n: number) => format.number(n, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const paying = overview.counts.monthly + overview.counts.annual;
  const firstName = viewer.user.name.split(" ")[0] ?? viewer.user.name;

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title", { name: firstName })}
        lede={t("lede", { accounts: overview.accounts, sessions: overview.sessions7d })}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/instructor/videos">
                <Flower2Icon data-icon="inline-start" />
                {t("actions.publish")}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/instructor/posts">
                <MegaphoneIcon data-icon="inline-start" />
                {t("actions.announce")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/instructor/members">
                <UsersIcon data-icon="inline-start" />
                {t("actions.members")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.practitioners")}
          value={format.number(overview.accounts)}
          delta={overview.newAccounts > 0 ? t("stats.newAccounts", { count: overview.newAccounts }) : undefined}
          note={t("stats.paying", { count: paying })}
          hint={overview.counts.trialing > 0 ? t("stats.trialing", { count: overview.counts.trialing }) : undefined}
          icon={UsersIcon}
        >
          <StatBars values={series.map((m) => m.active)} />
        </StatCard>

        <StatCard
          label={t("stats.revenue")}
          value={money(overview.revenue.mrr)}
          delta={t("stats.perYear", { amount: money(overview.revenue.arr) })}
          note={t("stats.projected")}
          hint={t("stats.mock")}
          icon={CircleDollarSignIcon}
        >
          <StatBars values={series.map((m) => m.mrr)} />
        </StatCard>

        <StatCard
          label={t("stats.minutes")}
          value={format.number(overview.minutes7d)}
          delta={t("stats.sessions", { count: overview.sessions7d })}
          note={t("stats.lastSevenDays")}
          icon={TimerIcon}
        >
          <StatMeter
            percent={library.total === 0 ? 0 : (library.published / library.total) * 100}
            caption={t("stats.publishedOf", { published: library.published, total: library.total })}
          />
        </StatCard>

        <StatCard
          label={t("stats.reflections")}
          value={format.number(overview.reflections7d)}
          delta={overview.awaiting > 0 ? t("stats.awaiting", { count: overview.awaiting }) : undefined}
          note={t("stats.lastSevenDays")}
          icon={MessagesSquareIcon}
        >
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/instructor/community">
              {t("stats.openQueue")}
              <ArrowRightIcon data-icon="inline-end" className="rtl:rotate-180" />
            </Link>
          </Button>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-3">
        <section className="rounded-xl bg-surface-container-low p-space-md shadow-sm lg:col-span-2 md:p-space-lg">
          <div className="mb-space-md flex items-center justify-between gap-3">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("arrivals.title")}</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/instructor/members">
                {t("arrivals.all")}
                <ArrowRightIcon data-icon="inline-end" className="rtl:rotate-180" />
              </Link>
            </Button>
          </div>
          {overview.recent.length === 0 ? (
            <Empty className="border-0 bg-transparent">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle className="font-headline-sm text-headline-sm">{t("arrivals.emptyTitle")}</EmptyTitle>
                <EmptyDescription>{t("arrivals.emptyBody")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {overview.recent.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface p-space-sm shadow-sm">
                  <div className="min-w-0">
                    <p className="truncate font-label-lg text-label-lg text-on-surface">{member.name}</p>
                    <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{member.email}</p>
                  </div>
                  <span className="shrink-0 font-label-sm text-label-sm text-outline">
                    {format.relativeTime(member.createdAt, new Date())}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
          <h2 className="mb-space-md font-headline-sm text-headline-sm text-on-surface">{t("library.title")}</h2>
          <dl className="flex flex-col gap-2.5">
            {(
              [
                ["published", library.published],
                ["drafts", library.drafts],
                ["membersOnly", library.membersOnly],
                ["missingVideo", library.missingVideo],
                ["minutes", library.minutes],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-3 border-b border-hairline pb-2 last:border-0 last:pb-0">
                <dt className="font-body-sm text-body-sm text-on-surface-variant">{t(`library.${key}`)}</dt>
                <dd className="font-label-lg text-label-lg text-on-surface">{format.number(value)}</dd>
              </div>
            ))}
          </dl>
          {library.missingVideo > 0 ? (
            <Button asChild variant="secondary" size="sm" className="mt-space-md w-full">
              <Link href="/instructor/videos">
                {t("library.attach")}
                <ArrowRightIcon data-icon="inline-end" className="rtl:rotate-180" />
              </Link>
            </Button>
          ) : (
            <Badge variant="secondary" className="mt-space-md gap-1.5">
              <BadgeCheckIcon />
              {t("library.complete")}
            </Badge>
          )}
        </section>
      </div>
    </div>
  );
}
