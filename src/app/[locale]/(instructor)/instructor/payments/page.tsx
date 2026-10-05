import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StudioCrumb } from "@/components/layout/studio-breadcrumb";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { PaymentSettingsEditor } from "@/modules/instructor/components/payment-settings-editor";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { getVisitorCountry } from "@/modules/payments/server/country";
import { getPaymentSettingsView } from "@/modules/payments/server/settings";

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/payments">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.payments" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen. Which gateways take payments (Zarinpal, Stripe), in which mode, with
// which keys, and which one visitors from Iran and from elsewhere see first.
export default async function StudioPaymentsPage({ params }: PageProps<"/[locale]/instructor/payments">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/payments");
  const [t, view, country] = await Promise.all([getTranslations("Studio.payments"), getPaymentSettingsView(), getVisitorCountry()]);

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioCrumb items={[]} />
      <StudioPageHeader eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")} />

      <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
        <div className="xl:col-span-8">
          <PaymentSettingsEditor initial={view} country={country} />
        </div>
        <aside className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm xl:col-span-4">
          <h2 className="font-label-lg text-label-lg text-on-surface">{t("guide.title")}</h2>
          <ol className="flex list-decimal flex-col gap-2 ps-5 font-body-sm text-body-sm text-on-surface-variant">
            <li>{t("guide.prices")}</li>
            <li>{t("guide.test")}</li>
            <li>{t("guide.keys")}</li>
            <li>{t("guide.choice")}</li>
          </ol>
          <Link
            href="/instructor/plans"
            className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary underline-offset-4 hover:underline"
          >
            {t("guide.plansLink")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
