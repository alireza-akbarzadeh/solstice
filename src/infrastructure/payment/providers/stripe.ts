import { createHmac, timingSafeEqual } from "node:crypto";

import { loadGatewayConfig } from "../config";
import type { BillingPlan, Charge, CheckoutInput, PaymentEvent, PaymentProvider } from "../types";

// Stripe REST API implementation (international bank cards, recurring subscriptions).
// Subscriptions renew automatically at Stripe; webhook events report renewals, payment failures,
// cancellations, and refunds. Built directly on the Stripe REST API without external dependencies.
// API reference: https://docs.stripe.com/api

const STRIPE_API_BASE = "https://api.stripe.com/v1";

async function settings() {
  const { mode, credentials } = await loadGatewayConfig("stripe");
  if (mode === "test") throw new Error("Stripe is in test mode; checkouts go through test-stripe.");
  const secretKey = credentials.secretKey;
  if (!secretKey) throw new Error("Stripe secret key is missing.");
  const webhookSecret = credentials.webhookSecret;
  return { mode, secretKey, webhookSecret };
}

async function callStripe<T>(
  secretKey: string,
  method: "GET" | "POST" | "DELETE",
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = `${STRIPE_API_BASE}/${path}`;
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  };

  if (method === "POST" && params) {
    const body = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        body.append(key, String(val));
      }
    }
    options.body = body.toString();
    (options.headers as Record<string, string>)["Content-Type"] = "application/x-www-form-urlencoded";
  }

  const response = await fetch(url, options);
  const data = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!response.ok || (data as { error?: unknown }).error) {
    const msg = data.error?.message ?? `Stripe HTTP error ${response.status}`;
    throw new Error(`Stripe API error (${path}): ${msg}`);
  }
  return data;
}

function verifyStripeSignature(payload: string, header: string, secret: string, toleranceSec = 300): boolean {
  const parts = header.split(",");
  let timestamp: string | undefined;
  const signatures: string[] = [];

  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k?.trim() === "t") timestamp = v?.trim();
    if (k?.trim() === "v1" && v) signatures.push(v.trim());
  }

  if (!timestamp || signatures.length === 0) return false;
  const now = Math.floor(Date.now() / 1000);
  const eventTime = Number(timestamp);
  if (Number.isNaN(eventTime) || Math.abs(now - eventTime) > toleranceSec) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmac("sha256", secret).update(signedPayload).digest("hex");

  for (const sig of signatures) {
    if (sig.length === expectedSignature.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature))) {
      return true;
    }
  }
  return false;
}

