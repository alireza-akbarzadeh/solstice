import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { GiftIcon } from "lucide-react";

import { Container } from "@/components/layout/container";
import { routing } from "@/i18n/routing";
import { getViewer } from "@/modules/memberships/server/viewer";
import { GiftRedeemForm } from "@/modules/promotions/components/gift-redeem-form";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/gift/redeem">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Promotions" });
  return {
    title: t("redeemMetaTitle"),
    description: t("redeemMetaDesc"),
  };
}

export default async function GiftRedeemPage({
  params,
  searchParams,
}: PageProps<"/[locale]/gift/redeem">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const query = await searchParams;
  const initialCode = typeof query.code === "string" ? query.code : undefined;

  const [t, viewer] = await Promise.all([
    getTranslations({ locale, namespace: "Promotions" }),
    getViewer(),
  ]);

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -start-24 -top-24 -z-10 size-96 rounded-full bg-primary-fixed/30 blur-3xl"
      />

      <Container className="py-space-xl md:py-space-2xl max-w-xl">
        <div className="space-y-8 text-center sm:text-start">
          <div className="space-y-2 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
              <GiftIcon className="size-6" />
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary">
              {t("redeemTitle")}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
              {t("redeemDesc")}
            </p>
          </div>

          <GiftRedeemForm
            initialCode={initialCode}
            signedIn={!!viewer.user}
          />
        </div>
      </Container>
    </div>
  );
}
