import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { env } from "@/env";
import { getPathname } from "@/i18n/navigation";

import type { PaymentEvent, PaymentProvider } from "../types";

export const MOCK_SIGNATURE_HEADER = "x-solstice-signature";

// Signs mock webhooks the way a real provider signs its own, with a key derived from the
// server secret, so the webhook route checks signatures for the test provider too.
const key = () => createHmac("sha256", env.BETTER_AUTH_SECRET ?? "development").update("solstice-mock-payments").digest();
export const signMockPayload = (body: string) => createHmac("sha256", key()).update(body).digest("hex");

export const mockEventId = () => `evt_${randomUUID()}`;

/**
 * Behaves like a hosted checkout without charging: sends the member to the in-app test
 * payment page (/checkout/test), which reports the outcome as signed events. Renewals,
 * failures and refunds are simulated from the test panel and the studio.
 *
 * One instance per gateway in test mode ("test-zarinpal", "test-stripe"), so a test membership
 * renews (or not) like the real gateway would and never reaches the real one's API.
 */
export function createTestProvider(id: string, recurring: boolean): PaymentProvider {
  return {
    id,
    testMode: true,
    recurring,
    async createCheckout(input) {
      const path = getPathname({ href: { pathname: "/checkout/test", query: { checkout: input.checkoutId } }, locale: input.locale });
      return { url: new URL(path, input.returnUrl).toString(), reference: `mock_cs_${input.checkoutId}` };
    },
    async parseWebhook(body, headers) {
      const given = headers.get(MOCK_SIGNATURE_HEADER) ?? "";
      const expected = signMockPayload(body);
      if (given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
        throw new Error("Invalid mock webhook signature");
      }
      return JSON.parse(body) as PaymentEvent[];
    },
    async cancelSubscription() {
      // Nothing to cancel: the mock never bills by itself.
    },
    async resumeSubscription() {
      // Nothing to resume.
    },
    async changePlan() {
      // Nothing to change.
    },
    async refund(charge) {
      // A real provider would confirm by webhook; the mock answers at once.
      return [{ id: mockEventId(), type: "payment.refunded", providerPaymentId: charge.providerPaymentId, amount: charge.amount }];
    },
  };
}

/** The original test provider, used before gateways had settings; older test memberships keep it. */
export const mockPaymentProvider = createTestProvider("mock", true);
