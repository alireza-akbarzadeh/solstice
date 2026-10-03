import { CircleAlertIcon, FlaskConicalIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { withNext } from "@/lib/safe-next";
import { TestCheckoutForm } from "@/modules/memberships/components/test-checkout-form";
import { localize } from "@/lib/localized";
import { getPlanDisplay } from "@/modules/memberships/server/plan-display";
import { sameSiteUrl, testCards, testModeEnabled } from "@/modules/memberships/server/test-mode";
import { getViewer } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout/test">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "TestMode.checkout" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// The mock PaymentProvider's hosted checkout: pay with a test card, no money moves.
export default async function TestCheckoutPage({ params, searchParams }: PageProps<"/[locale]/checkout/test">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  if (!testModeEnabled()) notFound();

  const query = await searchParams;
  const { catalog, money, per } = await getPlanDisplay(locale);
  const plan = catalog.plans.find((p) => p.id === query.plan);
  const success = sameSiteUrl(query.success);
  const cancel = sameSiteUrl(query.cancel);
  if (!plan || !success || !cancel) return redirect({ href: "/membership", locale });

  const viewer = await getViewer();
  if (!viewer.user) return redirect({ href: withNext("/sign-in", "/membership"), locale });

  const t = await getTranslations("TestMode.checkout");
  const price = money(plan.price);
  const period = per(plan.intervalMonths);
  const hasTrial = plan.trialDays > 0;
  const error = query.error === "declined" || query.error === "unknownCard" ? query.error : null;

  return (
    <Container className="py-8 md:py-12">
      <div className="mx-auto flex max-w-md flex-col gap-6 rounded-2xl bg-surface-container-lowest p-6 shadow-ambient md:p-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-headline-sm text-headline-sm text-on-surface">{t("title")}</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed px-2.5 py-1 font-label-sm text-label-sm tracking-wider text-on-secondary-fixed uppercase">
            <FlaskConicalIcon className="size-3.5" />
            {t("badge")}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{t("body")}</p>

        <dl className="space-y-2 rounded-xl bg-surface-container-low p-4 font-body-sm text-body-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">{localize(plan.name, locale)}</dt>
            <dd className="text-on-surface">
              {hasTrial ? t("afterTrial", { price, per: period, days: plan.trialDays }) : t("noTrial", { price, per: period })}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-hairline pt-2">
            <dt className="font-label-lg text-label-lg text-on-surface">{t("dueToday")}</dt>
            <dd className="font-label-lg text-label-lg text-primary">{hasTrial ? money(0) : price}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">{t("account")}</dt>
            <dd className="truncate text-on-surface">{viewer.user.email}</dd>
          </div>
        </dl>

        {error && (
          <div role="alert" className="flex gap-3 rounded-xl bg-error-container p-4 text-on-error-container">
            <CircleAlertIcon className="mt-0.5 size-5 shrink-0" />
            <p className="font-body-sm text-body-sm">{t(`errors.${error}`)}</p>
          </div>
        )}

        <TestCheckoutForm
          plan={plan.id}
          success={success}
          cancel={cancel}
          cards={testCards}
          payLabel={hasTrial ? t("pay", { days: plan.trialDays }) : t("payNow", { price })}
        />
      </div>
    </Container>
  );
}
