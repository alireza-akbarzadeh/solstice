import { cache } from "react";

import {
  gatewayIds,
  gatewayOf,
  gatewayProvider,
  gateways,
  providerFor,
  type GatewayId,
  type PaymentProvider,
} from "@/infrastructure/payment";
import type { Currency, MembershipPlan } from "@/modules/memberships/plans";
import { getAllPlans, getBillingSettings } from "@/modules/memberships/server/plans";

import { IRAN, type PaymentSettings } from "../types";
import { getVisitorCountry } from "./country";
import { getPaymentSettings } from "./settings";

/** One way to pay at checkout: a gateway, the provider running it, and the currency it charges. */
export type PaymentMethod = {
  gateway: GatewayId;
  provider: PaymentProvider;
  currency: Currency;
  cards: "iranian" | "international";
};

const currencyOf = (gateway: GatewayId, settings: PaymentSettings): Currency =>
  gateway === "stripe" ? settings.stripe.currency : "IRT";

/**
 * The switched-on gateways, the one preselected for this visitor first: the Iran gateway when
 * the connection comes from Iran, the default gateway otherwise.
 */
export const getPaymentMethods = cache(async (locale?: string) => {
  const [settings, country] = await Promise.all([getPaymentSettings(), getVisitorCountry(locale)]);
  const preferred = country === IRAN ? settings.iranGateway : settings.defaultGateway;
  const methods: PaymentMethod[] = [];
  for (const gateway of [preferred, ...gatewayIds.filter((id) => id !== preferred)]) {
    const { enabled, mode } = settings[gateway];
    const provider = enabled ? gatewayProvider(gateway, mode) : undefined;
    if (provider) methods.push({ gateway, provider, currency: currencyOf(gateway, settings), cards: gateways[gateway].cards });
  }
  return { methods, country };
});

/** The methods that can sell a plan: it has a price in their currency. */
export const methodsFor = (methods: PaymentMethod[], plan: Pick<MembershipPlan, "prices">) =>
  methods.filter((method) => plan.prices[method.currency] !== undefined);

/**
 * The currency to quote prices in for this visitor (home banners, "from …" prices): that of
 * the first method, in preference order, that sells at least one plan on sale.
 */
export const getVisitorCurrency = cache(async (locale?: string): Promise<Currency> => {
  const [{ methods }, plans, billing] = await Promise.all([getPaymentMethods(locale), getAllPlans(), getBillingSettings()]);
  const active = plans.filter((plan) => plan.status === "active");
  return methods.find((method) => active.some((plan) => plan.prices[method.currency] !== undefined))?.currency ?? billing.currency;
});

/**
 * The currency a membership is billed in, from the provider that manages it: toman for
 * Zarinpal, the studio's Stripe currency for Stripe, the site currency for anything else.
 */
export async function getProviderCurrency(providerId: string | null | undefined): Promise<Currency> {
  const gateway = gatewayOf(providerId);
  if (gateway && providerFor(providerId)) return currencyOf(gateway, await getPaymentSettings());
  return (await getBillingSettings()).currency;
}
