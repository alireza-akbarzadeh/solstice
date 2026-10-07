"use server";

import { getLocale } from "next-intl/server";
import { redirect as redirectExternal } from "next/navigation";

import { env } from "@/env";
import { getPathname, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { gatewayOf, providerFor, type PaymentProvider } from "@/infrastructure/payment";
import { safeNextPath, withNext } from "@/lib/safe-next";
import { hasPlaceFor } from "@/modules/conversations/server/guidance";
import { getPaymentMethods, getProviderCurrency, methodsFor } from "@/modules/payments/server/routing";

import { getAllPlans } from "./server/plans";
import type { MembershipPlan } from "./plans";
import { applyPaymentEvents, createCheckout, setCheckoutReference } from "./server/billing";
import { renewsByHand, setCancelAtPeriodEnd, setPlan } from "./server/memberships";
import { getViewer } from "./server/viewer";
import { validateCoupon } from "@/modules/promotions/server/coupons";
import { recordReferral } from "@/modules/promotions/server/referrals";

/** Only plans currently on sale can be bought or switched to. */
async function activePlan(value: FormDataEntryValue | null) {
  return (await getAllPlans()).find((p) => p.status === "active" && p.id === value) ?? null;
}

export async function startCheckout(formData: FormData) {
  const locale = await getLocale();
  const plan = await activePlan(formData.get("plan"));
  const next = safeNextPath(formData.get("next"));
  const asked = formData.get("method");
  const couponEntry = formData.get("coupon");
  const rawCoupon = typeof couponEntry === "string" ? couponEntry.trim() : undefined;
  const refEntry = formData.get("ref");
  const rawRef = typeof refEntry === "string" ? refEntry.trim() : undefined;
  const viewer = await getViewer();

  // Account first, then payment: come back here with the same plan, method and destination.
  if (!viewer.user) {
    const query = new URLSearchParams();
    if (plan) query.set("plan", plan.id);
    if (typeof asked === "string" && asked) query.set("method", asked);
    if (rawCoupon) query.set("coupon", rawCoupon);
    if (rawRef) query.set("ref", rawRef);
    const back = withNext(query.size ? `/membership?${query}` : "/membership", next);
    return redirect({ href: withNext("/sign-up", back), locale });
  }
  if (viewer.hasAccess) return redirect({ href: next, locale });
  if (!plan) return redirect({ href: withNext("/membership", next), locale });
  // Every guidance place on the plan is taken: back to the plans with a note.
  if (!(await hasPlaceFor(plan, viewer.membership))) return redirect({ href: withNext(`/membership?plan=${plan.id}&full=1`, next), locale });

  // Record referral if provided and this member doesn't have an existing membership
  if (rawRef && !viewer.membership) {
    try {
      await recordReferral(rawRef, viewer.user.id);
    } catch (e) {
      console.error("Failed to record referral:", e);
    }
  }

  // The visitor's pick wins over the country's preselection, as long as it can sell the plan.
  const usable = methodsFor((await getPaymentMethods()).methods, plan);
  const method = usable.find((m) => m.gateway === asked) ?? usable[0];
  if (!method) return redirect({ href: withNext("/membership", next), locale });
  const { provider, currency } = method;
  // A free trial is for a first membership only; anyone who has had one pays from day one.
  const trialDays = viewer.membership ? 0 : plan.trialDays;

  // Evaluate coupon discount if supplied
  let chargedPrice = plan.prices[currency]!;
  let discountAmount = 0;
  let appliedCouponCode: string | undefined = undefined;

  if (rawCoupon) {
    const validation = await validateCoupon(rawCoupon, plan.id, chargedPrice);
    if (validation.valid) {
      discountAmount = validation.discountAmount;
      chargedPrice = validation.finalAmount;
      appliedCouponCode = validation.coupon.code;
    }
  }

  // If 100% discounted (e.g. comped code), grant immediately without hitting gateway
  if (chargedPrice === 0) {
    const checkout = await createCheckout({
      userId: viewer.user.id,
      plan: { ...plan, price: 0, trialDays: 0 },
      currency,
      provider: provider.id,
      locale,
      nextPath: next,
      couponCode: appliedCouponCode,
      discountAmount,
    });
    await applyPaymentEvents(provider.id, [
      { id: `free_${checkout.id}`, type: "checkout.completed", checkoutId: checkout.id, subscriptionId: null, charge: null },
    ]);
    return redirect({ href: { pathname: "/membership/welcome", query: { checkout: checkout.id } }, locale });
  }

  const checkout = await createCheckout({
    userId: viewer.user.id,
    plan: { ...plan, price: chargedPrice, trialDays },
    currency,
    provider: provider.id,
    locale,
    nextPath: next,
    couponCode: appliedCouponCode,
    discountAmount,
  });
  // A gateway that can't charge later (Zarinpal) has nothing to take for a trial: it starts
  // here, and the member pays when it ends.
  if (trialDays > 0 && !provider.recurring) {
    await applyPaymentEvents(provider.id, [
      { id: `trial_${checkout.id}`, type: "checkout.completed", checkoutId: checkout.id, subscriptionId: null, charge: null },
    ]);
    return redirect({ href: { pathname: "/membership/welcome", query: { checkout: checkout.id } }, locale });
  }
  return sendToGateway({ provider, checkout, plan, email: viewer.user.email, locale, back: withNext(`/membership?plan=${plan.id}`, next) });
}

/**
 * Opens the provider's checkout for a checkout record and sends the member there. If the
 * gateway can't be reached, they come back to `back` with a message instead of an error page.
 */
async function sendToGateway(input: {
  provider: PaymentProvider;
  checkout: Awaited<ReturnType<typeof createCheckout>>;
  plan: MembershipPlan;
  email: string;
  locale: Locale;
  back: string;
}) {
  const { provider, checkout, plan, locale } = input;
  const absolute = (path: string) => new URL(path, env.BETTER_AUTH_URL).toString();
  let opened: { url: string; reference?: string };
  try {
    opened = await provider.createCheckout({
      checkoutId: checkout.id,
      email: input.email,
      plan: { id: plan.id, price: checkout.amount, currency: checkout.currency, intervalMonths: checkout.intervalMonths },
      trialDays: checkout.trialDays,
      locale,
      returnUrl: absolute(`/api/payments/${provider.id}/return?checkout=${checkout.id}`),
      cancelUrl: absolute(getPathname({ href: input.back, locale })),
    });
  } catch (error) {
    console.error(`Checkout could not be opened with ${provider.id}.`, error);
    const separator = input.back.includes("?") ? "&" : "?";
    return redirect({ href: `${input.back}${separator}payment=unavailable`, locale });
  }
  if (opened.reference) await setCheckoutReference(checkout.id, opened.reference);
  return redirectExternal(opened.url);
}

/**
 * Pays the next period now, for memberships whose gateway doesn't renew by itself (Zarinpal).
 * The new period starts where the current one ends, so renewing early loses nothing.
 */
export async function renewMembership(formData?: FormData) {
  const locale = await getLocale();
  const back = safeNextPath(formData?.get("back"), "/profile");
  const viewer = await getViewer();
  const membership = viewer.membership;
  if (!viewer.user || !membership || !renewsByHand(membership)) return redirect({ href: back, locale });

  // Through the same gateway, in whatever mode the studio runs it now.
  const method = (await getPaymentMethods()).methods.find((m) => m.gateway === gatewayOf(membership.provider));
  const plan = (await getAllPlans()).find((p) => p.id === membership.plan);
  const price = method && plan?.prices[method.currency];
  if (!method || !plan || price === undefined) return redirect({ href: "/membership", locale });

  const checkout = await createCheckout({
    userId: viewer.user.id,
    plan: { ...plan, price },
    currency: method.currency,
    provider: method.provider.id,
    locale,
    nextPath: back,
    renewal: true,
  });
  return sendToGateway({ provider: method.provider, checkout, plan, email: viewer.user.email, locale, back });
}

export async function cancelMembership(formData?: FormData) {
  const locale = await getLocale();
  const back = safeNextPath(formData?.get("back"), "/membership");
  const viewer = await getViewer();
  if (!viewer.user || !viewer.membership) return redirect({ href: back, locale });

  if (viewer.membership.providerSubscriptionId) {
    await providerFor(viewer.membership.provider)?.cancelSubscription(viewer.membership.providerSubscriptionId);
  }
  await setCancelAtPeriodEnd(viewer.user.id, true);
  return redirect({ href: back, locale });
}

export async function resumeMembership(formData?: FormData) {
  const locale = await getLocale();
  const back = safeNextPath(formData?.get("back"), "/membership");
  const viewer = await getViewer();
  if (!viewer.user || !viewer.membership) return redirect({ href: back, locale });

  if (viewer.membership.providerSubscriptionId) {
    await providerFor(viewer.membership.provider)?.resumeSubscription(viewer.membership.providerSubscriptionId);
  }
  await setCancelAtPeriodEnd(viewer.user.id, false);
  return redirect({ href: back, locale });
}

export async function changePlan(formData: FormData) {
  const locale = await getLocale();
  const plan = await activePlan(formData.get("plan"));
  const viewer = await getViewer();
  if (!viewer.user || !viewer.membership || !plan) return redirect({ href: "/profile", locale });
  if (!(await hasPlaceFor(plan, viewer.membership))) return redirect({ href: "/profile?full=1", locale });
  // A member stays with the gateway (and so the currency) they pay through.
  const currency = await getProviderCurrency(viewer.membership.provider);
  const price = plan.prices[currency];
  if (price === undefined) return redirect({ href: "/profile", locale });

  if (viewer.membership.providerSubscriptionId) {
    await providerFor(viewer.membership.provider)?.changePlan(viewer.membership.providerSubscriptionId, {
      id: plan.id,
      price,
      currency,
      intervalMonths: plan.intervalMonths,
    });
  }
  await setPlan(viewer.user.id, plan.id);
  return redirect({ href: "/profile", locale });
}
