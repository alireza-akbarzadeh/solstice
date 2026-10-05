import { ArrowRightIcon, CircleCheckIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/localized";
import { getVisitorPlanDisplay } from "@/modules/memberships/server/plan-display";

export async function MembershipBanner() {
  const locale = await getLocale();
  const [t, { catalog, money, per }] = await Promise.all([getTranslations("Home.membership"), getVisitorPlanDisplay(locale)]);
  const { entry, featured, trialDays } = catalog;
  const alternative = featured && featured.id !== entry?.id ? featured : null;
  const benefits = [t("benefit1"), t("benefit2"), t("benefit3"), t("benefit4")];

  return (
    <section className="w-full bg-surface py-20 lg:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-on-primary shadow-2xl md:p-10 lg:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -end-24 -top-24 size-96 rounded-full bg-primary-container/40 blur-3xl"
          />
          <div className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <span className="block font-label-md text-label-md tracking-widest text-secondary-fixed uppercase">
                {t("eyebrow")}
              </span>
              <h2 className="font-display text-headline-lg leading-tight text-on-primary lg:text-display">{t("title")}</h2>
              <p className="max-w-xl font-body-lg text-body-lg text-on-primary-container">{t("description")}</p>
              <ul className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2">
                    <CircleCheckIcon className="size-4 shrink-0 text-secondary-fixed" />
                    <span className="font-body-sm text-body-sm text-on-primary">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col justify-between rounded-2xl bg-surface p-8 text-on-surface shadow-xl lg:col-span-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-md text-label-md tracking-wider text-clay uppercase">{t("tier")}</span>
                  {trialDays > 0 && (
                    <span className="rounded bg-secondary-fixed/60 px-2.5 py-1 font-label-sm text-label-sm font-semibold text-on-secondary-fixed">
                      {t("trial", { days: trialDays })}
                    </span>
                  )}
                </div>
                {entry && (
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-display text-primary">{money(entry.price)}</span>
                    <span className="font-body-md text-body-md text-outline">{per(entry.intervalMonths)}</span>
                  </div>
                )}
                {alternative && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t.rich("annual", {
                      name: localize(alternative.name, locale),
                      price: money(alternative.price),
                      per: per(alternative.intervalMonths),
                      strong: (chunks) => <strong className="text-on-surface">{chunks}</strong>,
                    })}
                  </p>
                )}
              </div>
              <div className="mt-8 space-y-3">
                <Link
                  href="/membership"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors duration-300 hover:bg-primary-container"
                >
                  {trialDays > 0 ? t("cta", { days: trialDays }) : t("ctaJoin")}
                  <ArrowRightIcon className="size-4 rtl:rotate-180" />
                </Link>
                <p className="text-center font-label-sm text-label-sm text-outline">{t("reassurance")}</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
