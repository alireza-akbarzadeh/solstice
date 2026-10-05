import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { routing } from "@/i18n/routing";
import { safeNextPath } from "@/lib/safe-next";
import { Checkout, type CheckoutMethod } from "@/modules/memberships/components/checkout";
import { MembershipStatus } from "@/modules/memberships/components/membership-status";
import { getPlanDisplay } from "@/modules/memberships/server/plan-display";
import { getViewer } from "@/modules/memberships/server/viewer";
import { getPaymentMethods } from "@/modules/payments/server/routing";
import { IRAN } from "@/modules/payments/types";

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
  const [t, tBrand, viewer, { methods, country }] = await Promise.all([
    getTranslations("Membership"),
    getTranslations("Brand"),
    getViewer(),
    getPaymentMethods(),
  ]);

  if (viewer.hasAccess) {
    return (
      <Container className="py-space-2xl">
        <MembershipStatus viewer={viewer} next={next} />
      </Container>
    );
  }

  // Each switched-on gateway with the plans it can sell, priced in its currency. The first is
  // the one preselected for the visitor's country; the visitor can still switch.
  const offers: CheckoutMethod[] = [];
  for (const method of methods) {
    const { catalog, money, describe } = await getPlanDisplay(locale, method.currency);
    if (!catalog.plans.length) continue;
    offers.push({
      gateway: method.gateway,
      cards: method.cards,
      zero: money(0),
      featured: catalog.featured?.id ?? null,
      plans: catalog.plans.map(describe),
      testMode: method.provider.testMode,
    });
  }
  if (!offers.length) {
    return (
      <Container className="py-space-2xl">
        <div className="mx-auto max-w-xl rounded-2xl bg-surface-container-low p-space-lg text-center">
          <h1 className="font-headline-md text-headline-md text-primary">{t("noPlansTitle")}</h1>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{t("noPlansBody")}</p>
        </div>
      </Container>
    );
  }
  // A method named in the link (coming back from sign-up or the provider) wins, if it sells the plan.
  const initial =
    offers.find((o) => o.gateway === query.method && (!query.plan || o.plans.some((p) => p.id === query.plan))) ??
    offers.find((o) => o.plans.some((p) => p.id === query.plan)) ??
    offers[0]!;
  const requested = initial.plans.find((plan) => plan.id === query.plan);
  const featured = initial.plans.find((plan) => plan.id === initial.featured);
  const initialPlan = (requested ?? featured ?? initial.plans[0]!).id;
  const trialDays = (requested ?? featured)?.trialDays ?? 0;

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
          methods={offers}
          initialMethod={initial.gateway}
          initialPlan={initialPlan}
          suggestedFromIran={country === IRAN && initial === offers[0]}
          next={next}
          signedIn={!!viewer.user}
          instructorName={tBrand("instructor")}
        />
      </Container>
    </div>
  );
}
