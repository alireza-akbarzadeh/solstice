"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2Icon, GiftIcon, LoaderCircleIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";

import { redeemGiftAction } from "../actions";
import type { GiftMembership } from "../types";

export function GiftRedeemForm({
  initialCode,
  signedIn,
}: {
  initialCode?: string;
  signedIn: boolean;
}) {
  const t = useTranslations("Promotions");
  const [code, setCode] = useState(initialCode ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redeemedGift, setRedeemedGift] = useState<GiftMembership | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    if (!signedIn) {
      toast.info(t("signInToRedeem"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await redeemGiftAction(code);
      if (res.ok && res.data) {
        setRedeemedGift(res.data as GiftMembership);
        toast.success(t("redeemSuccess"));
      } else {
        const errMap: Record<string, string> = {
          not_found: t("redeemErrors.not_found"),
          already_redeemed: t("redeemErrors.already_redeemed"),
          unpaid: t("redeemErrors.unpaid"),
          failed: t("redeemErrors.failed"),
        };
        const errKey = !res.ok ? res.error : "failed";
        setError(errMap[errKey] ?? t("redeemErrors.failed"));
      }
    } catch (err) {
      console.error(err);
      setError(t("redeemErrors.failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (redeemedGift) {
    return (
      <div className="rounded-2xl border border-primary/40 bg-surface-container-lowest p-8 text-center shadow-ambient space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <CheckCircle2Icon className="size-8" />
        </div>
        <h2 className="font-headline-md text-headline-md text-primary">
          {t("redeemWelcomeTitle")}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
          {t("redeemWelcomeDesc", { months: redeemedGift.months })}
        </p>
        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-label-lg text-label-lg text-on-primary shadow-md hover:bg-primary/90 transition-colors"
          >
            <SparklesIcon className="size-4" />
            {t("enterSanctuary")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 sm:p-8 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="gift-code" className="block font-label-md text-label-md text-clay uppercase tracking-wider mb-2">
            {t("enterGiftCode")}
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="gift-code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="ARTE-ABC-123"
              className="h-12 flex-1 rounded-xl border border-outline-variant/40 bg-surface px-4 font-headline-sm text-headline-sm uppercase tracking-widest text-on-surface placeholder:normal-case placeholder:tracking-normal placeholder:font-body-md placeholder:text-outline focus:border-primary focus:outline-hidden text-center sm:text-start"
            />
            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <GiftIcon className="size-4" />
              )}
              {t("redeemPass")}
            </button>
          </div>
        </div>

        {error && (
          <p className="font-body-sm text-body-sm text-error">{error}</p>
        )}

        {!signedIn && (
          <div className="rounded-xl bg-secondary-fixed/50 p-4 text-center sm:text-start flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="font-body-sm text-body-sm text-on-secondary-fixed">
              {t("guestRedeemNotice")}
            </p>
            <Link
              href={`/sign-in?next=/gift/redeem?code=${encodeURIComponent(code)}`}
              className="inline-flex justify-center rounded-lg bg-surface px-4 py-2 font-label-md text-label-md text-on-surface border border-outline-variant/30 hover:bg-surface-container transition-colors shrink-0"
            >
              {t("signInFirst")}
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
