import type { Locale } from "next-intl";

// PaymentProvider boundary (README: providers stay replaceable). Domain code in
// modules/memberships decides what a membership is; providers only move money and report
// what happened as PaymentEvents.

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
  /** Our checkout id; providers echo it back so a confirmation names what was bought. */
  checkoutId: string;
  email: string;
  plan: BillingPlan;
  /** 0 charges straight away. */
  trialDays: number;
  /** Language for the provider's page. */
  locale: Locale;
  /** Absolute URL the provider sends the member back to after paying. */
  returnUrl: string;
  /** Absolute URL for "go back" on the provider's page. */
  cancelUrl: string;
};

/** The checkout as stored, for providers that confirm on return. */
export type CheckoutRecord = {
  id: string;
  amount: number;
  currency: string;
  providerReference: string | null;
};

export type Charge = { providerPaymentId: string; amount: number; currency: string };

/**
 * What a provider reports, in our words. Every event has an id unique within its provider, so
 * applying the same event twice (a retried webhook, a reloaded return page) changes nothing.
 */
export type PaymentEvent =
  /** The member finished checkout. `charge` is null when a free trial started instead. */
  | { id: string; type: "checkout.completed"; checkoutId: string; subscriptionId: string | null; charge: Charge | null }
  /** Checkout ended without payment (declined, abandoned, failed verification). */
  | { id: string; type: "checkout.failed"; checkoutId: string }
  /** A renewal (or the first charge after a trial) went through. */
  | { id: string; type: "payment.succeeded"; subscriptionId: string; charge: Charge; periodEnd?: Date }
  /** A renewal failed; the membership is past due until it is paid. */
  | { id: string; type: "payment.failed"; subscriptionId: string }
  /** The subscription ended at the provider (canceled and run out, or closed). */
  | { id: string; type: "subscription.ended"; subscriptionId: string }
  /** Money went back to the member. `amount` is this refund, not the running total. */
  | { id: string; type: "payment.refunded"; providerPaymentId: string; amount: number };

export interface PaymentProvider {
  id: string;
  /** Test mode: no real money moves (the in-app test checkout). */
  testMode: boolean;
  /** Renews by itself (Stripe). Without it the member pays again each period (Zarinpal). */
  recurring: boolean;
  /** Creates the provider's checkout and returns where to send the member. */
  createCheckout(input: CheckoutInput): Promise<{ url: string; reference?: string }>;
  /** Webhook style: verify the request came from the provider and translate it. */
  parseWebhook?(body: string, headers: Headers): Promise<PaymentEvent[]>;
  /** Return style: confirm with the provider when the member comes back. */
  confirmReturn?(checkout: CheckoutRecord, params: URLSearchParams): Promise<PaymentEvent[]>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  resumeSubscription(subscriptionId: string): Promise<void>;
  /** Moves the subscription to another plan; takes effect at the next renewal. */
  changePlan(subscriptionId: string, plan: BillingPlan): Promise<void>;
  /**
   * Sends money back. Returns events to apply now when the provider answers synchronously,
   * or none when its webhook will report the refund.
   */
  refund(charge: Charge): Promise<PaymentEvent[]>;
}
