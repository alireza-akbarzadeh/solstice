import { ArrowLeftIcon, FlaskConicalIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { providerFor } from "@/infrastructure/payment";
import { localize } from "@/lib/localized";
import { getStudioContact } from "@/modules/contact/server/contact";
import { PrintButton } from "@/modules/journal/components/reading-tools";
import { paymentMoney } from "@/modules/memberships/components/billing-history";
import { getPayment } from "@/modules/memberships/server/billing";
import { getAllPlans } from "@/modules/memberships/server/plans";
import { requireUser } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/profile/receipts/[id]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Profile.receipt" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// A printable receipt for one payment. Members see their own; the instructor sees any (from Revenue).
export default async function ReceiptPage({ params }: PageProps<"/[locale]/profile/receipts/[id]">) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await requireUser(locale, `/profile/receipts/${id}`);
  const payment = /^\d+$/.test(id) ? await getPayment(Number(id)) : null;
  if (!payment || (payment.userId !== viewer.user.id && viewer.user.role !== "instructor")) notFound();

  const [t, tBrand, format, contact, plans] = await Promise.all([
    getTranslations("Profile.receipt"),
    getTranslations("Brand"),
    getFormatter(),
    getStudioContact(),
    getAllPlans(),
  ]);
  const plan = plans.find((p) => p.id === payment.planId);
  const money = (amount: number) => paymentMoney(format, payment, amount, locale);
  const date = (value: Date) => format.dateTime(value, { dateStyle: "long" });
  const net = payment.amount - payment.refundedAmount;
  const address = contact.address[locale];

  const rows: [string, string][] = [
    [t("number"), `#${String(payment.id).padStart(6, "0")}`],
    [t("date"), date(payment.createdAt)],
    [t("billedTo"), payment.email],
    [t("item"), `${plan ? localize(plan.name, locale) : payment.planId} · ${t(`kind.${payment.kind}`)}`],
    [t("period"), t("periodRange", { start: date(payment.periodStart), end: date(payment.periodEnd) })],
    [t("reference"), payment.providerPaymentId],
  ];

  return (
    <Container className="py-space-xl">
      <div className="mx-auto mb-space-md flex max-w-2xl items-center justify-between gap-3 print:hidden">
        <Link href="/profile" className="inline-flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant hover:text-primary">
          <ArrowLeftIcon aria-hidden className="size-4 rtl:rotate-180" />
          {t("back")}
        </Link>
        <PrintButton
          label={t("print")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container"
        />
      </div>

      <article data-print-root className="mx-auto max-w-2xl rounded-2xl bg-surface-container-lowest p-space-lg shadow-ambient print:shadow-none md:p-space-xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant/40 pb-space-md">
          <div>
            <p className="font-headline-sm text-headline-sm text-primary">
              {tBrand("name")} {tBrand("studio")}
            </p>
            {address && <p className="mt-1 font-body-sm text-body-sm whitespace-pre-line text-on-surface-variant">{address}</p>}
            {contact.email && (
              <p dir="ltr" className="font-body-sm text-body-sm text-on-surface-variant rtl:text-end">
                {contact.email}
              </p>
            )}
          </div>
          <div className="text-end">
            <h1 className="font-label-md text-label-md tracking-widest text-clay uppercase">{t("title")}</h1>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{t(`status.${payment.status}`)}</p>
          </div>
        </header>

        {providerFor(payment.provider)?.testMode && (
          <p className="mt-space-md flex items-center gap-2 rounded-lg bg-secondary-container/60 p-space-sm font-body-sm text-body-sm text-on-surface">
            <FlaskConicalIcon aria-hidden className="size-4 shrink-0 text-clay" />
            {t("testNote")}
          </p>
        )}

        <dl className="mt-space-md divide-y divide-outline-variant/30 font-body-sm text-body-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-2.5">
              <dt className="text-on-surface-variant">{label}</dt>
              <dd className="break-all text-on-surface">{value}</dd>
            </div>
          ))}
        </dl>

        <dl className="mt-space-md space-y-2 rounded-xl bg-surface-container-low p-space-md font-body-md text-body-md">
          <div className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">{t("amount")}</dt>
            <dd className="text-on-surface tabular-nums">{money(payment.amount)}</dd>
          </div>
          {payment.refundedAmount > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">
                {t("refunded")}
                {payment.refundedAt && <span className="text-outline"> · {date(payment.refundedAt)}</span>}
              </dt>
              <dd className="text-on-surface tabular-nums">−{money(payment.refundedAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-outline-variant/40 pt-2 font-label-lg text-label-lg">
            <dt className="text-on-surface">{t("total")}</dt>
            <dd className="text-primary tabular-nums">{money(net)}</dd>
          </div>
        </dl>
        <p className="mt-space-md font-body-sm text-body-sm text-outline">{t("footer")}</p>
      </article>
    </Container>
  );
}
