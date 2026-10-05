"use server";

import { revalidatePath } from "next/cache";

import { getViewer } from "@/modules/memberships/server/viewer";
import { paymentSettingsSchema } from "@/modules/payments/schemas";
import { getPaymentSettingsView, savePaymentSettings } from "@/modules/payments/server/settings";
import type { PaymentSettingsView } from "@/modules/payments/types";

export type PaymentSettingsResult =
  | { ok: true; view: PaymentSettingsView }
  | { ok: false; error: "forbidden" | "invalid" | "unsupported" | "missingKeys" | "failed" };

/** Saves gateways, modes, routing and any newly pasted keys; returns what the page should now show. */
export async function savePayments(input: unknown): Promise<PaymentSettingsResult> {
  if ((await getViewer()).user?.role !== "instructor") return { ok: false, error: "forbidden" };
  const parsed = paymentSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const saved = await savePaymentSettings(parsed.data);
    if (!saved.ok) return saved;
  } catch {
    return { ok: false, error: "failed" };
  }
  // Checkout, prices in the visitor's currency and the test panel read these on every page.
  revalidatePath("/[locale]", "layout");
  return { ok: true, view: await getPaymentSettingsView() };
}
