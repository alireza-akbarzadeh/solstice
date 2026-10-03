"use server";

import { getLocale } from "next-intl/server";
import { redirect as redirectExternal } from "next/navigation";

import { env } from "@/env";
import { getPathname, redirect } from "@/i18n/navigation";
import { paymentProvider } from "@/infrastructure/payment";
import { safeNextPath, withNext } from "@/lib/safe-next";

import { getPlanCatalog } from "./server/plans";
import { setCancelAtPeriodEnd, setPlan, startMembership } from "./server/memberships";
import { getViewer } from "./server/viewer";

/** Only plans currently on sale can be bought or switched to. */
async function activePlan(value: FormDataEntryValue | null) {
  const { plans, currency } = await getPlanCatalog();
  const plan = plans.find((p) => p.id === value);
  return plan ? { plan, currency } : null;
}

export async function startCheckout(formData: FormData) {
  const locale = await getLocale();
  const chosen = await activePlan(formData.get("plan"));
  const next = safeNextPath(formData.get("next"));
  const viewer = await getViewer();

  // Account first, then payment: come back here with the same plan and destination.
  if (!viewer.user) {
    const back = withNext(chosen ? `/membership?plan=${chosen.plan.id}` : "/membership", next);
    return redirect({ href: withNext("/sign-up", back), locale });
  }
  if (viewer.hasAccess) return redirect({ href: next, locale });
  if (!chosen) return redirect({ href: withNext("/membership", next), locale });
  const { plan, currency } = chosen;

  const absolute = (path: string) => new URL(getPathname({ href: path, locale }), env.BETTER_AUTH_URL).toString();
  const result = await paymentProvider.startCheckout({
    userId: viewer.user.id,
    email: viewer.user.email,
    plan: { id: plan.id, price: plan.price, currency, intervalMonths: plan.intervalMonths },
    trialDays: plan.trialDays,
    locale,
    successUrl: absolute(withNext("/membership/welcome", next)),
    cancelUrl: absolute(withNext(`/membership?plan=${plan.id}`, next)),
  });

  if (result.kind === "redirect") return redirectExternal(result.url);

  await startMembership({
    userId: viewer.user.id,
    planId: plan.id,
    intervalMonths: plan.intervalMonths,
    provider: paymentProvider.id,
    providerSubscriptionId: result.providerSubscriptionId,
    trialDays: plan.trialDays,
  });
  return redirect({ href: withNext("/membership/welcome", next), locale });
}

export async function cancelMembership(formData?: FormData) {
  const locale = await getLocale();
  const back = safeNextPath(formData?.get("back"), "/membership");
  const viewer = await getViewer();
  if (!viewer.user || !viewer.membership) return redirect({ href: back, locale });

  if (viewer.membership.providerSubscriptionId) {
    await paymentProvider.cancelSubscription(viewer.membership.providerSubscriptionId);
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
    await paymentProvider.resumeSubscription(viewer.membership.providerSubscriptionId);
  }
  await setCancelAtPeriodEnd(viewer.user.id, false);
  return redirect({ href: back, locale });
}

export async function changePlan(formData: FormData) {
  const locale = await getLocale();
  const chosen = await activePlan(formData.get("plan"));
  const viewer = await getViewer();
  if (!viewer.user || !viewer.membership || !chosen) return redirect({ href: "/profile", locale });
  const { plan, currency } = chosen;

  if (viewer.membership.providerSubscriptionId) {
    await paymentProvider.changePlan(viewer.membership.providerSubscriptionId, {
      id: plan.id,
      price: plan.price,
      currency,
      intervalMonths: plan.intervalMonths,
    });
  }
  await setPlan(viewer.user.id, plan.id);
  return redirect({ href: "/profile", locale });
}
