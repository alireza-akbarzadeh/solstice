import "@/styles/globals.css";

import { CompassIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getDirection, routing } from "@/i18n/routing";
import { fontVariables } from "@/styles/fonts";

export const metadata: Metadata = { title: "404", robots: { index: false } };

/**
 * The 404 for requests that never reach a locale: paths the middleware skips (anything with a
 * dot, like /old-page.html) and, in a production build, unmatched top-level paths. The language
 * is unknown here, so it speaks both. Everything inside a locale uses [locale]/not-found.tsx.
 */
export default async function RootNotFound() {
  const versions = await Promise.all(
    routing.locales.map(async (locale) => ({
      locale,
      t: await getTranslations({ locale, namespace: "NotFound" }),
      home: locale === routing.defaultLocale ? "/" : `/${locale}`,
    })),
  );

  return (
    <html lang={routing.defaultLocale} className={fontVariables}>
      <body className="flex min-h-svh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-space-lg bg-surface-container-low px-margin-mobile py-space-2xl text-center">
          <Image src="/images/brand/logo.svg" alt="" width={64} height={64} unoptimized />
          <CompassIcon aria-hidden className="size-6 text-clay" />
          <div className="grid w-full max-w-3xl grid-cols-1 gap-space-lg md:grid-cols-2">
            {versions.map(({ locale, t, home }) => (
              <section key={locale} lang={locale} dir={getDirection(locale)} className="flex flex-col items-center gap-space-sm">
                <p className="font-label-md text-label-md tracking-widest text-clay uppercase">{t("eyebrow")}</p>
                <h1 className="font-headline-md text-headline-md tracking-tight text-primary">{t("title")}</h1>
                <p className="max-w-sm font-body-md text-body-md text-on-surface-variant">{t("body")}</p>
                <Link
                  href={home}
                  className="rounded-lg bg-primary px-5 py-2.5 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container"
                >
                  {t("home")}
                </Link>
              </section>
            ))}
          </div>
        </main>
      </body>
    </html>
  );
}
