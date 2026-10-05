"use server";

import { randomBytes } from "node:crypto";

import { getLocale } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { getPathname, redirect } from "@/i18n/navigation";
import { providerFor, type PaymentEvent } from "@/infrastructure/payment";
import { MOCK_SIGNATURE_HEADER, mockEventId, signMockPayload } from "@/infrastructure/payment/providers/mock";
import { formText } from "@/lib/form-data";
import { auth } from "@/server/better-auth";

import { applyPaymentEvents, getCheckout } from "./server/billing";
import { TEST_COUNTRY_COOKIE } from "@/modules/payments/server/country";
import { getProviderCurrency } from "@/modules/payments/server/routing";

import { getPlan, getPlanCatalog } from "./server/plans";
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
  const card = formText(formData, "card").replace(/\D/g, "");
  const viewer = await getViewer();
  if (!viewer.user) return redirect({ href: "/sign-in", locale });
  const checkout = await getCheckout(formText(formData, "checkout"));
  if (checkout?.userId !== viewer.user.id || !isTestProvider(checkout.provider) || checkout.status !== "open") {
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
  await deliverMockEvents(checkout.provider, events);
  // Straight to the welcome page: a server action can't redirect into a route handler (the
  // client router would try to render it), and for the mock the return route adds nothing.
  return redirect({ href: { pathname: "/membership/welcome", query: { checkout: checkout.id } }, locale });
}

/** The in-app test checkout stands in for every gateway in test mode ("test-stripe", …). */
const isTestProvider = (id: string | null | undefined) => providerFor(id)?.testMode === true;

/** Signs and delivers mock events exactly as the webhook route would receive them. */
async function deliverMockEvents(providerId: string, events: PaymentEvent[]) {
  const provider = providerFor(providerId)!;
  const body = JSON.stringify(events);
  const verified = await provider.parseWebhook!(body, new Headers({ [MOCK_SIGNATURE_HEADER]: signMockPayload(body) }));
  await applyPaymentEvents(provider.id, verified);
}

/** Test panel: the provider charges the next period (or ends the trial with a payment). */
export async function simulateRenewal() {
  await assertTestMode();
  const viewer = await getViewer();
  const m = viewer.membership;
  if (!m || !isTestProvider(m.provider) || !m.providerSubscriptionId) return;
  // Charged in the currency of the gateway the member pays through.
  const [plan, currency] = await Promise.all([getPlan(m.plan), getProviderCurrency(m.provider)]);
  if (!plan) return;
  await deliverMockEvents(m.provider, [
    {
      id: mockEventId(),
      type: "payment.succeeded",
      subscriptionId: m.providerSubscriptionId,
      charge: { providerPaymentId: `mock_pi_${randomBytes(8).toString("hex")}`, amount: plan.prices[currency] ?? plan.price, currency },
    },
  ]);
  revalidatePath("/", "layout");
}

/** Test panel: the next charge is declined, so the membership falls past due. */
export async function simulateFailedPayment() {
  await assertTestMode();
  const viewer = await getViewer();
  const m = viewer.membership;
  if (!m || !isTestProvider(m.provider) || !m.providerSubscriptionId) return;
  await deliverMockEvents(m.provider, [{ id: mockEventId(), type: "payment.failed", subscriptionId: m.providerSubscriptionId }]);
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

/** Test panel: pretend to visit from a country ("IR", "US"), or "" to go back to the detected one. */
export async function setTestCountry(country: string) {
  await assertTestMode();
  const jar = await cookies();
  if (/^[A-Z]{2}$/.test(country)) jar.set(TEST_COUNTRY_COOKIE, country, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  else jar.delete(TEST_COUNTRY_COOKIE);
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
