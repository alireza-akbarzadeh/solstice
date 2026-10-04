"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { refundPayment, type RefundResult } from "@/modules/memberships/server/billing";
import { getViewer } from "@/modules/memberships/server/viewer";

export type RefundActionResult = RefundResult | { ok: false; error: "forbidden" | "invalid" | "failed" };

/** Studio → Revenue: refund what is left of a payment, optionally ending the member's access now. */
export async function refundPaymentAction(input: unknown): Promise<RefundActionResult> {
  if ((await getViewer()).user?.role !== "instructor") return { ok: false, error: "forbidden" };
  const parsed = z.object({ id: z.number().int().positive(), endAccess: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const result = await refundPayment(parsed.data.id, parsed.data.endAccess);
    if (result.ok) revalidatePath("/[locale]", "layout");
    return result;
  } catch (error) {
    console.error("Refund failed.", error);
    return { ok: false, error: "failed" };
  }
}
