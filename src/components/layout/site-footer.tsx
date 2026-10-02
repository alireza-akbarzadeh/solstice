import { getFooterPages, getPageAssets } from "@/modules/pages/server/library";
import { getLocale, getTranslations } from "next-intl/server";
import { NewsletterForm } from "@/modules/newsletter/components/newsletter-form";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { Container } from "./container";

const curriculumLinks = [
  { href: "/practices", label: "dailyAsana" },
  { href: "/programs", label: "pranayama" },
  { href: "/programs", label: "nidra" },
  { href: "/membership", label: "apprenticeship" },
  { href: "/journal", label: "essays" },
] as const;

const legalLinks = [
  { href: "/privacy", label: "privacy" },
  { href: "/terms", label: "terms" },
  { href: "/ethics", label: "ethics" },
] as const;

export async function SiteFooter({ className }: { className?: string }) {
  const locale = await getLocale();
  const [t, pages, assets] = await Promise.all([
    getTranslations("Footer"),
    getFooterPages(locale).catch(() => []),
    getPageAssets("site-settings"),
  ]);

  return (
    <footer
      className={cn(
        "border-border/40 bg-surface-container-low text-on-surface w-full border-t",
        className,
      )}
    >
      <Container className="pt-space-2xl pb-space-xl">
        {/* Main Grid */}
        <div className="mb-space-2xl gap-space-xl lg:gap-gutter grid grid-cols-1 lg:grid-cols-12">
          {/* Brand / Quote Section */}
          <div className="space-y-space-md lg:pe-space-lg flex flex-col justify-between lg:col-span-5">
            <div className="space-y-space-sm">
              <span className="font-label-md text-label-md text-clay block tracking-widest uppercase">
                {t("eyebrow")}
              </span>
              <blockquote className="font-headline-md text-headline-md text-primary leading-relaxed italic rtl:not-italic">
                {t("quote")}
              </blockquote>
              <p className="font-label-md text-label-md text-on-surface-variant tracking-wider uppercase">
                {t("attribution")}
              </p>
            </div>

            {/* Social Media Links */}
            <div className="pt-space-md">
              <span className="mb-space-xs text-muted-foreground block text-xs font-semibold tracking-wider uppercase">
                Connect
              </span>
              <div className="flex items-center gap-2">
                {/* Instagram */}
                <a
                  href={assets.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="border-border/60 bg-surface text-on-surface-variant hover:border-primary/40 hover:bg-primary/10 hover:text-primary flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-95"
                >
                  <svg
                    className="h-4 w-4 fill-none stroke-current stroke-2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href={assets.youtube}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="border-border/60 bg-surface text-on-surface-variant hover:border-primary/40 hover:bg-primary/10 hover:text-primary flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-95"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>

                {/* X / Twitter */}
                <a
                  href={assets.socialX}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X (Twitter)"
                  className="border-border/60 bg-surface text-on-surface-variant hover:border-primary/40 hover:bg-primary/10 hover:text-primary flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-95"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="border-border/60 bg-surface/80 p-space-lg flex flex-col justify-center rounded-2xl border shadow-sm backdrop-blur-sm lg:col-span-4 lg:col-start-6">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-1 font-semibold">
              {t("newsletterTitle")}
            </h2>
            <p className="mb-space-md font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {t("newsletterBody")}
            </p>
            <NewsletterForm source="footer" />
          </div>

          {/* Navigation Links */}
          <div className="space-y-space-xs lg:col-span-2 lg:col-start-11">
            <h2 className="font-label-md text-label-md text-clay mb-3 tracking-widest uppercase">
              {t("curriculum")}
            </h2>
            <nav className="flex flex-col gap-2.5">
              {curriculumLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  {t(link.label)}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-hairline/60 pt-space-md font-body-sm text-body-sm text-outline flex flex-col items-center justify-between gap-4 border-t sm:flex-row">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          <div className="gap-space-md flex flex-wrap items-center justify-center">
            {pages.map((page) => (
              <Link
                key={page.slug}
                href={`/${page.slug}`}
                className="hover:text-on-surface-variant transition-colors"
              >
                {page.title}
              </Link>
            ))}
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-on-surface-variant transition-colors"
              >
                {t(link.label)}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
