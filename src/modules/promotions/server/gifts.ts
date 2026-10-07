import { randomBytes } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { giftMemberships } from "@/server/db/schema";
import { grantAccess } from "@/modules/instructor/server/members";
import type { GiftMembership } from "../types";
import type { PurchaseGiftValues } from "../schemas";

export function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    random += chars[bytes[i]! % chars.length];
  }
  return `ARTE-${random.slice(0, 3)}-${random.slice(3)}`;
}

export async function createGiftMembership(
  values: PurchaseGiftValues,
  purchaserUserId?: string | null,
  checkoutId?: string | null,
  initialStatus: "active" | "pending_payment" = "active",
): Promise<GiftMembership | null> {
  const id = `gift_${randomBytes(10).toString("hex")}`;
  const code = generateGiftCode();

  const [row] = await db
    .insert(giftMemberships)
    .values({
      id,
      code,
      purchaserUserId: purchaserUserId ?? null,
      purchaserEmail: values.purchaserEmail.trim().toLowerCase(),
      purchaserName: values.purchaserName?.trim() ?? null,
      recipientEmail: values.recipientEmail?.trim().toLowerCase() ?? null,
      recipientName: values.recipientName?.trim() ?? null,
      personalMessage: values.personalMessage?.trim() ?? null,
      months: values.months,
      planId: values.planId,
      checkoutId: checkoutId ?? null,
      status: initialStatus,
    })
    .returning();

  return row ?? null;
}

export async function getGiftMembershipByCode(code: string): Promise<GiftMembership | null> {
  const normalized = code.trim().toUpperCase();
  const [row] = await db
    .select()
    .from(giftMemberships)
    .where(eq(giftMemberships.code, normalized))
    .limit(1);

  return row ?? null;
}

export async function getGiftMembershipById(id: string): Promise<GiftMembership | null> {
  const [row] = await db
    .select()
    .from(giftMemberships)
    .where(eq(giftMemberships.id, id))
    .limit(1);

  return row ?? null;
}

export async function redeemGiftMembership(
  code: string,
  userId: string,
): Promise<{ ok: true; gift: GiftMembership } | { ok: false; error: "notFound" | "alreadyRedeemed" | "canceled" | "failed" }> {
  const gift = await getGiftMembershipByCode(code);
  if (!gift) {
    return { ok: false, error: "notFound" };
  }

  if (gift.status === "redeemed") {
    return { ok: false, error: "alreadyRedeemed" };
  }

  if (gift.status === "canceled" || gift.status === "pending_payment") {
    return { ok: false, error: "canceled" };
  }

  try {
    // 1. Grant paid access via comped pass for the specified months
    await grantAccess(userId, gift.planId, gift.months);

    // 2. Mark gift membership as redeemed
    const [updated] = await db
      .update(giftMemberships)
      .set({
        status: "redeemed",
        redeemedByUserId: userId,
        redeemedAt: new Date(),
      })
      .where(eq(giftMemberships.id, gift.id))
      .returning();

    return { ok: true, gift: updated ?? gift };
  } catch (err) {
    console.error("Failed to redeem gift membership:", err);
    return { ok: false, error: "failed" };
  }
}

export async function listStudioGifts(): Promise<GiftMembership[]> {
  const rows = await db
    .select()
    .from(giftMemberships)
    .orderBy(desc(giftMemberships.createdAt));

  return rows;
}
