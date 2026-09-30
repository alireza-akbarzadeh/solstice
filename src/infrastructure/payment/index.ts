import { env } from "@/env";

// PaymentProvider boundary (README: providers stay replaceable). Domain code in
// modules/memberships decides what a membership is; providers only move money.

export type BillingPlan = "monthly" | "annual";

export type CheckoutInput = {
  userId: string;
  email: string;
  plan: BillingPlan;
  trialDays: number;
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
  resumeSubscription(providerSubscriptionId: string): Promise<void>;
}

// Grants the subscription immediately without charging. Development / demo only.
const mockPaymentProvider: PaymentProvider = {
  id: "mock",
  testMode: true,
  async startCheckout(input) {
    return { kind: "completed", providerSubscriptionId: `mock_${input.userId}_${Date.now()}` };
  },
  async cancelSubscription() {
    // Nothing to cancel: the mock never bills.
  },
  async resumeSubscription() {
    // Nothing to resume: the mock never bills.
  },
};

const providers: Record<typeof env.PAYMENT_PROVIDER, PaymentProvider> = {
  mock: mockPaymentProvider,
};

export const paymentProvider = providers[env.PAYMENT_PROVIDER];
