import { index } from "drizzle-orm/pg-core";

import { user } from "./auth.ts";
import { checkouts } from "./payments.ts";
import { createTable } from "./table.ts";

/**
 * Promotional discount coupons configured by the instructor.
 * Supports percent or fixed amount, once (first period) or repeating (every period),
 * optional expiry, max redemption limits, and plan restrictions.
 */
export const coupons = createTable(
  "coupon",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    code: d.varchar({ length: 50 }).notNull().unique(),
    discountType: d.text().$type<"percent" | "fixed">().notNull().default("percent"),
    discountValue: d.numeric({ precision: 14, scale: 2, mode: "number" }).notNull(),
    duration: d.text().$type<"once" | "repeating">().notNull().default("once"),
    planId: d.text(),
    maxUses: d.integer(),
    usedCount: d.integer().notNull().default(0),
    expiresAt: d.timestamp({ withTimezone: true }),
    active: d.boolean().notNull().default(true),
    description: d.text(),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [
    index("coupon_code_idx").on(t.code),
    index("coupon_active_idx").on(t.active),
  ],
);

/**
 * Tracks each redemption of a coupon by a member.
 */
export const couponRedemptions = createTable(
  "coupon_redemption",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    couponId: d
      .integer()
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    checkoutId: d.text().references(() => checkouts.id, { onDelete: "set null" }),
    discountAmount: d.numeric({ precision: 14, scale: 2, mode: "number" }).notNull().default(0),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [
    index("coupon_redemption_coupon_idx").on(t.couponId),
    index("coupon_redemption_user_idx").on(t.userId),
  ],
);

/**
 * Gift memberships: purchased for 1, 3, 6, or 12 months.
 * Can be sent by email or presented as a printable serene gift card.
 * Redeemable by any user to grant access.
 */
export const giftMemberships = createTable(
  "gift_membership",
  (d) => ({
    id: d.text().primaryKey(),
    code: d.varchar({ length: 50 }).notNull().unique(),
    purchaserUserId: d.text().references(() => user.id, { onDelete: "set null" }),
    purchaserEmail: d.text().notNull(),
    purchaserName: d.text(),
    recipientEmail: d.text(),
    recipientName: d.text(),
    personalMessage: d.text(),
    months: d.integer().notNull(),
    planId: d.text().notNull(),
    checkoutId: d.text().references(() => checkouts.id, { onDelete: "set null" }),
    status: d
      .text()
      .$type<"pending_payment" | "active" | "redeemed" | "canceled">()
      .notNull()
      .default("active"),
    redeemedByUserId: d.text().references(() => user.id, { onDelete: "set null" }),
    redeemedAt: d.timestamp({ withTimezone: true }),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [
    index("gift_membership_code_idx").on(t.code),
    index("gift_membership_purchaser_idx").on(t.purchaserUserId),
    index("gift_membership_status_idx").on(t.status),
  ],
);

/**
 * Referral program: tracks invitations by existing members.
 * Rewarding grants 1 free month to the referrer and bonus access to the friend.
 */
export const referrals = createTable(
  "referral",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    referrerId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    referredUserId: d
      .text()
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    referralCode: d.varchar({ length: 50 }).notNull(),
    status: d.text().$type<"pending" | "rewarded">().notNull().default("pending"),
    rewardedAt: d.timestamp({ withTimezone: true }),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [
    index("referral_referrer_idx").on(t.referrerId),
    index("referral_referred_user_idx").on(t.referredUserId),
    index("referral_status_idx").on(t.status),
  ],
);
