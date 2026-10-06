"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon, CopyIcon, HeartHandshakeIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";

import type { MemberReferralSummary } from "../types";

export function MemberReferralCard({
  summary,
  baseUrl,
}: {
  summary: MemberReferralSummary;
  baseUrl: string;
}) {
  const t = useTranslations("Promotions");
  const [copied, setCopied] = useState(false);

  const fullShareUrl = `${baseUrl.replace(/\/$/, "")}${summary.referralLink}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      toast.success(t("linkCopied"));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("shareTitle"),
          text: t("shareMessage"),
          url: fullShareUrl,
        });
      } catch {
        // User canceled or failed
      }
    } else {
      handleCopy();
    }
  };

  const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(fullShareUrl)}&text=${encodeURIComponent(t("shareMessage"))}`;
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`${t("shareMessage")} ${fullShareUrl}`)}`;

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 sm:p-8 space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-fixed text-on-secondary-fixed">
          <HeartHandshakeIcon className="size-6" />
        </div>
        <div>
          <span className="font-label-sm text-label-sm tracking-wider text-clay uppercase">
            {t("referralEyebrow")}
          </span>
          <h2 className="mt-1 font-headline-md text-headline-md text-on-surface">
            {t("referralTitle")}
          </h2>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant max-w-xl">
            {t("referralDesc")}
          </p>
        </div>
      </div>

      {/* Share link input & copy button */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 font-mono text-body-sm text-on-surface truncate select-all">
          {fullShareUrl}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary/90"
        >
          {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          {copied ? t("copied") : t("copyLink")}
        </button>
      </div>

      {/* Share options */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="font-label-sm text-label-sm text-on-surface-variant me-2">
          {t("shareVia")}:
        </span>
        <a
          href={telegramShare}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface px-3 py-1.5 font-label-sm text-label-sm text-on-surface hover:bg-surface-container transition-colors"
        >
          Telegram
        </a>
        <a
          href={whatsappShare}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface px-3 py-1.5 font-label-sm text-label-sm text-on-surface hover:bg-surface-container transition-colors"
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface px-3 py-1.5 font-label-sm text-label-sm text-on-surface hover:bg-surface-container transition-colors"
        >
          <Share2Icon className="size-3.5" />
          {t("more")}
        </button>
      </div>

      {/* Referral Statistics */}
      <div className="grid grid-cols-3 gap-3 border-t border-outline-variant/20 pt-5">
        <div className="text-center sm:text-start">
          <span className="font-label-sm text-label-sm text-clay uppercase">
            {t("friendsInvited")}
          </span>
          <p className="mt-1 font-headline-md text-headline-md text-primary">
            {summary.totalInvited}
          </p>
        </div>
        <div className="text-center sm:text-start">
          <span className="font-label-sm text-label-sm text-clay uppercase">
            {t("membersJoined")}
          </span>
          <p className="mt-1 font-headline-md text-headline-md text-primary">
            {summary.totalRewarded}
          </p>
        </div>
        <div className="text-center sm:text-start">
          <span className="font-label-sm text-label-sm text-clay uppercase">
            {t("freeMonthsEarned")}
          </span>
          <p className="mt-1 font-headline-md text-headline-md text-primary">
            {summary.freeMonthsEarned}
          </p>
        </div>
      </div>
    </div>
  );
}
