import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { couponRedemptions, coupons } from "@/server/db/schema";
import type { Coupon, CouponValidationResult } from "../types";
import type { CouponFormValues } from "../schemas";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function listCoupons(): Promise<Coupon[]> {
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return rows.map((r) => ({
    ...r,
    discountValue: Number(r.discountValue),
  }));
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const [row] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.trim().toUpperCase()))
    .limit(1);

  if (!row) return null;
  return {
    ...row,
    discountValue: Number(row.discountValue),
  };
}

export async function validateCoupon(
  code: string,
  planId: string,
  baseAmount: number,
): Promise<CouponValidationResult> {
  const coupon = await getCouponByCode(code);
  if (!coupon) {
    return { valid: false, error: "notFound" };
  }

  if (!coupon.active) {
    return { valid: false, error: "inactive" };
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { valid: false, error: "expired" };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: "maxUsesReached" };
  }

  if (coupon.planId && coupon.planId !== planId) {
    return { valid: false, error: "invalidPlan" };
  }

  let discountAmount = 0;
  if (coupon.discountType === "percent") {
    discountAmount = Math.round((baseAmount * coupon.discountValue) / 100);
  } else {
    discountAmount = Math.min(baseAmount, coupon.discountValue);
  }

  const finalAmount = Math.max(0, baseAmount - discountAmount);

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      duration: coupon.duration,
    },
    discountAmount,
    finalAmount,
  };
}

export async function createCoupon(values: CouponFormValues): Promise<Coupon | null> {
  const normalizedCode = values.code.trim().toUpperCase();
  const expiresAt = values.expiresAt ? new Date(values.expiresAt) : null;
  const maxUsesRaw = values.maxUses;
  const maxUsesNum =
    maxUsesRaw !== null && maxUsesRaw !== undefined && maxUsesRaw !== ""
      ? Number(maxUsesRaw)
      : null;
  const maxUses = typeof maxUsesNum === "number" && !Number.isNaN(maxUsesNum) ? maxUsesNum : null;

  const [created] = await db
    .insert(coupons)
    .values({
      code: normalizedCode,
      discountType: values.discountType,
      discountValue: Number(values.discountValue),
      duration: (values.duration as "once" | "repeating") ?? "once",
      planId: values.planId || null,
      maxUses,
      expiresAt,
      active: values.active ?? true,
      description: values.description?.trim() || null,
    })
    .returning();

  if (!created) return null;
  return {
    ...created,
    discountValue: Number(created.discountValue),
  };
}

export async function toggleCouponActive(id: number, active: boolean): Promise<boolean> {
  await db
    .update(coupons)
    .set({ active, updatedAt: new Date() })
    .where(eq(coupons.id, id));
  return true;
}

export async function deleteCoupon(id: number): Promise<boolean> {
  await db.delete(coupons).where(eq(coupons.id, id));
  return true;
}

export async function recordCouponRedemption(
  txOrDb: Tx | typeof db,
  input: {
    couponId: number;
    userId: string;
    checkoutId?: string | null;
    discountAmount: number;
  },
) {
  await txOrDb.insert(couponRedemptions).values({
    couponId: input.couponId,
    userId: input.userId,
    checkoutId: input.checkoutId ?? null,
    discountAmount: input.discountAmount,
  });

  await txOrDb
    .update(coupons)
    .set({
      usedCount: sql`${coupons.usedCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(coupons.id, input.couponId));
}
