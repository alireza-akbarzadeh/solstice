import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { NewsletterForm } from "@/modules/newsletter/components/newsletter-form";
import { getFooterPages, getPageAssets } from "@/modules/pages/server/library";

import { BrandLockup } from "./brand-lockup";
import { Container } from "./container";

const exploreLinks = [
  { href: "/practices", label: "practices" },
  { href: "/programs", label: "programs" },
  { href: "/journal", label: "journal" },
] as const;
const studioLinks = [
  { href: "/about", label: "about" },
  { href: "/membership", label: "membership" },
  { href: "/sign-in", label: "signIn" },
] as const;
const legalLinks = [
  { href: "/privacy", label: "privacy" },
  { href: "/terms", label: "terms" },
  { href: "/ethics", label: "ethics" },
] as const;
const linkStyle =
  "w-fit py-1 text-sm text-on-surface-variant transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

export async function SiteFooter({ className }: { className?: string }) {
  const locale = await getLocale();
  const [t, nav, brand, metadata, pages, assets] = await Promise.all([
    getTranslations("Footer"),
    getTranslations("Nav"),
    getTranslations("Brand"),
    getTranslations("Metadata"),
    getFooterPages(locale).catch(() => []),
    getPageAssets("site-settings"),
  ]);
  return (
    <footer
      id="site-footer"
      className={cn("bg-surface-container text-on-surface w-full", className)}
    >
      <section
        aria-labelledby="footer-newsletter-title"
        className="bg-primary text-on-primary"
      >
        <Container className="grid items-center gap-7 py-10 md:grid-cols-2 md:gap-16 md:py-12">
          <div className="max-w-md">
            <h2
              id="footer-newsletter-title"
              className="font-headline-md text-headline-md text-on-primary md:font-headline-lg-mobile md:text-headline-lg-mobile"
            >
              {t("newsletterTitle")}
            </h2>
            <p className="text-on-primary/80 mt-3 text-sm leading-relaxed">
              {t("newsletterDescription")}
            </p>
          </div>
          <div className="w-full max-w-lg md:justify-self-end">
            <NewsletterForm source="footer" tone="primary" />
          </div>
        </Container>
      </section>

      <Container className="pt-12 pb-6 md:pt-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 pb-10 md:grid-cols-12 md:gap-x-8 md:pb-14">
          <div className="col-span-2 md:col-span-5 md:pe-12">
            <Link
              href="/"
              className="focus-visible:outline-primary inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
              aria-label={`${brand("name")} ${brand("studio")}`}
            >
              <BrandLockup
                name={brand("name")}
                studio={brand("studio")}
                logoAlt={brand("logoAlt")}
              />
            </Link>
            <p className="font-headline-sm text-headline-sm text-primary mt-5 max-w-xs">
              {t("statement")}
            </p>
            <p className="text-on-surface-variant mt-3 max-w-xs text-sm leading-relaxed">
              {t("eyebrow")}
            </p>
          </div>
          <nav
            aria-label={t("explore")}
            className="flex flex-col gap-2 md:col-span-2"
          >
            <h2 className="mb-2 font-sans text-sm font-semibold">
              {t("explore")}
            </h2>
            {exploreLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkStyle}>
                {nav(link.label)}
              </Link>
            ))}
            {pages.map((page) => (
              <Link
                key={page.slug}
                href={`/${page.slug}`}
                className={cn(linkStyle, "max-w-full break-words")}
              >
                {page.title}
              </Link>
            ))}
          </nav>
          <nav
            aria-label={t("studio")}
            className="flex flex-col gap-2 md:col-span-2"
          >
            <h2 className="mb-2 font-sans text-sm font-semibold">
              {t("studio")}
            </h2>
            {studioLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkStyle}>
                {nav(link.label)}
              </Link>
            ))}
          </nav>
          <div className="col-span-2 md:col-span-3">
            <h2 className="mb-4 font-sans text-sm font-semibold">
              {t("connect")}
            </h2>
            <div className="flex flex-wrap gap-2">
              <a
                href={assets.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="border-primary/15 hover:bg-primary hover:text-on-primary focus-visible:outline-primary flex size-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-[18px] fill-none stroke-current"
                  strokeWidth="1.6"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r=".8"
                    className="fill-current stroke-none"
                  />
                </svg>
              </a>
              <a
                href={assets.youtube}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="border-primary/15 hover:bg-primary hover:text-on-primary focus-visible:outline-primary flex size-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-[18px] fill-none stroke-current"
                  strokeWidth="1.6"
                >
                  <rect x="2" y="5" width="20" height="14" rx="4" />
                  <path
                    d="m10 9 5 3-5 3Z"
                    className="fill-current stroke-none"
                  />
                </svg>
              </a>
              <a
                href={assets.socialX}
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                className="border-primary/15 hover:bg-primary hover:text-on-primary focus-visible:outline-primary flex size-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 fill-current"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="border-primary/10 text-on-surface-variant flex flex-col gap-4 border-t pt-6 text-xs md:flex-row md:items-center md:justify-between">
          <p>
            {t("copyrightLine", {
              year: new Date().getFullYear(),
              studio: metadata("title"),
            })}
          </p>
          <nav
            aria-label={t("legal")}
            className="flex flex-wrap gap-x-5 gap-y-2"
          >
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-primary focus-visible:outline-primary py-1 transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {t(link.label)}
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  );
}
