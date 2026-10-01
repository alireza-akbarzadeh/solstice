import { WifiOffIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";

// Precached by public/sw.js and shown when a page isn't available offline.
// Deliberately outside (public): no header, session or data — it must render from cache alone.
export const dynamic = "force-static";

export async function generateMetadata({ params }: PageProps<"/[locale]/offline">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Offline" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function OfflinePage({ params }: PageProps<"/[locale]/offline">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Offline");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-surface-container-low px-margin-mobile py-space-2xl text-center">
      <Image src="/images/brand/logo.svg" alt="" width={72} height={72} unoptimized />
      <WifiOffIcon aria-hidden className="size-6 text-clay" />
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">
        {t("title")}
      </h1>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t("body")}</p>
      {/* A GET form without an action reloads the URL the visitor asked for — no JavaScript needed offline. */}
      <form method="get">
        <button
          type="submit"
          className="rounded-full bg-primary px-8 py-3 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container"
        >
          {t("retry")}
        </button>
      </form>
    </main>
  );
}
