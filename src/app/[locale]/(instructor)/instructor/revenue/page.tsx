import { CircleDollarSignIcon, HeartCrackIcon, ReceiptTextIcon, TrendingUpIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { paymentProvider } from "@/infrastructure/payment";
import { RevenueChart } from "@/modules/instructor/components/revenue-chart";
import { StatCard, StatMeter } from "@/modules/instructor/components/stat-card";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { getChurn, getLedger, getRevenueSeries } from "@/modules/instructor/server/revenue";
import { getMembershipCounts, projectRevenue } from "@/modules/instructor/server/studio";
import { billingPlans, sanctuaryPlan } from "@/modules/memberships/plans";
import { requireInstructor } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/revenue">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.revenue" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Stitch: studio-admin-transactions-revenue. Payments are still mocked, so every figure here
// is projected from membership records rather than read back from a payment provider.
export default async function StudioRevenuePage({ params }: PageProps<"/[locale]/instructor/revenue">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/revenue");
  const [t, format, counts, series, ledger, churn] = await Promise.all([
    getTranslations("Studio.revenue"),
    getFormatter(),
    getMembershipCounts(),
    getRevenueSeries(12),
    getLedger(60),
    getChurn(),
  ]);

  const revenue = projectRevenue(counts);
  const money = (n: number) => format.number(n, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const paying = counts.monthly + counts.annual;
  const lastMonth = series.at(-2)?.mrr ?? 0;
  const growth = lastMonth === 0 ? 0 : ((revenue.mrr - lastMonth) / lastMonth) * 100;

  const tiers = [
    { id: "monthly" as const, price: billingPlans.monthly.priceUsd, members: counts.monthly },
    { id: "annual" as const, price: billingPlans.annual.priceUsd, members: counts.annual },
  ];

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioPageHeader eyebrow={t("eyebrow")} title={t("title")} lede={t("lede", { mrr: money(revenue.mrr), paying })} />

      {paymentProvider.id === "mock" && (
        <Alert>
          <AlertTitle>{t("mockTitle")}</AlertTitle>
          <AlertDescription>{t("mockBody")}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.mrr")}
          value={money(revenue.mrr)}
          delta={growth !== 0 ? format.number(growth / 100, { style: "percent", maximumFractionDigits: 1 }) : undefined}
          note={t("stats.mrrNote")}
          icon={CircleDollarSignIcon}
        />
        <StatCard label={t("stats.arr")} value={money(revenue.arr)} note={t("stats.arrNote")} icon={TrendingUpIcon} />
        <StatCard
          label={t("stats.subscribers")}
          value={format.number(paying)}
          note={t("stats.subscribersNote", { trialing: counts.trialing })}
          icon={UsersIcon}
        >
          <StatMeter
            percent={paying + counts.trialing === 0 ? 0 : (paying / (paying + counts.trialing)) * 100}
            caption={t("stats.converted")}
          />
        </StatCard>
        <StatCard
          label={t("stats.churn")}
          value={format.number(churn.retentionPercent / 100, { style: "percent", maximumFractionDigits: 1 })}
          note={t("stats.churnNote", { canceled: churn.canceled, leaving: churn.leaving })}
          icon={HeartCrackIcon}
        />
      </div>

      <RevenueChart series={series} />

      <section className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        {tiers.map((tier) => (
          <div key={tier.id} className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
            <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t(`tiers.${tier.id}.label`)}</span>
            <p className="font-headline-md text-headline-md text-on-surface">
              {money(tier.price)}
              <span className="font-body-sm text-body-sm text-on-surface-variant"> / {t(`tiers.${tier.id}.interval`)}</span>
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t(`tiers.${tier.id}.body`)}</p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-space-sm">
              <Badge variant="outline">{t("tiers.members", { count: tier.members })}</Badge>
              <span className="font-label-md text-label-md text-primary">
                {t("tiers.contributes", { amount: money(tier.members * billingPlans[tier.id].monthlyEquivalentUsd) })}
              </span>
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
          <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("tiers.trial.label")}</span>
          <p className="font-headline-md text-headline-md text-on-surface">{t("tiers.trial.days", { count: sanctuaryPlan.trialDays })}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("tiers.trial.body")}</p>
          <div className="mt-auto pt-space-sm">
            <Badge variant="secondary">{t("tiers.members", { count: counts.trialing })}</Badge>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("ledger.title")}</h2>
          <Badge variant="outline">{t("ledger.count", { count: ledger.length })}</Badge>
        </div>

        {ledger.length === 0 ? (
          <Empty className="rounded-xl bg-surface-container-low">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptTextIcon />
              </EmptyMedia>
              <EmptyTitle className="font-headline-sm text-headline-sm">{t("ledger.emptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("ledger.emptyBody")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-hidden rounded-xl bg-surface-container-low shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-container hover:bg-surface-container">
                    <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">{t("ledger.member")}</TableHead>
                    <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">{t("ledger.plan")}</TableHead>
                    <TableHead className="hidden font-label-sm text-label-sm tracking-wider uppercase md:table-cell">{t("ledger.started")}</TableHead>
                    <TableHead className="hidden font-label-sm text-label-sm tracking-wider uppercase lg:table-cell">{t("ledger.paidThrough")}</TableHead>
                    <TableHead className="text-end font-label-sm text-label-sm tracking-wider uppercase">{t("ledger.amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Link href={`/instructor/members?member=${entry.userId}`} className="flex items-center gap-3 group">
                          <Avatar className="size-9 shrink-0">
                            <AvatarImage src={entry.image ?? undefined} alt="" />
                            <AvatarFallback className="font-label-sm text-label-sm">{entry.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="min-w-0">
                            <span className="block truncate font-label-lg text-label-lg text-on-surface group-hover:text-primary">{entry.name}</span>
                            <span className="block truncate font-body-sm text-body-sm text-on-surface-variant" dir="ltr">
                              {entry.email}
                            </span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant={entry.status === "active" ? "default" : entry.status === "past_due" ? "destructive" : "secondary"}>
                            {t(`ledger.states.${entry.status}`)}
                          </Badge>
                          <span className="font-label-sm text-label-sm text-outline">{t(`tiers.${entry.plan}.label`)}</span>
                          {entry.cancelAtPeriodEnd && entry.status !== "canceled" && (
                            <span className="font-label-sm text-label-sm text-outline">{t("ledger.leaving")}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden font-body-sm text-body-sm text-on-surface-variant md:table-cell">
                        {format.dateTime(entry.startedAt, { dateStyle: "medium" })}
                      </TableCell>
                      <TableCell className="hidden font-body-sm text-body-sm text-on-surface-variant lg:table-cell">
                        {format.dateTime(entry.currentPeriodEnd, { dateStyle: "medium" })}
                      </TableCell>
                      <TableCell className="text-end font-label-lg text-label-lg text-on-surface">
                        {entry.amountUsd === 0 ? <span className="text-outline">{t("ledger.free")}</span> : money(entry.amountUsd)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
