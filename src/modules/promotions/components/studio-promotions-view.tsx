"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckIcon,
  ExternalLinkIcon,
  GiftIcon,
  TagIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";

import { cn } from "@/lib/utils";
import type { Coupon, GiftMembership, Referral } from "../types";
import type { MembershipPlan } from "@/modules/memberships/plans";
import { CreateCouponDialog } from "./create-coupon-dialog";
import { CreateGiftPassDialog } from "./create-gift-pass-dialog";
import { deleteCouponAction, toggleCouponActiveAction } from "../actions";

export function StudioPromotionsView({
  coupons,
  gifts,
  referrals,
  plans,
}: {
  coupons: Coupon[];
  gifts: GiftMembership[];
  referrals: {
    referrals: Referral[];
    stats: {
      totalReferrals: number;
      totalRewarded: number;
      activeReferrers: number;
    };
  };
  plans: MembershipPlan[];
}) {
  const t = useTranslations("Promotions");
  const [activeTab, setActiveTab] = useState<"coupons" | "gifts" | "referrals">(
    "coupons",
  );

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      const res = await toggleCouponActiveAction(id, !currentActive);
      if (res.ok) {
        toast.success(t("statusUpdated"));
      } else {
        toast.error(t("updateFailed"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("updateFailed"));
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!window.confirm(t("confirmDeleteCoupon"))) return;
    try {
      const res = await deleteCouponAction(id);
      if (res.ok) {
        toast.success(t("couponDeleted"));
      } else {
        toast.error(t("deleteFailed"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("deleteFailed"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="bg-surface-container border-outline-variant/30 flex rounded-xl border p-1">
          <button
            type="button"
            onClick={() => setActiveTab("coupons")}
            className={cn(
              "font-label-md text-label-md flex items-center gap-2 rounded-lg px-4 py-2 transition-colors",
              activeTab === "coupons"
                ? "bg-surface-container-lowest text-primary font-semibold shadow-xs"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            <TagIcon className="size-4" />
            {t("tabs.coupons")} ({coupons.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gifts")}
            className={cn(
              "font-label-md text-label-md flex items-center gap-2 rounded-lg px-4 py-2 transition-colors",
              activeTab === "gifts"
                ? "bg-surface-container-lowest text-primary font-semibold shadow-xs"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            <GiftIcon className="size-4" />
            {t("tabs.gifts")} ({gifts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("referrals")}
            className={cn(
              "font-label-md text-label-md flex items-center gap-2 rounded-lg px-4 py-2 transition-colors",
              activeTab === "referrals"
                ? "bg-surface-container-lowest text-primary font-semibold shadow-xs"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            <UsersIcon className="size-4" />
            {t("tabs.referrals")} ({referrals.stats.totalReferrals})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "coupons" && <CreateCouponDialog plans={plans} />}
          {activeTab === "gifts" && <CreateGiftPassDialog plans={plans} />}
        </div>
      </div>

      {/* Tab: Coupons */}
      {activeTab === "coupons" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="border-outline-variant/30 bg-surface-container-low rounded-2xl border p-4">
              <span className="font-label-sm text-label-sm text-clay uppercase">
                {t("metrics.totalCoupons")}
              </span>
              <p className="font-headline-md text-headline-md text-primary mt-1">
                {coupons.length}
              </p>
            </div>
            <div className="border-outline-variant/30 bg-surface-container-low rounded-2xl border p-4">
              <span className="font-label-sm text-label-sm text-clay uppercase">
                {t("metrics.activeCoupons")}
              </span>
              <p className="font-headline-md text-headline-md text-primary mt-1">
                {coupons.filter((c) => c.active).length}
              </p>
            </div>
            <div className="border-outline-variant/30 bg-surface-container-low rounded-2xl border p-4">
              <span className="font-label-sm text-label-sm text-clay uppercase">
                {t("metrics.totalRedemptions")}
              </span>
              <p className="font-headline-md text-headline-md text-primary mt-1">
                {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
              </p>
            </div>
          </div>

          {coupons.length === 0 ? (
            <div className="border-outline-variant/30 bg-surface-container-low text-on-surface-variant rounded-2xl border p-8 text-center">
              <TagIcon className="text-outline mx-auto mb-2 size-8" />
              <p className="font-body-md text-body-md">{t("noCouponsYet")}</p>
            </div>
          ) : (
            <div className="border-outline-variant/30 bg-surface-container-low overflow-hidden rounded-2xl border">
              <div className="border-outline-variant/30 bg-surface-container font-label-md text-label-md text-clay hidden grid-cols-12 gap-4 border-b px-6 py-3 uppercase lg:grid">
                <div className="col-span-3">{t("code")}</div>
                <div className="col-span-2">{t("discount")}</div>
                <div className="col-span-2">{t("usage")}</div>
                <div className="col-span-2">{t("plan")}</div>
                <div className="col-span-2">{t("status")}</div>
                <div className="col-span-1 text-end">{t("actions")}</div>
              </div>

              <div className="divide-outline-variant/20 divide-y">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="hover:bg-surface-container/50 flex flex-col gap-3 p-4 transition-colors lg:grid lg:grid-cols-12 lg:items-center lg:px-6 lg:py-4"
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-mono tracking-wider">
                        {coupon.code}
                      </span>
                      {coupon.description && (
                        <span
                          className="text-body-sm text-on-surface-variant max-w-[150px] truncate"
                          title={coupon.description}
                        >
                          ({coupon.description})
                        </span>
                      )}
                    </div>

                    <div className="font-body-md text-body-md text-on-surface col-span-2">
                      {coupon.discountType === "percent"
                        ? `${coupon.discountValue}%`
                        : coupon.discountValue}
                      <span className="font-label-sm text-label-sm text-outline ms-1">
                        (
                        {coupon.duration === "once"
                          ? t("durationOnce")
                          : t("durationRepeating")}
                        )
                      </span>
                    </div>

                    <div className="font-body-sm text-body-sm text-on-surface-variant col-span-2">
                      {coupon.usedCount} / {coupon.maxUses ?? "∞"}
                    </div>

                    <div className="font-body-sm text-body-sm text-on-surface-variant col-span-2">
                      {coupon.planId ? coupon.planId : t("allPlans")}
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleActive(coupon.id, coupon.active)
                        }
                        className={cn(
                          "font-label-sm text-label-sm rounded-full px-2.5 py-0.5 transition-colors",
                          coupon.active
                            ? "bg-primary-fixed text-primary font-medium"
                            : "bg-surface-container-highest text-outline",
                        )}
                      >
                        {coupon.active ? t("active") : t("disabled")}
                      </button>
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-outline hover:bg-error-container hover:text-on-error-container rounded-lg p-1.5 transition-colors"
                        title={t("delete")}
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Gift Memberships */}
      {activeTab === "gifts" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="border-outline-variant/30 bg-surface-container-low rounded-2xl border p-4">
              <span className="font-label-sm text-label-sm text-clay uppercase">
                {t("metrics.totalGifts")}
              </span>
              <p className="font-headline-md text-headline-md text-primary mt-1">
                {gifts.length}
              </p>
            </div>
            <div className="border-outline-variant/30 bg-surface-container-low rounded-2xl border p-4">
              <span className="font-label-sm text-label-sm text-clay uppercase">
                {t("metrics.activeGifts")}
              </span>
              <p className="font-headline-md text-headline-md text-primary mt-1">
                {gifts.filter((g) => g.status === "active").length}
              </p>
            </div>
            <div className="border-outline-variant/30 bg-surface-container-low rounded-2xl border p-4">
              <span className="font-label-sm text-label-sm text-clay uppercase">
                {t("metrics.redeemedGifts")}
              </span>
              <p className="font-headline-md text-headline-md text-primary mt-1">
                {gifts.filter((g) => g.status === "redeemed").length}
              </p>
            </div>
          </div>

          {gifts.length === 0 ? (
            <div className="border-outline-variant/30 bg-surface-container-low text-on-surface-variant rounded-2xl border p-8 text-center">
              <GiftIcon className="text-outline mx-auto mb-2 size-8" />
              <p className="font-body-md text-body-md">{t("noGiftsYet")}</p>
            </div>
          ) : (
            <div className="border-outline-variant/30 bg-surface-container-low overflow-hidden rounded-2xl border">
              <div className="border-outline-variant/30 bg-surface-container font-label-md text-label-md text-clay hidden grid-cols-12 gap-4 border-b px-6 py-3 uppercase lg:grid">
                <div className="col-span-3">{t("giftCode")}</div>
                <div className="col-span-3">{t("recipient")}</div>
                <div className="col-span-2">{t("duration")}</div>
                <div className="col-span-2">{t("status")}</div>
                <div className="col-span-2 text-end">{t("card")}</div>
              </div>

              <div className="divide-outline-variant/20 divide-y">
                {gifts.map((gift) => (
                  <div
                    key={gift.id}
                    className="hover:bg-surface-container/50 flex flex-col gap-3 p-4 transition-colors lg:grid lg:grid-cols-12 lg:items-center lg:px-6 lg:py-4"
                  >
                    <div className="col-span-3 flex flex-col">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-mono tracking-wider">
                        {gift.code}
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">
                        {new Date(gift.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="col-span-3 flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-medium">
                        {gift.recipientName || t("anonymousRecipient")}
                      </span>
                      {gift.recipientEmail && (
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {gift.recipientEmail}
                        </span>
                      )}
                    </div>

                    <div className="font-body-md text-body-md text-on-surface col-span-2">
                      {gift.months} {t("months")}
                    </div>

                    <div className="col-span-2">
                      <span
                        className={cn(
                          "font-label-sm text-label-sm rounded-full px-2.5 py-0.5 font-medium",
                          gift.status === "redeemed"
                            ? "bg-surface-container-highest text-outline"
                            : gift.status === "active"
                              ? "bg-primary-fixed text-primary"
                              : "bg-secondary-fixed text-on-secondary-fixed",
                        )}
                      >
                        {t(`giftStatus.${gift.status}`)}
                      </span>
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <Link
                        href={`/gift/card/${gift.code}`}
                        target="_blank"
                        className="border-outline-variant/40 bg-surface font-label-sm text-label-sm text-primary hover:bg-surface-container inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-colors"
                      >
                        <ExternalLinkIcon className="size-3.5" />
                        {t("viewCard")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Referrals */}
      {activeTab === "referrals" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="border-outline-variant/30 bg-surface-container-low rounded-2xl border p-4">
              <span className="font-label-sm text-label-sm text-clay uppercase">
                {t("metrics.totalReferrals")}
              </span>
              <p className="font-headline-md text-headline-md text-primary mt-1">
                {referrals.stats.totalReferrals}
              </p>
            </div>
            <div className="border-outline-variant/30 bg-surface-container-low rounded-2xl border p-4">
              <span className="font-label-sm text-label-sm text-clay uppercase">
                {t("metrics.activeReferrers")}
              </span>
              <p className="font-headline-md text-headline-md text-primary mt-1">
                {referrals.stats.activeReferrers}
              </p>
            </div>
            <div className="border-outline-variant/30 bg-surface-container-low rounded-2xl border p-4">
              <span className="font-label-sm text-label-sm text-clay uppercase">
                {t("metrics.freeMonthsAwarded")}
              </span>
              <p className="font-headline-md text-headline-md text-primary mt-1">
                {referrals.stats.totalRewarded}
              </p>
            </div>
          </div>

          {referrals.referrals.length === 0 ? (
            <div className="border-outline-variant/30 bg-surface-container-low text-on-surface-variant rounded-2xl border p-8 text-center">
              <UsersIcon className="text-outline mx-auto mb-2 size-8" />
              <p className="font-body-md text-body-md">{t("noReferralsYet")}</p>
            </div>
          ) : (
            <div className="border-outline-variant/30 bg-surface-container-low overflow-hidden rounded-2xl border">
              <div className="border-outline-variant/30 bg-surface-container font-label-md text-label-md text-clay hidden grid-cols-12 gap-4 border-b px-6 py-3 uppercase lg:grid">
                <div className="col-span-4">{t("referrer")}</div>
                <div className="col-span-4">{t("friend")}</div>
                <div className="col-span-2">{t("referralCode")}</div>
                <div className="col-span-2 text-end">{t("status")}</div>
              </div>

              <div className="divide-outline-variant/20 divide-y">
                {referrals.referrals.map((r) => (
                  <div
                    key={r.id}
                    className="hover:bg-surface-container/50 flex flex-col gap-3 p-4 transition-colors lg:grid lg:grid-cols-12 lg:items-center lg:px-6 lg:py-4"
                  >
                    <div className="col-span-4 flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-medium">
                        {r.referrerName || r.referrerEmail || r.referrerId}
                      </span>
                      {r.referrerEmail && (
                        <span className="font-body-sm text-body-sm text-outline">
                          {r.referrerEmail}
                        </span>
                      )}
                    </div>

                    <div className="col-span-4 flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-medium">
                        {r.referredUserName ||
                          r.referredUserEmail ||
                          r.referredUserId}
                      </span>
                      {r.referredUserEmail && (
                        <span className="font-body-sm text-body-sm text-outline">
                          {r.referredUserEmail}
                        </span>
                      )}
                    </div>

                    <div className="text-body-sm text-on-surface col-span-2 font-mono">
                      {r.referralCode}
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <span
                        className={cn(
                          "font-label-sm text-label-sm rounded-full px-2.5 py-0.5 font-medium",
                          r.status === "rewarded"
                            ? "bg-primary-fixed text-primary"
                            : "bg-surface-container-highest text-outline",
                        )}
                      >
                        {r.status === "rewarded" ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckIcon className="size-3" />
                            {t("rewarded")}
                          </span>
                        ) : (
                          t("pending")
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
