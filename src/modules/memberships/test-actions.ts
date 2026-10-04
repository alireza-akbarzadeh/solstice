"use server";

import { randomBytes } from "node:crypto";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect as redirectExternal } from "next/navigation";

import { getPathname, redirect } from "@/i18n/navigation";
import type { PaymentEvent } from "@/infrastructure/payment";
import { MOCK_SIGNATURE_HEADER, mockEventId, mockPaymentProvider, signMockPayload } from "@/infrastructure/payment/providers/mock";
import { formText } from "@/lib/form-data";
import { auth } from "@/server/better-auth";

import { applyPaymentEvents, getCheckout } from "./server/billing";
import { getBillingSettings, getPlan, getPlanCatalog } from "./server/plans";
import {
  applyMembershipPreset,
  assertTestMode,
  setUserRole,
  testCards,
  TEST_PASSWORD,
} from "./server/test-mode";
import { getViewer } from "./server/viewer";
import { membershipPresets, type MembershipPreset } from "./test-presets";

// The mock provider's "hosted page" settles here. The outcome travels as signed events through
// the same verification and handler as a real provider's webhook, then the member returns
// through the payment return route like any hosted checkout.
export async function completeTestCheckout(formData: FormData) {
  await assertTestMode();
  const locale = await getLocale();
  const card = formText(formData, "card").replace(/D/g, "");
  const viewer = await getViewer();
  if (!viewer.user) return redirect({ href: "/sign-in", locale });
  const checkout = await getCheckout(formText(formData, "checkout"));
  if (checkout?.userId !== viewer.user.id || checkout.provider !== mockPaymentProvider.id || checkout.status !== "open") {
    return redirect({ href: "/membership", locale });
  }

  if (card === testCards.declined) return redirect({ href: { pathname: "/checkout/test", query: { checkout: checkout.id, error: "declined" } }, locale });
  if (card !== testCards.approved) return redirect({ href: { pathname: "/checkout/test", query: { checkout: checkout.id, error: "unknownCard" } }, locale });

  const events: PaymentEvent[] = [
    {
      id: mockEventId(),
      type: "checkout.completed",
      checkoutId: checkout.id,
      subscriptionId: `mock_sub_${checkout.id}`,
      // A free trial charges nothing today; otherwise the first period is paid now.
      charge: checkout.trialDays > 0 ? null : { providerPaymentId: `mock_pi_${randomBytes(8).toString("hex")}`, amount: checkout.amount, currency: checkout.currency },
    },
  ];
  await deliverMockEvents(events);
  return redirectExternal(`/api/payments/mock/return?checkout=${checkout.id}`);
}

/** Signs and delivers mock events exactly as the webhook route would receive them. */
async function deliverMockEvents(events: PaymentEvent[]) {
  const body = JSON.stringify(events);
  const verified = await mockPaymentProvider.parseWebhook!(body, new Headers({ [MOCK_SIGNATURE_HEADER]: signMockPayload(body) }));
  await applyPaymentEvents(mockPaymentProvider.id, verified);
}

/** Test panel: the provider charges the next period (or ends the trial with a payment). */
export async function simulateRenewal() {
  await assertTestMode();
  const viewer = await getViewer();
  const m = viewer.membership;
  if (m?.provider !== mockPaymentProvider.id || !m.providerSubscriptionId) return;
  const [plan, { currency }] = await Promise.all([getPlan(m.plan), getBillingSettings()]);
  if (!plan) return;
  await deliverMockEvents([
    {
      id: mockEventId(),
      type: "payment.succeeded",
      subscriptionId: m.providerSubscriptionId,
      charge: { providerPaymentId: `mock_pi_${randomBytes(8).toString("hex")}`, amount: plan.price, currency },
    },
  ]);
  revalidatePath("/", "layout");
}

/** Test panel: the next charge is declined, so the membership falls past due. */
export async function simulateFailedPayment() {
  await assertTestMode();
  const viewer = await getViewer();
  const m = viewer.membership;
  if (m?.provider !== mockPaymentProvider.id || !m.providerSubscriptionId) return;
  await deliverMockEvents([{ id: mockEventId(), type: "payment.failed", subscriptionId: m.providerSubscriptionId }]);
  revalidatePath("/", "layout");
}

export async function setTestMembership(preset: MembershipPreset) {
  await assertTestMode();
  if (!membershipPresets.includes(preset)) return;
  const viewer = await getViewer();
  if (!viewer.user) return;
  const { featured, plans } = await getPlanCatalog();
  const plan = featured ?? plans[0];
  // Presets need a plan to sit on; with none on sale there's nothing to simulate.
  if (!plan && preset !== "none") return;
  await applyMembershipPreset(viewer.user.id, preset, plan ?? { id: "", trialDays: 0 });
  revalidatePath("/", "layout");
}

export async function setTestRole(role: "member" | "instructor") {
  await assertTestMode();
  if (role !== "member" && role !== "instructor") return;
  const viewer = await getViewer();
  if (!viewer.user) return;
  await setUserRole(viewer.user.id, role);
  revalidatePath("/", "layout");
}

// A fresh signed-in account in one click, so every state can be tried from scratch.
export async function createTestAccount() {
  await assertTestMode();
  const id = randomBytes(3).toString("hex");
  await auth.api.signUpEmail({
    body: {
      name: `Test Member ${id}`,
      email: `test-${id}@solstice.test`,
      password: TEST_PASSWORD,
      callbackURL: getPathname({ href: "/verify-email", locale: await getLocale() }),
    },
    headers: await headers(),
  });
  revalidatePath("/", "layout");
}
