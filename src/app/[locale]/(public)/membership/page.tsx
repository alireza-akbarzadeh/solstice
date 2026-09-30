import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { routing } from "@/i18n/routing";
import { paymentProvider } from "@/infrastructure/payment";
import { safeNextPath } from "@/lib/safe-next";
import { Checkout } from "@/modules/memberships/components/checkout";
import { MembershipStatus } from "@/modules/memberships/components/membership-status";
import { billingPlans, isBillingPlan, sanctuaryPlan } from "@/modules/memberships/plans";
import { getViewer } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/membership">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Membership" });
  return { title: t("metaTitle"), description: t("lede") };
}

// Stitch: sanctuary-checkout-pricing-desktop.html (+ sanctuary-checkout-access-pass.html)
export default async function MembershipPage({ params, searchParams }: PageProps<"/[locale]/membership">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const query = await searchParams;
  const next = safeNextPath(query.next, "/practices");
  const [t, tBrand, format, viewer] = await Promise.all([
    getTranslations("Membership"),
    getTranslations("Brand"),
    getFormatter(),
    getViewer(),
  ]);

  if (viewer.hasAccess) {
    return (
      <Container className="py-space-2xl">
        <MembershipStatus viewer={viewer} next={next} />
      </Container>
    );
  }

  const usd = (value: number, fractionDigits = 0) =>
    format.number(value, { style: "currency", currency: "USD", minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -end-24 -top-24 -z-10 size-96 rounded-full bg-secondary-fixed/40 blur-3xl" />
      <Container className="py-space-lg md:py-space-xl">
        <div className="mb-space-lg flex flex-col justify-between gap-4 rounded-xl bg-surface-container-low px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary font-heading text-lg text-on-primary">S</span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">
                {viewer.user ? t("stepMember") : t("stepGuest")}
              </span>
              <span className="font-label-lg text-label-lg text-on-surface">{t("invitation")}</span>
            </div>
          </div>
          <span className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <span className="size-1.5 rounded-full bg-primary" />
            {t("ribbon", { days: sanctuaryPlan.trialDays })}
          </span>
        </div>

        <Checkout
          initialPlan={isBillingPlan(query.plan) ? query.plan : "annual"}
          next={next}
          prices={{
            annual: usd(billingPlans.annual.priceUsd),
            annualPerMonth: usd(billingPlans.annual.monthlyEquivalentUsd, 2),
            monthly: usd(billingPlans.monthly.priceUsd, 2),
            zero: usd(0, 2),
          }}
          trialDays={sanctuaryPlan.trialDays}
          signedIn={!!viewer.user}
          testMode={paymentProvider.testMode}
          instructorName={tBrand("instructor")}
        />
      </Container>
    </div>
  );
}
