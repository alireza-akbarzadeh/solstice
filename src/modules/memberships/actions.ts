"use server";

import { getLocale } from "next-intl/server";
import { redirect as redirectExternal } from "next/navigation";

import { env } from "@/env";
import { getPathname, redirect } from "@/i18n/navigation";
import { providerFor } from "@/infrastructure/payment";
import { safeNextPath, withNext } from "@/lib/safe-next";
import { getPaymentMethods, getProviderCurrency, methodsFor } from "@/modules/payments/server/routing";

import { getAllPlans } from "./server/plans";
import { createCheckout, setCheckoutReference } from "./server/billing";
import { setCancelAtPeriodEnd, setPlan } from "./server/memberships";
import { getViewer } from "./server/viewer";

/** Only plans currently on sale can be bought or switched to. */
async function activePlan(value: FormDataEntryValue | null) {
  return (await getAllPlans()).find((p) => p.status === "active" && p.id === value) ?? null;
}

export async function startCheckout(formData: FormData) {
  const locale = await getLocale();
  const plan = await activePlan(formData.get("plan"));
  const next = safeNextPath(formData.get("next"));
  const asked = formData.get("method");
  const viewer = await getViewer();

  // Account first, then payment: come back here with the same plan, method and destination.
  if (!viewer.user) {
    const query = new URLSearchParams();
    if (plan) query.set("plan", plan.id);
    if (typeof asked === "string" && asked) query.set("method", asked);
    const back = withNext(query.size ? `/membership?${query}` : "/membership", next);
    return redirect({ href: withNext("/sign-up", back), locale });
  }
  if (viewer.hasAccess) return redirect({ href: next, locale });
  if (!plan) return redirect({ href: withNext("/membership", next), locale });

  // The visitor's pick wins over the country's preselection, as long as it can sell the plan.
  const usable = methodsFor((await getPaymentMethods()).methods, plan);
  const method = usable.find((m) => m.gateway === asked) ?? usable[0];
  if (!method) return redirect({ href: withNext("/membership", next), locale });
  const { provider, currency } = method;
  const price = plan.prices[currency]!;

  // A checkout record first: the provider's confirmation (webhook or return) completes it.
  const checkout = await createCheckout({ userId: viewer.user.id, plan: { ...plan, price }, currency, provider: provider.id, locale, nextPath: next });
  const absolute = (path: string) => new URL(path, env.BETTER_AUTH_URL).toString();
  const { url, reference } = await provider.createCheckout({
    checkoutId: checkout.id,
    email: viewer.user.email,
    plan: { id: plan.id, price, currency, intervalMonths: plan.intervalMonths },
    trialDays: plan.trialDays,
    locale,
    returnUrl: absolute(`/api/payments/${provider.id}/return?checkout=${checkout.id}`),
    cancelUrl: absolute(getPathname({ href: withNext(`/membership?plan=${plan.id}`, next), locale })),
  });
  if (reference) await setCheckoutReference(checkout.id, reference);
  return redirectExternal(url);
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
