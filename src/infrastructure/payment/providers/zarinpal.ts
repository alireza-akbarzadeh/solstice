import { loadGatewayConfig } from "../config";
import { RefundUnsupportedError } from "../errors";
import type { PaymentEvent, PaymentProvider } from "../types";

// Zarinpal (Iranian bank cards, toman). Hosted payment page, confirmed on return: the member
// comes back with ?Authority=…&Status=OK|NOK and we verify the payment server to server,
// with the amount we expect, before anything is granted. Zarinpal has no subscriptions, so
// every period is a separate payment (the member renews by hand; modules/memberships).
// API v4: https://www.zarinpal.com/docs/paymentGateway/

const hosts = { sandbox: "https://sandbox.zarinpal.com", live: "https://payment.zarinpal.com" } as const;
type Live = keyof typeof hosts;

/** Codes Zarinpal returns on success: 100, and 101 for "already verified" (a reloaded return page). */
const OK = new Set([100, 101]);

type ZarinpalResponse<T> = { data?: T & { code?: number; message?: string }; errors?: unknown };

async function call<T>(mode: Live, path: string, body: Record<string, unknown>): Promise<ZarinpalResponse<T>> {
  const response = await fetch(`${hosts[mode]}/pg/v4/payment/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  // Failures come back as 4xx with an { errors } body, which is still worth reading.
  return (await response.json().catch(() => ({}))) as ZarinpalResponse<T>;
}

async function settings() {
  const { mode, credentials } = await loadGatewayConfig("zarinpal");
  if (mode === "test") throw new Error("Zarinpal is in test mode; checkouts go through test-zarinpal.");
  const merchantId = credentials.merchantId;
  if (!merchantId) throw new Error("Zarinpal merchant ID is missing.");
  return { mode, merchantId };
}

/** Our reference for a checkout: the mode it was opened in and Zarinpal's authority. */
const reference = (mode: Live, authority: string) => `${mode}:${authority}`;
function parseReference(value: string | null): { mode: Live; authority: string } | null {
  const [mode, authority] = value?.split(":") ?? [];
  return (mode === "sandbox" || mode === "live") && authority ? { mode, authority } : null;
}

/** Zarinpal takes whole tomans; this site never sends it another currency (routing guarantees IRT). */
function tomans(amount: number, currency: string) {
  if (currency !== "IRT") throw new Error(`Zarinpal only charges in toman, not ${currency}.`);
  return Math.round(amount);
}

export const zarinpalProvider: PaymentProvider = {
  id: "zarinpal",
  testMode: false,
  recurring: false,

  async createCheckout(input) {
    const { mode, merchantId } = await settings();
    const result = await call<{ authority?: string }>(mode, "request.json", {
      merchant_id: merchantId,
      amount: tomans(input.plan.price, input.plan.currency),
      currency: "IRT",
      callback_url: input.returnUrl,
      description: `Membership ${input.plan.id} (${input.checkoutId})`,
      metadata: { email: input.email, order_id: input.checkoutId },
    });
    const authority = result.data?.authority;
    if (result.data?.code !== 100 || !authority) {
      throw new Error(`Zarinpal payment request failed: ${JSON.stringify(result.errors ?? result.data)}`);
    }
    return { url: `${hosts[mode]}/pg/StartPay/${authority}`, reference: reference(mode, authority) };
  },

  async confirmReturn(checkout, params) {
    const failed: PaymentEvent[] = [{ id: `zp_failed_${checkout.id}`, type: "checkout.failed", checkoutId: checkout.id }];
    const ours = parseReference(checkout.providerReference);
    // The authority in the link must be the one we opened; Status=NOK means canceled or declined.
    if (params.get("Authority") !== ours?.authority || params.get("Status") !== "OK" || !ours) return failed;

    const { merchantId } = await settings();
    const amount = tomans(checkout.amount, checkout.currency);
    const result = await call<{ ref_id?: number }>(ours.mode, "verify.json", {
      merchant_id: merchantId,
      amount,
      currency: "IRT",
      authority: ours.authority,
    });
    const refId = result.data?.ref_id;
    if (!OK.has(result.data?.code ?? 0) || !refId) return failed;
    return [
      {
        id: `zp_${ours.authority}`,
        type: "checkout.completed",
        checkoutId: checkout.id,
        subscriptionId: null,
        charge: { providerPaymentId: String(refId), amount, currency: "IRT" },
      },
    ];
  },

  // Nothing renews at Zarinpal, so there is nothing to cancel, resume or move to another plan:
  // the next manual renewal simply charges the plan the member is on.
  async cancelSubscription() {
    // No subscription at the gateway.
  },
  async resumeSubscription() {
    // No subscription at the gateway.
  },
  async changePlan() {
    // The next renewal charges the new plan.
  },

  async refund() {
    // Zarinpal's refund API is only open to some merchants; refunds are made from its panel.
    throw new RefundUnsupportedError("zarinpal");
  },
};