export const stripeProvider: PaymentProvider = {
  id: "stripe",
  testMode: false,
  recurring: true,

  async createCheckout(input: CheckoutInput) {
    const { secretKey } = await settings();

    const bodyParams: Record<string, string> = {
      mode: "subscription",
      client_reference_id: input.checkoutId,
      customer_email: input.email,
      success_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      "line_items[0][price_data][currency]": input.plan.currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(Math.round(input.plan.price * 100)),
      "line_items[0][price_data][product_data][name]": `Solstice Yoga — ${input.plan.id}`,
      "line_items[0][price_data][recurring][interval]": input.plan.intervalMonths >= 12 ? "year" : "month",
      "line_items[0][quantity]": "1",
      "metadata[checkoutId]": input.checkoutId,
      "metadata[planId]": input.plan.id,
      "subscription_data[metadata][checkoutId]": input.checkoutId,
      "subscription_data[metadata][planId]": input.plan.id,
    };

    if (input.plan.intervalMonths > 1 && input.plan.intervalMonths < 12) {
      bodyParams["line_items[0][price_data][recurring][interval_count]"] = String(input.plan.intervalMonths);
    }
    if (input.trialDays > 0) {
      bodyParams["subscription_data[trial_period_days]"] = String(input.trialDays);
    }

    const session = await callStripe<{ id: string; url: string }>(
      secretKey,
      "POST",
      "checkout/sessions",
      bodyParams,
    );

    return { url: session.url, reference: session.id };
  },

  async parseWebhook(body: string, headers: Headers): Promise<PaymentEvent[]> {
    const { webhookSecret } = await settings();
    if (!webhookSecret) {
      throw new Error("Stripe webhook secret is not configured.");
    }

    const signature = headers.get("stripe-signature");
    if (!signature || !verifyStripeSignature(body, signature, webhookSecret)) {
      throw new Error("Invalid Stripe signature");
    }

    interface StripeObject {
      id?: string;
      subscription?: string;
      client_reference_id?: string;
      amount_total?: number;
      amount_paid?: number;
      amount_refunded?: number;
      currency?: string;
      payment_intent?: string;
      billing_reason?: string;
      metadata?: Record<string, string | undefined>;
      lines?: {
        data?: Array<{
          period?: {
            end?: number;
          };
        }>;
      };
    }

    interface StripeEventPayload {
      id: string;
      type: string;
      data?: {
        object?: StripeObject;
      };
    }

    const event = JSON.parse(body) as StripeEventPayload;
    const obj = event.data?.object ?? {};

    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutId = obj.client_reference_id ?? obj.metadata?.checkoutId;
        if (!checkoutId) return [];

        const subscriptionId = obj.subscription ?? null;
        const amountTotal = Number(obj.amount_total ?? 0);
        const currency = String(obj.currency ?? "usd").toUpperCase();
        const paymentIntent = obj.payment_intent ?? obj.id ?? "";

        const charge: Charge | null =
          amountTotal > 0
            ? {
                providerPaymentId: paymentIntent,
                amount: amountTotal / 100,
                currency,
              }
            : null;

        return [
          {
            id: event.id,
            type: "checkout.completed",
            checkoutId,
            subscriptionId,
            charge,
          },
        ];
      }

      case "invoice.paid": {
        const subscriptionId = obj.subscription;
        // The very first payment of a new subscription is handled by checkout.session.completed.
        // invoice.paid handles subsequent renewals.
        if (!subscriptionId || obj.billing_reason === "subscription_create") return [];

        const amountPaid = Number(obj.amount_paid ?? 0);
        const currency = String(obj.currency ?? "usd").toUpperCase();
        const paymentIntent = obj.payment_intent ?? obj.id ?? "";

        const periodEndSeconds = obj.lines?.data?.[0]?.period?.end;
        const periodEnd = periodEndSeconds ? new Date(periodEndSeconds * 1000) : undefined;

        return [
          {
            id: event.id,
            type: "payment.succeeded",
            subscriptionId,
            charge: {
              providerPaymentId: paymentIntent,
              amount: amountPaid / 100,
              currency,
            },
            periodEnd,
          },
        ];
      }

      case "invoice.payment_failed": {
        const subscriptionId = obj.subscription;
        if (!subscriptionId) return [];

        return [
          {
            id: event.id,
            type: "payment.failed",
            subscriptionId,
          },
        ];
      }

      case "customer.subscription.deleted": {
        const subscriptionId = obj.id;
        if (!subscriptionId) return [];

        return [
          {
            id: event.id,
            type: "subscription.ended",
            subscriptionId,
          },
        ];
      }

      case "charge.refunded": {
        const providerPaymentId = obj.id ?? "";
        const amountRefunded = Number(obj.amount_refunded ?? 0);

        return [
          {
            id: event.id,
            type: "payment.refunded",
            providerPaymentId,
            amount: amountRefunded / 100,
          },
        ];
      }

      default:
        return [];
    }
  },

  async cancelSubscription(subscriptionId: string) {
    const { secretKey } = await settings();
    await callStripe(secretKey, "POST", `subscriptions/${subscriptionId}`, {
      cancel_at_period_end: true,
    });
  },

  async resumeSubscription(subscriptionId: string) {
    const { secretKey } = await settings();
    await callStripe(secretKey, "POST", `subscriptions/${subscriptionId}`, {
      cancel_at_period_end: false,
    });
  },

  async changePlan(subscriptionId: string, plan: BillingPlan) {
    const { secretKey } = await settings();

    // 1. Retrieve current subscription items
    interface SubResponse {
      items: {
        data: Array<{ id: string }>;
      };
    }
    const sub = await callStripe<SubResponse>(secretKey, "GET", `subscriptions/${subscriptionId}`);
    const itemId = sub.items?.data?.[0]?.id;
    if (!itemId) throw new Error("Could not find subscription item to update.");

    // 2. Update with new plan pricing
    const bodyParams: Record<string, string> = {
      "items[0][id]": itemId,
      "items[0][price_data][currency]": plan.currency.toLowerCase(),
      "items[0][price_data][unit_amount]": String(Math.round(plan.price * 100)),
      "items[0][price_data][product_data][name]": `Solstice Yoga — ${plan.id}`,
      "items[0][price_data][recurring][interval]": plan.intervalMonths >= 12 ? "year" : "month",
      proration_behavior: "always_invoice",
    };

    if (plan.intervalMonths > 1 && plan.intervalMonths < 12) {
      bodyParams["items[0][price_data][recurring][interval_count]"] = String(plan.intervalMonths);
    }

    await callStripe(secretKey, "POST", `subscriptions/${subscriptionId}`, bodyParams);
  },

  async refund(charge: Charge) {
    const { secretKey } = await settings();

    // Refund by payment_intent or charge ID
    const bodyParams: Record<string, string> = {
      amount: String(Math.round(charge.amount * 100)),
    };
    if (charge.providerPaymentId.startsWith("pi_")) {
      bodyParams.payment_intent = charge.providerPaymentId;
    } else {
      bodyParams.charge = charge.providerPaymentId;
    }

    await callStripe(secretKey, "POST", "refunds", bodyParams);

    return [
      {
        id: `stripe_rf_${charge.providerPaymentId}`,
        type: "payment.refunded",
        providerPaymentId: charge.providerPaymentId,
        amount: charge.amount,
      },
    ];
  },
};
