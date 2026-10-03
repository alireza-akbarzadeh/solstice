import {
  CircleDollarSignIcon,
  HeartCrackIcon,
  ReceiptTextIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { paymentProvider } from "@/infrastructure/payment";
import { RevenueChart } from "@/modules/instructor/components/revenue-chart";
import { StatCard, StatMeter } from "@/modules/instructor/components/stat-card";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import {
  getChurn,
  getLedger,
  getRevenueSeries,
} from "@/modules/instructor/server/revenue";
import {
  getMembershipCounts,
  projectRevenue,
} from "@/modules/instructor/server/studio";
import { localize } from "@/lib/localized";
import { formatMoney, monthlyEquivalent } from "@/modules/memberships/plans";
import { getPlanDisplay } from "@/modules/memberships/server/plan-display";
import { getAllPlans } from "@/modules/memberships/server/plans";
import { requireInstructor } from "@/modules/memberships/server/viewer";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/instructor/revenue">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.revenue" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Stitch: studio-admin-transactions-revenue. Payments are still mocked, so every figure here
// is projected from membership records rather than read back from a payment provider.
export default async function StudioRevenuePage({
  params,
}: PageProps<"/[locale]/instructor/revenue">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/revenue");
  const [t, format, counts, series, ledger, churn, plans, display] = await Promise.all([
    getTranslations("Studio.revenue"),
    getFormatter(),
    getMembershipCounts(),
    getRevenueSeries(12),
    getLedger(60),
    getChurn(),
    getAllPlans(),
    getPlanDisplay(locale),
  ]);

  const revenue = projectRevenue(counts, plans);
  // Projections are whole amounts; plan prices keep their cents.
  const money = (n: number) => formatMoney(format, Math.round(n), display.catalog.currency, locale);
  const planName = (id: string) => {
    const plan = plans.find((p) => p.id === id);
    return plan ? localize(plan.name, locale) : id;
  };
  const paying = counts.paying;
  const lastMonth = series.at(-2)?.mrr ?? 0;
  const growth =
    lastMonth === 0 ? 0 : ((revenue.mrr - lastMonth) / lastMonth) * 100;

  // Every plan on sale, plus hidden plans that still have paying members.
  const tiers = plans
    .filter((plan) => plan.status === "active" || (counts.byPlan[plan.id] ?? 0) > 0)
    .map((plan) => ({ plan, members: counts.byPlan[plan.id] ?? 0 }));

  return (
    <div className="gap-space-lg flex flex-col">
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede", { mrr: money(revenue.mrr), paying })}
      />

      {paymentProvider.id === "mock" && (
        <Alert>
          <AlertTitle>{t("mockTitle")}</AlertTitle>
          <AlertDescription>{t("mockBody")}</AlertDescription>
        </Alert>
      )}

      <div className="gap-space-md grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.mrr")}
          value={money(revenue.mrr)}
          delta={
            growth !== 0
              ? format.number(growth / 100, {
                  style: "percent",
                  maximumFractionDigits: 1,
                })
              : undefined
          }
          note={t("stats.mrrNote")}
          icon={CircleDollarSignIcon}
        />
        <StatCard
          label={t("stats.arr")}
          value={money(revenue.arr)}
          note={t("stats.arrNote")}
          icon={TrendingUpIcon}
        />
        <StatCard
          label={t("stats.subscribers")}
          value={format.number(paying)}
          note={t("stats.subscribersNote", { trialing: counts.trialing })}
          icon={UsersIcon}
        >
          <StatMeter
            percent={
              paying + counts.trialing === 0
                ? 0
                : (paying / (paying + counts.trialing)) * 100
            }
            caption={t("stats.converted")}
          />
        </StatCard>
        <StatCard
          label={t("stats.churn")}
          value={format.number(churn.retentionPercent / 100, {
            style: "percent",
            maximumFractionDigits: 1,
          })}
          note={t("stats.churnNote", {
            canceled: churn.canceled,
            leaving: churn.leaving,
          })}
          icon={HeartCrackIcon}
        />
      </div>

      <RevenueChart series={series} />

      <section className="gap-gutter grid grid-cols-1 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.plan.id}
            className="gap-space-xs bg-surface-container-low p-space-md md:p-space-lg flex flex-col rounded-xl shadow-sm"
          >
            <span className="font-label-sm text-label-sm text-clay tracking-widest uppercase">
              {localize(tier.plan.name, locale)}
            </span>
            <p className="font-headline-md text-headline-md text-on-surface">
              {display.money(tier.plan.price)}
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {" "}
                {display.per(tier.plan.intervalMonths)}
              </span>
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {tier.plan.status === "hidden" ? t("tiers.hidden") : display.describe(tier.plan).billing}
            </p>
            <div className="pt-space-sm mt-auto flex items-center justify-between gap-2">
              <Badge variant="outline">
                {t("tiers.members", { count: tier.members })}
              </Badge>
              <span className="font-label-md text-label-md text-primary">
                {t("tiers.contributes", {
                  amount: money(
                    tier.members * monthlyEquivalent(tier.plan),
                  ),
                })}
              </span>
            </div>
          </div>
        ))}

        <div className="gap-space-xs bg-surface-container-low p-space-md md:p-space-lg flex flex-col rounded-xl shadow-sm">
          <span className="font-label-sm text-label-sm text-clay tracking-widest uppercase">
            {t("tiers.trial.label")}
          </span>
          <p className="font-headline-md text-headline-md text-on-surface">
            {t("tiers.trial.days", { count: display.catalog.trialDays })}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("tiers.trial.body")}
          </p>
          <div className="pt-space-sm mt-auto">
            <Badge variant="secondary">
              {t("tiers.members", { count: counts.trialing })}
            </Badge>
          </div>
        </div>
      </section>

      <section className="gap-space-md flex flex-col">
        <div className="gap-space-sm flex flex-wrap items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {t("ledger.title")}
          </h2>
          <Badge variant="outline">
            {t("ledger.count", { count: ledger.length })}
          </Badge>
        </div>

        {ledger.length === 0 ? (
          <Empty className="bg-surface-container-low rounded-xl">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptTextIcon />
              </EmptyMedia>
              <EmptyTitle className="font-headline-sm text-headline-sm">
                {t("ledger.emptyTitle")}
              </EmptyTitle>
              <EmptyDescription>{t("ledger.emptyBody")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {/* Phones get cards; the ledger's five columns only scroll sideways at this width. */}
            <ul className="gap-space-sm flex flex-col lg:hidden">
              {ledger.map((entry) => (
                <li
                  key={entry.id}
                  className="bg-surface-container-low p-space-md rounded-xl shadow-sm"
                >
                  <Link
                    href={`/instructor/members?member=${entry.userId}`}
                    className="group flex items-start gap-3"
                  >
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage src={entry.image ?? undefined} alt="" />
                      <AvatarFallback className="font-label-sm text-label-sm">
                        {entry.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="font-label-lg text-label-lg text-on-surface group-hover:text-primary block truncate">
                        {entry.name}
                      </span>
                      <span
                        className="font-body-sm text-body-sm text-on-surface-variant block truncate"
                        dir="ltr"
                      >
                        {entry.email}
                      </span>
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface shrink-0">
                      {entry.amount === 0 ? (
                        <span className="text-outline">{t("ledger.free")}</span>
                      ) : (
                        money(entry.amount)
                      )}
                    </span>
                  </Link>

                  <div className="mt-space-sm border-hairline pt-space-sm flex flex-wrap items-center gap-1.5 border-t">
                    <Badge
                      variant={
                        entry.status === "active"
                          ? "default"
                          : entry.status === "past_due"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {t(`ledger.states.${entry.status}`)}
                    </Badge>
                    <Badge variant="outline">
                      {planName(entry.plan)}
                    </Badge>
                    <span className="font-label-sm text-label-sm text-outline ms-auto">
                      {t("ledger.paidThrough")}{" "}
                      {format.dateTime(entry.currentPeriodEnd, {
                        dateStyle: "medium",
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="bg-surface-container-low hidden overflow-hidden rounded-xl shadow-sm lg:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-container hover:bg-surface-container">
                      <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">
                        {t("ledger.member")}
                      </TableHead>
                      <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">
                        {t("ledger.plan")}
                      </TableHead>
                      <TableHead className="font-label-sm text-label-sm hidden tracking-wider uppercase md:table-cell">
                        {t("ledger.started")}
                      </TableHead>
                      <TableHead className="font-label-sm text-label-sm hidden tracking-wider uppercase lg:table-cell">
                        {t("ledger.paidThrough")}
                      </TableHead>
                      <TableHead className="font-label-sm text-label-sm text-end tracking-wider uppercase">
                        {t("ledger.amount")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Link
                            href={`/instructor/members?member=${entry.userId}`}
                            className="group flex items-center gap-3"
                          >
                            <Avatar className="size-9 shrink-0">
                              <AvatarImage
                                src={entry.image ?? undefined}
                                alt=""
                              />
                              <AvatarFallback className="font-label-sm text-label-sm">
                                {entry.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="min-w-0">
                              <span className="font-label-lg text-label-lg text-on-surface group-hover:text-primary block truncate">
                                {entry.name}
                              </span>
                              <span
                                className="font-body-sm text-body-sm text-on-surface-variant block truncate"
                                dir="ltr"
                              >
                                {entry.email}
                              </span>
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <Badge
                              variant={
                                entry.status === "active"
                                  ? "default"
                                  : entry.status === "past_due"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {t(`ledger.states.${entry.status}`)}
                            </Badge>
                            <span className="font-label-sm text-label-sm text-outline">
                              {planName(entry.plan)}
                            </span>
                            {entry.cancelAtPeriodEnd &&
                              entry.status !== "canceled" && (
                                <span className="font-label-sm text-label-sm text-outline">
                                  {t("ledger.leaving")}
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="font-body-sm text-body-sm text-on-surface-variant hidden md:table-cell">
                          {format.dateTime(entry.startedAt, {
                            dateStyle: "medium",
                          })}
                        </TableCell>
                        <TableCell className="font-body-sm text-body-sm text-on-surface-variant hidden lg:table-cell">
                          {format.dateTime(entry.currentPeriodEnd, {
                            dateStyle: "medium",
                          })}
                        </TableCell>
                        <TableCell className="font-label-lg text-label-lg text-on-surface text-end">
                          {entry.amount === 0 ? (
                            <span className="text-outline">
                              {t("ledger.free")}
                            </span>
                          ) : (
                            money(entry.amount)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
