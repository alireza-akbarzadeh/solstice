"use server";

import { randomBytes } from "node:crypto";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect as redirectExternal } from "next/navigation";

import { getPathname, redirect } from "@/i18n/navigation";
import { paymentProvider } from "@/infrastructure/payment";
import { formText } from "@/lib/form-data";
import { auth } from "@/server/better-auth";

import { isBillingPlan, sanctuaryPlan } from "./plans";
import { startMembership } from "./server/memberships";
import {
  applyMembershipPreset,
  assertTestMode,
  sameSiteUrl,
  setUserRole,
  testCards,
  TEST_PASSWORD,
} from "./server/test-mode";
import { getViewer } from "./server/viewer";
import { membershipPresets, type MembershipPreset } from "./test-presets";

// The mock provider's "hosted page" settles here, standing in for a payment webhook.
export async function completeTestCheckout(formData: FormData) {
  assertTestMode();
  const locale = await getLocale();
  const plan = formData.get("plan");
  const success = sameSiteUrl(formData.get("success"));
  const cancel = sameSiteUrl(formData.get("cancel"));
  const card = formText(formData, "card").replace(/\D/g, "");

  const viewer = await getViewer();
  if (!viewer.user) return redirect({ href: "/sign-in", locale });
  if (!isBillingPlan(plan) || !success || !cancel) return redirect({ href: "/membership", locale });

  const back = (error: string) =>
    redirect({ href: { pathname: "/checkout/test", query: { plan, success, cancel, error } }, locale });
  if (card === testCards.declined) return back("declined");
  if (card !== testCards.approved) return back("unknownCard");

  await startMembership({
    userId: viewer.user.id,
    plan,
    provider: paymentProvider.id,
    providerSubscriptionId: `mock_${viewer.user.id}_${Date.now()}`,
    trialDays: sanctuaryPlan.trialDays,
  });
  return redirectExternal(success);
}

export async function setTestMembership(preset: MembershipPreset) {
  assertTestMode();
  if (!membershipPresets.includes(preset)) return;
  const viewer = await getViewer();
  if (!viewer.user) return;
  await applyMembershipPreset(viewer.user.id, preset, sanctuaryPlan.trialDays);
  revalidatePath("/", "layout");
}

export async function setTestRole(role: "member" | "instructor") {
  assertTestMode();
  if (role !== "member" && role !== "instructor") return;
  const viewer = await getViewer();
  if (!viewer.user) return;
  await setUserRole(viewer.user.id, role);
  revalidatePath("/", "layout");
}

// A fresh signed-in account in one click, so every state can be tried from scratch.
export async function createTestAccount() {
  assertTestMode();
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
