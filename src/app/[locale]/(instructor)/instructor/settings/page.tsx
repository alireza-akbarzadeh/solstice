import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StudioCrumb } from "@/components/layout/studio-breadcrumb";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getStudioContact } from "@/modules/contact/server/contact";
import { ContactEditor } from "@/modules/instructor/components/contact-editor";
import { PaymentSettingsEditor } from "@/modules/instructor/components/payment-settings-editor";
import { StudioFilterPills } from "@/modules/instructor/components/studio-filter-pills";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { getVisitorCountry } from "@/modules/payments/server/country";
import { getPaymentSettingsView } from "@/modules/payments/server/settings";

const tabs = ["contact", "payments"] as const;
type Tab = (typeof tabs)[number];

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/settings">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.settings" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen. Two tabs: Contact (email, phone, address and social profiles, read by the
// footer and the About page) and Payments (gateways, modes, keys and routing by country).
export default async function StudioSettingsPage({ params, searchParams }: PageProps<"/[locale]/instructor/settings">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/settings");
  const query = await searchParams;
  const tab: Tab = tabs.includes(query.tab as Tab) ? (query.tab as Tab) : "contact";
  const t = await getTranslations("Studio.settings");
  const pills = (
    <StudioFilterPills
      basePath="/instructor/settings"
      param="tab"
      active={tab}
      options={tabs.map((value) => ({ value, label: t(`tabs.${value}`) }))}
    />
  );

  if (tab === "payments") {
    const [view, country] = await Promise.all([getPaymentSettingsView(), getVisitorCountry()]);
    return (
      <div className="flex flex-col gap-space-lg">
        <StudioCrumb items={[{ label: t("tabs.payments") }]} />
        <StudioPageHeader eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")} />
        {pills}
        <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
          <div className="xl:col-span-8">
            <PaymentSettingsEditor initial={view} country={country} />
          </div>
          <aside className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm xl:col-span-4">
            <h2 className="font-label-lg text-label-lg text-on-surface">{t("paymentsGuide.title")}</h2>
            <ol className="flex list-decimal flex-col gap-2 ps-5 font-body-sm text-body-sm text-on-surface-variant">
              <li>{t("paymentsGuide.prices")}</li>
              <li>{t("paymentsGuide.test")}</li>
              <li>{t("paymentsGuide.keys")}</li>
              <li>{t("paymentsGuide.choice")}</li>
            </ol>
            <Link
              href="/instructor/plans"
              className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary underline-offset-4 hover:underline"
            >
              {t("paymentsGuide.plansLink")}
            </Link>
          </aside>
        </div>
      </div>
    );
  }

  const contact = await getStudioContact();

  const places = [
    { href: "/#site-footer", title: t("where.footer"), body: t("where.footerBody") },
    { href: "/about#contact", title: t("where.about"), body: t("where.aboutBody") },
  ];

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioCrumb items={[]} />
      <StudioPageHeader eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")} />
      {pills}

      <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
        <div className="xl:col-span-8">
          <ContactEditor contact={contact} />
        </div>
        <aside className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm xl:col-span-4">
          <h2 className="font-label-lg text-label-lg text-on-surface">{t("where.title")}</h2>
          <ul className="flex flex-col gap-3">
            {places.map((place) => (
              <li key={place.href} className="rounded-lg bg-surface p-space-sm">
                <Link
                  href={place.href}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary underline-offset-4 hover:underline"
                >
                  {place.title}
                  <ExternalLinkIcon aria-hidden className="size-3.5" />
                </Link>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{place.body}</p>
              </li>
            ))}
          </ul>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("where.empty")}</p>
        </aside>
      </div>
    </div>
  );
}
