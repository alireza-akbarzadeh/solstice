import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SparklesIcon } from "lucide-react";

import { Container } from "@/components/layout/container";
import { routing } from "@/i18n/routing";
import { getAllPlans } from "@/modules/memberships/server/plans";
import { getViewer } from "@/modules/memberships/server/viewer";
import { getPaymentMethods } from "@/modules/payments/server/routing";
import { GiftPurchaseForm } from "@/modules/promotions/components/gift-purchase-form";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/gift">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Promotions" });
  return {
    title: t("giftMetaTitle"),
    description: t("giftMetaDesc"),
  };
}

export default async function GiftPage({ params }: PageProps<"/[locale]/gift">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, viewer, plans, { methods }] = await Promise.all([
    getTranslations({ locale, namespace: "Promotions" }),
    getViewer(),
    getAllPlans(),
    getPaymentMethods(),
  ]);

  const activePlans = plans.filter((p) => p.status === "active");
  const monthlyPlan = activePlans.find((p) => p.intervalMonths === 1) ?? activePlans[0];
  const currency = methods[0]?.currency ?? "USD";

  if (!monthlyPlan) {
    notFound();
  }

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -end-24 -top-24 -z-10 size-96 rounded-full bg-secondary-fixed/40 blur-3xl"
      />

      <Container className="py-space-xl md:py-space-2xl">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed px-3 py-1 font-label-sm text-label-sm font-semibold text-on-secondary-fixed">
              <SparklesIcon className="size-3.5" />
              {t("giftBadge")}
            </span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
              {t("giftHeroTitle")}
            </h1>
            <p className="mx-auto max-w-xl font-body-lg text-body-lg text-on-surface-variant">
              {t("giftHeroDesc")}
            </p>
          </div>

          <GiftPurchaseForm
            plan={monthlyPlan}
            currency={currency}
            user={viewer.user}
          />
        </div>
      </Container>
    </div>
  );
}
