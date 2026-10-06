import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StudioCrumb } from "@/components/layout/studio-breadcrumb";
import { routing } from "@/i18n/routing";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { getAllPlans } from "@/modules/memberships/server/plans";
import { listCoupons } from "@/modules/promotions/server/coupons";
import { listStudioGifts } from "@/modules/promotions/server/gifts";
import { listStudioReferrals } from "@/modules/promotions/server/referrals";
import { StudioPromotionsView } from "@/modules/promotions/components/studio-promotions-view";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/instructor/promotions">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Promotions" });
  return { title: t("metaTitle") };
}

export default async function StudioPromotionsPage({
  params,
}: PageProps<"/[locale]/instructor/promotions">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireInstructor();

  const [t, coupons, gifts, referrals, plans] = await Promise.all([
    getTranslations({ locale, namespace: "Promotions" }),
    listCoupons(),
    listStudioGifts(),
    listStudioReferrals(),
    getAllPlans(),
  ]);

  return (
    <div className="space-y-6">
      <StudioCrumb items={[{ label: t("title") }]} />

      <div>
        <p className="font-label-md text-label-md tracking-widest text-clay uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
          {t("title")}
        </h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant max-w-2xl">
          {t("lede")}
        </p>
      </div>

      <StudioPromotionsView
        coupons={coupons}
        gifts={gifts}
        referrals={referrals}
        plans={plans}
      />
    </div>
  );
}
