import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";

import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getGiftMembershipByCode } from "@/modules/promotions/server/gifts";
import { PrintButton } from "@/modules/promotions/components/print-button";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/gift/card/[code]">): Promise<Metadata> {
  const { locale, code } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Promotions" });
  return {
    title: t("giftCardMetaTitle", { code }),
  };
}

export default async function GiftCardPage({
  params,
}: PageProps<"/[locale]/gift/card/[code]">) {
  const { locale, code } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, gift] = await Promise.all([
    getTranslations({ locale, namespace: "Promotions" }),
    getGiftMembershipByCode(code),
  ]);

  if (!gift) {
    notFound();
  }

  return (
    <div className="py-space-xl md:py-space-2xl">
      <Container className="max-w-2xl">
        {/* Screen-only action header */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href="/gift"
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
          >
            ← {t("backToGifts")}
          </Link>
          <PrintButton label={t("printCertificate")} />
        </div>

        {/* Printable Serene Gift Certificate */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-clay/40 bg-surface-container-lowest p-8 md:p-12 shadow-ambient print:border-2 print:shadow-none print:m-0">
          {/* Subtle decorative background circles */}
          <div
            aria-hidden
            className="pointer-events-none absolute -end-20 -top-20 size-60 rounded-full bg-secondary-fixed/30 blur-2xl print:hidden"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -start-20 -bottom-20 size-60 rounded-full bg-primary-fixed/30 blur-2xl print:hidden"
          />

          <div className="relative text-center space-y-8">
            {/* Studio Branding */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative size-16">
                <Image
                  src="/images/brand/logo.svg"
                  alt="Arte Yoga Studio"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-label-md text-label-md tracking-widest text-clay uppercase">
                {t("giftCertificateLabel")}
              </span>
            </div>

            {/* Recipient & Months */}
            <div className="space-y-2">
              <span className="font-body-md text-body-md text-on-surface-variant">
                {t("presentedTo")}
              </span>
              <h1 className="font-headline-lg text-headline-lg text-primary">
                {gift.recipientName ?? t("belovedPractitioner")}
              </h1>
              <p className="font-headline-md text-headline-md text-clay">
                {t("monthsSanctuaryAccess", { months: gift.months })}
              </p>
            </div>

            {/* Personalized Message */}
            {gift.personalMessage && (
              <div className="mx-auto max-w-lg rounded-2xl bg-surface-container-low/70 p-6 italic font-body-lg text-body-lg text-on-surface-variant rtl:not-italic border border-outline-variant/30">
                &ldquo;{gift.personalMessage}&rdquo;
                {gift.purchaserName && (
                  <div className="mt-3 text-end font-label-md text-label-md text-on-surface not-italic font-semibold">
                    — {gift.purchaserName}
                  </div>
                )}
              </div>
            )}

            {/* Unique Code Box */}
            <div className="inline-block rounded-2xl border-2 border-dashed border-primary/50 bg-primary-fixed/20 px-8 py-5">
              <span className="block font-label-sm text-label-sm tracking-widest text-clay uppercase mb-1">
                {t("redemptionCode")}
              </span>
              <span className="font-headline-lg text-headline-lg font-mono tracking-widest text-primary">
                {gift.code}
              </span>
            </div>

            {/* Redemption Instructions */}
            <div className="border-t border-outline-variant/30 pt-6 font-body-sm text-body-sm text-on-surface-variant space-y-1">
              <p>{t("howToRedeemInstruction")}</p>
              <p className="font-mono text-primary font-semibold">
                arteyoga.com/gift/redeem
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
