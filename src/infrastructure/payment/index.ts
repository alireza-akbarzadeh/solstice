import type { Locale } from "next-intl";

import { env } from "@/env";
import { getPathname } from "@/i18n/navigation";

// PaymentProvider boundary (README: providers stay replaceable). Domain code in
// modules/memberships decides what a membership is; providers only move money.

/** The plan being bought, as the studio priced it (modules/memberships/plans). */
export type BillingPlan = {
  id: string;
  /** Amount per billing period, in `currency`. */
  price: number;
  /** ISO 4217 code, or "IRT" for tomans (a toman is 10 rials). */
  currency: string;
  intervalMonths: number;
};

export type CheckoutInput = {
  userId: string;
  email: string;
  plan: BillingPlan;
  /** 0 charges straight away. */
  trialDays: number;
  /** Language for the hosted checkout page. */
  locale: Locale;
  /** Absolute URLs for hosted checkouts to return to. */
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutResult =
  // Hosted checkout (Stripe, Zarinpal, …): send the member there; a webhook activates the membership.
  | { kind: "redirect"; url: string }
  // Provider settled it synchronously (the mock): activate immediately.
  | { kind: "completed"; providerSubscriptionId: string };

export interface PaymentProvider {
  id: string;
  /** Test mode: no real money moves. Shown in the checkout UI. */
  testMode: boolean;
  startCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
  /** Moves the subscription to another plan; takes effect at the next renewal. */
  changePlan(providerSubscriptionId: string, plan: BillingPlan): Promise<void>;
  resumeSubscription(providerSubscriptionId: string): Promise<void>;
}

// Behaves like a hosted checkout without charging: sends the member to the in-app test
// payment page (/checkout/test), which settles with a test card. Development / demo only.
const mockPaymentProvider: PaymentProvider = {
  id: "mock",
  testMode: true,
  async startCheckout(input) {
    const path = getPathname({
      href: { pathname: "/checkout/test", query: { plan: input.plan.id, success: input.successUrl, cancel: input.cancelUrl } },
      locale: input.locale,
    });
    return { kind: "redirect", url: new URL(path, input.successUrl).toString() };
  },
  async cancelSubscription() {
    // Nothing to cancel: the mock never bills.
  },
  async changePlan() {
    // Nothing to change: the mock never bills.
  },
  async resumeSubscription() {
    // Nothing to resume: the mock never bills.
  },
};

const providers: Record<typeof env.PAYMENT_PROVIDER, PaymentProvider> = {
  mock: mockPaymentProvider,
};

export const paymentProvider = providers[env.PAYMENT_PROVIDER];
