import { CompassIcon } from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getDirection, routing, type Locale } from "@/i18n/routing";

/**
 * Shown for an unknown path, and whenever a page calls notFound(). Next does not pass params to
 * not-found.tsx, so the locale comes from the request that next-intl's middleware already
 * resolved. Kept self-contained — no header, session or data — because it also answers for
 * paths that never matched a route group.
 */
export default async function NotFound() {
  // A path outside both locales can still land here; fall back rather than throw on a 404 page.
  let locale: Locale = routing.defaultLocale;
  try {
    locale = await getLocale();
  } catch {
    // Keep the default.
  }

  const t = await getTranslations({ locale, namespace: "NotFound" });

  const links = [
    { href: "/", label: t("home") },
    { href: "/practices", label: t("practices") },
    { href: "/journal", label: t("journal") },
  ] as const;

  return (
    <main
      dir={getDirection(locale)}
      className="flex flex-1 flex-col items-center justify-center gap-space-md bg-surface-container-low px-margin-mobile py-space-2xl text-center"
    >
      <Image src="/icons/mark.svg" alt="" width={64} height={64} unoptimized />
      <CompassIcon aria-hidden className="size-6 text-clay" />
      <p className="font-label-md text-label-md tracking-widest text-clay uppercase">{t("eyebrow")}</p>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
        {t("title")}
      </h1>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t("body")}</p>

      <nav aria-label={t("eyebrow")} className="mt-space-sm flex flex-wrap items-center justify-center gap-space-xs">
        {links.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            locale={locale}
            className={
              i === 0
                ? "rounded-full bg-primary px-6 py-2.5 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container"
                : "rounded-full bg-surface-container px-6 py-2.5 font-label-lg text-label-lg text-on-surface transition-colors hover:bg-surface-container-high"
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
