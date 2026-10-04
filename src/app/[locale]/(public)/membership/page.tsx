import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { routing } from "@/i18n/routing";
import { getCheckoutProvider } from "@/infrastructure/payment";
import { safeNextPath } from "@/lib/safe-next";
import { Checkout } from "@/modules/memberships/components/checkout";
import { MembershipStatus } from "@/modules/memberships/components/membership-status";
import { getPlanDisplay } from "@/modules/memberships/server/plan-display";
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
  const [t, tBrand, viewer, provider] = await Promise.all([getTranslations("Membership"), getTranslations("Brand"), getViewer(), getCheckoutProvider()]);

  if (viewer.hasAccess) {
    return (
      <Container className="py-space-2xl">
        <MembershipStatus viewer={viewer} next={next} />
      </Container>
    );
  }

  const { catalog, money, describe } = await getPlanDisplay(locale);
  if (!catalog.plans.length) {
    return (
      <Container className="py-space-2xl">
        <div className="mx-auto max-w-xl rounded-2xl bg-surface-container-low p-space-lg text-center">
          <h1 className="font-headline-md text-headline-md text-primary">{t("noPlansTitle")}</h1>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{t("noPlansBody")}</p>
        </div>
      </Container>
    );
  }
  const requested = catalog.plans.find((plan) => plan.id === query.plan);
  const initialPlan = (requested ?? catalog.featured ?? catalog.plans[0]!).id;
  const trialDays = (requested ?? catalog.featured)?.trialDays ?? 0;

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
          {trialDays > 0 && (
            <span className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <span className="size-1.5 rounded-full bg-primary" />
              {t("ribbon", { days: trialDays })}
            </span>
          )}
        </div>

        <Checkout
          plans={catalog.plans.map(describe)}
          initialPlan={initialPlan}
          next={next}
          zero={money(0)}
          signedIn={!!viewer.user}
          testMode={provider.testMode}
          instructorName={tBrand("instructor")}
        />
      </Container>
    </div>
  );
}
