import { ReceiptTextIcon } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { paymentMoney } from "@/modules/memberships/components/billing-history";
import type { MembershipPlan } from "@/modules/memberships/plans";
import { getCollectedByMonth, listPayments } from "@/modules/memberships/server/billing";

import { ColumnChart, type ColumnPoint } from "./insight-charts";
import { RefundButton } from "./refund-button";

const MONTHS = 12;

/**
 * Money that actually arrived, from the payment ledger: collected per month (net of refunds),
 * the period's totals, and the latest payments with receipts and refunds. Sits beside the
 * projected MRR, which says what memberships are worth, not what was charged.
 */
export async function PaymentsLedger({ plans, currency }: { plans: MembershipPlan[]; currency: string }) {
  const [t, format, locale, months, recent] = await Promise.all([
    getTranslations("Studio.revenue.payments"),
    getFormatter(),
    getLocale(),
    getCollectedByMonth(MONTHS),
    listPayments(30),
  ]);
  const money = (amount: number, cur = currency) => paymentMoney(format, { currency: cur }, amount, locale);
  const planName = (id: string) => {
    const plan = plans.find((p) => p.id === id);
    return plan ? localize(plan.name, locale) : id;
  };

  // The chart is in the site currency; other currencies (from another provider) are listed under it.
  const keys = Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - (MONTHS - 1 - i));
    return d.toISOString().slice(0, 7);
  });
  const inSite = months.filter((m) => m.currency === currency);
  const points: ColumnPoint[] = keys.map((key) => {
    const row = inSite.find((m) => m.month === key);
    const net = row?.net ?? 0;
    return {
      label: format.dateTime(new Date(`${key}-01T00:00:00Z`), { month: "short", timeZone: "UTC" }),
      value: Math.max(0, net),
      display: money(net),
      detail: row ? t("chartDetail", { count: row.count, refunded: money(row.refunded) }) : undefined,
    };
  });
  const totals = new Map<string, { net: number; refunded: number; thisMonth: number }>();
  for (const m of months) {
    const total = totals.get(m.currency) ?? { net: 0, refunded: 0, thisMonth: 0 };
    total.net += m.net;
    total.refunded += m.refunded;
    if (m.month === keys.at(-1)) total.thisMonth += m.net;
    totals.set(m.currency, total);
  }
  const sum = (key: "net" | "refunded" | "thisMonth") =>
    totals.size === 0 ? money(0) : [...totals].map(([cur, total]) => money(total[key], cur)).join(" + ");

  return (
    <section className="flex flex-col gap-gutter">
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg lg:col-span-2">
          <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("eyebrow")}</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("title")}</h2>
          <p className="mb-space-md font-body-sm text-body-sm text-on-surface-variant">{t("note")}</p>
          <ColumnChart points={points} label={t("title")} maxLabels={6} />
        </div>
        <dl className="grid grid-cols-1 gap-3 rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
          {(
            [
              ["thisMonth", sum("thisMonth")],
              ["year", sum("net")],
              ["refunds", sum("refunded")],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="rounded-lg bg-surface p-space-sm">
              <dt className="font-label-sm text-label-sm text-on-surface-variant">{t(`totals.${key}`)}</dt>
              <dd className="font-headline-sm text-headline-sm text-on-surface">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
        <h3 className="mb-space-sm font-label-lg text-label-lg text-on-surface">{t("recent")}</h3>
        {recent.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("empty")}</p>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {recent.map((payment) => {
              const remaining = payment.amount - payment.refundedAmount;
              return (
                <li key={payment.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                  <div className="min-w-0">
                    {payment.userId ? (
                      <Link
                        href={`/instructor/members?member=${encodeURIComponent(payment.userId)}`}
                        dir="ltr"
                        className="block truncate font-label-lg text-label-lg text-on-surface hover:text-primary hover:underline"
                      >
                        {payment.email}
                      </Link>
                    ) : (
                      <span dir="ltr" className="block truncate font-label-lg text-label-lg text-on-surface">
                        {payment.email}
                      </span>
                    )}
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {format.dateTime(payment.createdAt, { dateStyle: "medium" })} · {planName(payment.planId)} · {t(`kind.${payment.kind}`)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-label-sm text-label-sm",
                        payment.status === "paid" ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container-high text-on-surface-variant",
                      )}
                    >
                      {t(`status.${payment.status}`)}
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface tabular-nums">{money(payment.amount, payment.currency)}</span>
                    <Link
                      href={`/profile/receipts/${payment.id}`}
                      aria-label={t("receiptFor", { email: payment.email })}
                      className="inline-flex size-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary"
                    >
                      <ReceiptTextIcon aria-hidden className="size-4" />
                    </Link>
                    {remaining > 0 && <RefundButton id={payment.id} amount={money(remaining, payment.currency)} email={payment.email} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
