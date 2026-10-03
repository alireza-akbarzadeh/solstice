import { getFormatter, getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";

import type { CheckoutPlan } from "../components/checkout";
import { formatMoney, monthlyEquivalent, type MembershipPlan } from "../plans";
import { getPlanCatalog } from "./plans";

/**
 * The plan catalogue plus the formatting every page needs to show a price: the amount in the
 * site currency, its period ("/ year"), and a plan fully described for the checkout cards.
 */
export async function getPlanDisplay(locale: Locale) {
  const [catalog, t, format] = await Promise.all([
    getPlanCatalog(),
    getTranslations({ locale, namespace: "Membership" }),
    getFormatter({ locale }),
  ]);
  const money = (amount: number) =>
    formatMoney(format, amount, catalog.currency, locale);
  const per = (months: number) => t("per", { months });

  const describe = (plan: MembershipPlan): CheckoutPlan => {
    const billed = t("billedEvery", { months: plan.intervalMonths });
    return {
      id: plan.id,
      name: localize(plan.name, locale),
      description: localize(plan.description, locale),
      badge: localize(plan.badge, locale),
      features: plan.features
        .map((feature) => localize(feature, locale))
        .filter(Boolean),
      price: money(plan.price),
      per: per(plan.intervalMonths),
      perMonth:
        plan.intervalMonths > 1
          ? t("perMonthEquivalent", { price: money(monthlyEquivalent(plan)) })
          : null,
      billing:
        plan.trialDays > 0
          ? t("billingTrial", { billed, days: plan.trialDays })
          : t("billingNow", { billed }),
      trialDays: plan.trialDays,
    };
  };

  return { catalog, money, per, describe };
}
