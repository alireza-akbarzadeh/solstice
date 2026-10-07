"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect as redirectExternal } from "next/navigation";

import { env } from "@/env";
import { getPathname, redirect } from "@/i18n/navigation";
import { withNext } from "@/lib/safe-next";
import { applyPaymentEvents, createCheckout, setCheckoutReference } from "@/modules/memberships/server/billing";
import { getAllPlans } from "@/modules/memberships/server/plans";
import { getViewer } from "@/modules/memberships/server/viewer";
import { getPaymentMethods } from "@/modules/payments/server/routing";
import {
  applyCouponSchema,
  couponFormSchema,
  purchaseGiftSchema,
  redeemGiftSchema,
} from "./schemas";
import {
  createCoupon,
  deleteCoupon,
  toggleCouponActive,
  validateCoupon,
} from "./server/coupons";
import {
  createGiftMembership,
  redeemGiftMembership,
} from "./server/gifts";
import { recordReferral } from "./server/referrals";

async function instructorOnly() {
  const viewer = await getViewer();
  return viewer.user?.role === "instructor" ? viewer.user : null;
}

export type ActionResponse<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function validateCouponAction(
  code: string,
  planId: string,
  baseAmount: number,
) {
  const parsed = applyCouponSchema.safeParse({ code, planId, baseAmount });
  if (!parsed.success) {
    return { valid: false, error: "invalidInput" } as const;
  }
  return await validateCoupon(parsed.data.code, parsed.data.planId, parsed.data.baseAmount);
}

export async function createCouponAction(input: unknown): Promise<ActionResponse> {
  const instructor = await instructorOnly();
  if (!instructor) return { ok: false, error: "forbidden" };

  const parsed = couponFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  const created = await createCoupon(parsed.data);
  if (!created) {
    return { ok: false, error: "failed" };
  }

  revalidatePath("/[locale]/instructor/promotions", "page");
  return { ok: true, data: created };
}

export async function toggleCouponActiveAction(
  id: number,
  active: boolean,
): Promise<ActionResponse> {
  const instructor = await instructorOnly();
  if (!instructor) return { ok: false, error: "forbidden" };

  await toggleCouponActive(id, active);
  revalidatePath("/[locale]/instructor/promotions", "page");
  return { ok: true };
}

export async function deleteCouponAction(id: number): Promise<ActionResponse> {
  const instructor = await instructorOnly();
  if (!instructor) return { ok: false, error: "forbidden" };

  await deleteCoupon(id);
  revalidatePath("/[locale]/instructor/promotions", "page");
  return { ok: true };
}

export async function createStudioGiftPassAction(input: unknown): Promise<ActionResponse> {
  const instructor = await instructorOnly();
  if (!instructor) return { ok: false, error: "forbidden" };

  const parsed = purchaseGiftSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  const gift = await createGiftMembership(parsed.data, instructor.id, null, "active");
  if (!gift) return { ok: false, error: "failed" };

  revalidatePath("/[locale]/instructor/promotions", "page");
  return { ok: true, data: gift };
}

export async function redeemGiftAction(code: string): Promise<ActionResponse> {
  const viewer = await getViewer();
  if (!viewer.user) {
    return { ok: false, error: "unauthenticated" };
  }

  const parsed = redeemGiftSchema.safeParse({ code });
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  const res = await redeemGiftMembership(parsed.data.code, viewer.user.id);
  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  revalidatePath("/[locale]", "layout");
  return { ok: true, data: res.gift };
}

export async function recordReferralSignupAction(
  referralCode: string,
): Promise<boolean> {
  const viewer = await getViewer();
  if (!viewer.user || !referralCode) return false;

  return await recordReferral(referralCode, viewer.user.id);
}

