"use client";

import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";
import { CheckIcon, GiftIcon, LoaderCircleIcon, SparklesIcon } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { formatMoney, type Currency, type MembershipPlan } from "@/modules/memberships/plans";
import { startGiftCheckout } from "../actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-label-lg text-label-lg text-on-primary shadow-md transition-colors hover:bg-primary-container disabled:opacity-75"
    >
      {pending ? <LoaderCircleIcon className="size-4 animate-spin" /> : <GiftIcon className="size-4" />}
      {label}
    </button>
  );
}

export function GiftPurchaseForm({
  plan,
  currency,
  user,
}: {
  plan: MembershipPlan;
  currency: Currency;
  user: { name?: string | null; email?: string | null } | null;
}) {
  const t = useTranslations("Promotions");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const [selectedMonths, setSelectedMonths] = useState<number>(3);

  const basePrice = plan.prices[currency] ?? plan.price;
  const getGiftPrice = (months: number) => {
    let price = basePrice * months;
    if (months === 3) price = Math.round(basePrice * 3 * 0.95);
    else if (months === 6) price = Math.round(basePrice * 6 * 0.9);
    else if (months === 12) price = Math.round(basePrice * 12 * 0.8);
    return price;
  };

  const durations = [
    { months: 1, label: t("months1"), badge: null },
    { months: 3, label: t("months3"), badge: t("save5") },
    { months: 6, label: t("months6"), badge: t("save10") },
    { months: 12, label: t("months12"), badge: t("save20") },
  ];

  const currentPriceFormatted = formatMoney(
    format,
    getGiftPrice(selectedMonths),
    currency,
    locale,
  );

  return (
    <form action={startGiftCheckout} className="space-y-8">
      <input type="hidden" name="months" value={selectedMonths} />
      <input type="hidden" name="planId" value={plan.id} />

      {/* Duration selector */}
      <div>
        <label className="block font-label-md text-label-md tracking-wider text-clay uppercase mb-3">
          {t("chooseDuration")}
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {durations.map((d) => {
            const active = selectedMonths === d.months;
            const price = getGiftPrice(d.months);
            return (
              <button
                key={d.months}
                type="button"
                onClick={() => setSelectedMonths(d.months)}
                className={cn(
                  "relative flex flex-col justify-between rounded-2xl p-4 text-start transition-all",
                  active
                    ? "bg-surface-container-lowest ring-2 ring-primary shadow-ambient"
                    : "bg-surface-container-low hover:bg-surface-container",
                )}
              >
                <div className="flex items-start justify-between">
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    {d.label}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full transition-colors",
                      active
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-highest text-transparent",
                    )}
                  >
                    <CheckIcon className="size-3" />
                  </span>
                </div>
                {d.badge && (
                  <span className="mt-2 inline-flex w-fit items-center gap-1 rounded bg-secondary-fixed px-2 py-0.5 font-label-sm text-label-sm font-semibold text-on-secondary-fixed">
                    <SparklesIcon className="size-3" />
                    {d.badge}
                  </span>
                )}
                <div className="mt-4 font-headline-md text-headline-md text-primary">
                  {formatMoney(format, price, currency, locale)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipient and purchaser details */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 space-y-5">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">
          {t("giftDetails")}
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="recipientName" className="block font-label-sm text-label-sm text-on-surface-variant">
              {t("recipientName")}
            </label>
            <input
              id="recipientName"
              name="recipientName"
              required
              placeholder="Elena"
              className="mt-1.5 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="recipientEmail" className="block font-label-sm text-label-sm text-on-surface-variant">
              {t("recipientEmail")} ({t("optionalEmailNote")})
            </label>
            <input
              id="recipientEmail"
              name="recipientEmail"
              type="email"
              placeholder="elena@example.com"
              className="mt-1.5 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="purchaserName" className="block font-label-sm text-label-sm text-on-surface-variant">
              {t("purchaserName")}
            </label>
            <input
              id="purchaserName"
              name="purchaserName"
              defaultValue={user?.name ?? ""}
              required
              placeholder="Sarah"
              className="mt-1.5 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="purchaserEmail" className="block font-label-sm text-label-sm text-on-surface-variant">
              {t("purchaserEmail")}
            </label>
            <input
              id="purchaserEmail"
              name="purchaserEmail"
              type="email"
              defaultValue={user?.email ?? ""}
              required
              placeholder="sarah@example.com"
              className="mt-1.5 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label htmlFor="personalMessage" className="block font-label-sm text-label-sm text-on-surface-variant">
            {t("personalMessage")} ({t("optional")})
          </label>
          <textarea
            id="personalMessage"
            name="personalMessage"
            rows={3}
            placeholder={t("personalMessagePlaceholder")}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
          />
        </div>

        <div className="pt-2">
          <SubmitButton label={t("giftPurchaseButton", { price: currentPriceFormatted })} />
        </div>
      </div>
    </form>
  );
}
