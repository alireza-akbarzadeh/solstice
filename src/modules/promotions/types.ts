export type CouponDiscountType = "percent" | "fixed";
export type CouponDuration = "once" | "repeating";

export type Coupon = {
  id: number;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  duration: CouponDuration;
  planId: string | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  active: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CouponValidationResult =
  | {
      valid: true;
      coupon: {
        id: number;
        code: string;
        discountType: CouponDiscountType;
        discountValue: number;
        duration: CouponDuration;
      };
      discountAmount: number;
      finalAmount: number;
    }
  | {
      valid: false;
      error: "notFound" | "expired" | "maxUsesReached" | "invalidPlan" | "inactive";
    };

export type GiftMembershipStatus = "pending_payment" | "active" | "redeemed" | "canceled";

export type GiftMembership = {
  id: string;
  code: string;
  purchaserUserId: string | null;
  purchaserEmail: string;
  purchaserName: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  personalMessage: string | null;
  months: number;
  planId: string;
  checkoutId: string | null;
  status: GiftMembershipStatus;
  redeemedByUserId: string | null;
  redeemedAt: Date | null;
  createdAt: Date;
};

export type ReferralStatus = "pending" | "rewarded";

export type Referral = {
  id: number;
  referrerId: string;
  referrerName: string | null;
  referrerEmail: string | null;
  referredUserId: string;
  referredUserName: string | null;
  referredUserEmail: string | null;
  referralCode: string;
  status: ReferralStatus;
  rewardedAt: Date | null;
  createdAt: Date;
};

export type MemberReferralSummary = {
  referralCode: string;
  referralLink: string;
  totalInvited: number;
  totalRewarded: number;
  freeMonthsEarned: number;
};