export async function startGiftCheckout(formData: FormData) {
  const locale = await getLocale();
  const rawMonths = formData.get("months");
  const months = typeof rawMonths === "string" ? Number(rawMonths) : 1;
  const rawPlanId = formData.get("planId");
  const planId = typeof rawPlanId === "string" && rawPlanId ? rawPlanId : "monthly";
  const rawPurchaserEmail = formData.get("purchaserEmail");
  const purchaserEmail = typeof rawPurchaserEmail === "string" && rawPurchaserEmail.trim() ? rawPurchaserEmail.trim() : null;
  const rawPurchaserName = formData.get("purchaserName");
  const purchaserName = typeof rawPurchaserName === "string" && rawPurchaserName.trim() ? rawPurchaserName.trim() : null;
  const rawRecipientEmail = formData.get("recipientEmail");
  const recipientEmail = typeof rawRecipientEmail === "string" && rawRecipientEmail.trim() ? rawRecipientEmail.trim() : null;
  const rawRecipientName = formData.get("recipientName");
  const recipientName = typeof rawRecipientName === "string" && rawRecipientName.trim() ? rawRecipientName.trim() : null;
  const rawPersonalMessage = formData.get("personalMessage");
  const personalMessage = typeof rawPersonalMessage === "string" && rawPersonalMessage.trim() ? rawPersonalMessage.trim() : null;

  const viewer = await getViewer();
  if (!viewer.user) {
    const back = withNext("/gift", "/gift");
    return redirect({ href: withNext("/sign-up", back), locale });
  }

  const plans = await getAllPlans();
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  if (!plan) return redirect({ href: "/gift", locale });

  const { methods } = await getPaymentMethods();
  const method = methods[0];
  if (!method) return redirect({ href: "/gift?payment=unavailable", locale });

  const currency = method.currency;
  const baseMonthlyPrice = plan.prices[currency] ?? plan.price;
  let giftPrice = baseMonthlyPrice * months;
  if (months === 3) giftPrice = Math.round(baseMonthlyPrice * 3 * 0.95);
  else if (months === 6) giftPrice = Math.round(baseMonthlyPrice * 6 * 0.9);
  else if (months === 12) giftPrice = Math.round(baseMonthlyPrice * 12 * 0.8);

  const gift = await createGiftMembership(
    {
      months,
      planId: plan.id,
      purchaserEmail: purchaserEmail ?? viewer.user.email,
      purchaserName: purchaserName ?? viewer.user.name,
      recipientEmail,
      recipientName,
      personalMessage,
    },
    viewer.user.id,
    null,
    "pending_payment",
  );
  if (!gift) return redirect({ href: "/gift?error=failed", locale });

  const checkout = await createCheckout({
    userId: viewer.user.id,
    plan: { id: plan.id, price: giftPrice, intervalMonths: months, trialDays: 0 },
    currency,
    provider: method.provider.id,
    locale,
    nextPath: `/gift/card/${gift.code}`,
    giftId: gift.id,
  });

  if (method.provider.testMode && giftPrice === 0) {
    await applyPaymentEvents(method.provider.id, [
      { id: `gift_${checkout.id}`, type: "checkout.completed", checkoutId: checkout.id, subscriptionId: null, charge: null },
    ]);
    return redirect({ href: `/gift/card/${gift.code}`, locale });
  }

  const absolute = (path: string) => new URL(path, env.BETTER_AUTH_URL).toString();
  let opened: { url: string; reference?: string };
  try {
    opened = await method.provider.createCheckout({
      checkoutId: checkout.id,
      email: viewer.user.email,
      plan: { id: plan.id, price: giftPrice, currency, intervalMonths: months },
      trialDays: 0,
      locale,
      returnUrl: absolute(`/api/payments/${method.provider.id}/return?checkout=${checkout.id}`),
      cancelUrl: absolute(getPathname({ href: "/gift", locale })),
    });
  } catch (err) {
    console.error("Failed to open gateway for gift checkout:", err);
    return redirect({ href: "/gift?payment=unavailable", locale });
  }

  if (opened.reference) await setCheckoutReference(checkout.id, opened.reference);
  return redirectExternal(opened.url);
}

