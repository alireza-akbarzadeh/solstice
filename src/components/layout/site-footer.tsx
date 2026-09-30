import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

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

export async function SiteFooter() {
  const t = await getTranslations("Footer");

  return (
    <footer className="w-full bg-surface-container-low">
      <Container className="pt-space-2xl pb-space-xl">
        <div className="mb-space-2xl grid grid-cols-1 gap-space-xl lg:grid-cols-12 lg:gap-gutter">
          <div className="space-y-space-md lg:col-span-5 lg:pe-space-lg">
            <span className="block font-label-md text-label-md tracking-widest text-clay uppercase">{t("eyebrow")}</span>
            <blockquote className="font-headline-md text-headline-md leading-relaxed text-primary italic rtl:not-italic">
              {t("quote")}
            </blockquote>
            <p className="font-label-md text-label-md tracking-wider text-on-surface-variant uppercase">{t("attribution")}</p>
          </div>

          <div className="flex flex-col justify-center rounded-xl bg-surface p-space-lg lg:col-span-4 lg:col-start-7">
            <h2 className="mb-2 font-headline-sm text-headline-sm text-on-surface">{t("newsletterTitle")}</h2>
            <p className="mb-space-md font-body-sm text-body-sm text-on-surface-variant">{t("newsletterBody")}</p>
            {/* Not wired yet: needs the email provider (see PROGRESS.md). */}
            <form className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="footer-email" className="sr-only">
                {t("emailLabel")}
              </label>
              <input
                id="footer-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                className="min-w-0 flex-1 rounded-lg bg-surface-container-high px-4 py-3 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-6 py-3 font-label-lg text-label-lg text-on-primary transition-colors duration-300 hover:bg-primary-container"
              >
                {t("subscribe")}
              </button>
            </form>
          </div>

          <div className="space-y-space-sm lg:col-span-2 lg:col-start-11">
            <h2 className="mb-2 font-label-md text-label-md tracking-wider text-clay uppercase">{t("curriculum")}</h2>
            <nav className="flex flex-col gap-2">
              {curriculumLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary"
                >
                  {t(link.label)}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-hairline pt-space-lg font-body-sm text-body-sm text-outline sm:flex-row">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap items-center justify-center gap-space-md">
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-on-surface-variant">
                {t(link.label)}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
