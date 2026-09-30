"use server";

import { getLocale } from "next-intl/server";
import { redirect as redirectExternal } from "next/navigation";

import { env } from "@/env";
import { getPathname, redirect } from "@/i18n/navigation";
import { paymentProvider } from "@/infrastructure/payment";
import { safeNextPath, withNext } from "@/lib/safe-next";

import { isBillingPlan, sanctuaryPlan } from "./plans";
import { setCancelAtPeriodEnd, setPlan, startMembership } from "./server/memberships";
import { getViewer } from "./server/viewer";

export async function startCheckout(formData: FormData) {
  const locale = await getLocale();
  const plan = formData.get("plan");
  const next = safeNextPath(formData.get("next"));
  const viewer = await getViewer();

  // Account first, then payment: come back here with the same plan and destination.
  if (!viewer.user) {
    const back = withNext(`/membership?plan=${isBillingPlan(plan) ? plan : "annual"}`, next);
    return redirect({ href: withNext("/sign-up", back), locale });
  }
  if (viewer.hasAccess) return redirect({ href: next, locale });
  if (!isBillingPlan(plan)) return redirect({ href: withNext("/membership", next), locale });

  const absolute = (path: string) => new URL(getPathname({ href: path, locale }), env.BETTER_AUTH_URL).toString();
  const result = await paymentProvider.startCheckout({
    userId: viewer.user.id,
    email: viewer.user.email,
    plan,
    trialDays: sanctuaryPlan.trialDays,
    locale,
    successUrl: absolute(withNext("/membership/welcome", next)),
    cancelUrl: absolute(withNext(`/membership?plan=${plan}`, next)),
  });

  if (result.kind === "redirect") return redirectExternal(result.url);

  await startMembership({
    userId: viewer.user.id,
    plan,
    provider: paymentProvider.id,
    providerSubscriptionId: result.providerSubscriptionId,
    trialDays: sanctuaryPlan.trialDays,
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
  const plan = formData.get("plan");
  const viewer = await getViewer();
  if (!viewer.user || !viewer.membership || !isBillingPlan(plan)) return redirect({ href: "/profile", locale });

  if (viewer.membership.providerSubscriptionId) {
    await paymentProvider.changePlan(viewer.membership.providerSubscriptionId, plan);
  }
  await setPlan(viewer.user.id, plan);
  return redirect({ href: "/profile", locale });
}
