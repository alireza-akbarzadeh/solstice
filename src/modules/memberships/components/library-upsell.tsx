import { ArrowRightIcon, CircleCheckIcon, SparklesIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { getVisitorPlanDisplay } from "../server/plan-display";

// Membership invitation at the foot of the practice library (hidden for members by the page).
export async function LibraryUpsell({ openCount }: { openCount: number }) {
  const locale = await getLocale();
  const [t, { catalog, money, per }] = await Promise.all([getTranslations("Practices.banner"), getVisitorPlanDisplay(locale)]);
  const { entry, trialDays } = catalog;
  const benefits = [t("benefit1"), t("benefit2"), t("benefit3")];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary p-space-lg text-on-primary shadow-xl lg:p-space-xl">
      <div aria-hidden className="pointer-events-none absolute -end-24 -bottom-24 size-96 rounded-full bg-clay/30 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute end-1/3 top-0 size-64 rounded-full bg-primary-container/40 blur-xl" />

      <div className="relative z-10 grid grid-cols-1 items-center gap-gutter lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-on-primary/10 px-3.5 py-1.5 font-label-sm text-label-sm tracking-widest text-on-primary-container uppercase backdrop-blur-sm">
            <SparklesIcon className="size-3" />
            {t("badge")}
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile leading-tight font-normal tracking-tight text-on-primary md:font-headline-lg md:text-headline-lg">
            {t("title", { count: openCount })}
          </h2>
          <p className="max-w-2xl font-body-lg text-body-lg text-on-primary-container">{t("body")}</p>
          <ul className="flex flex-wrap items-center gap-6 pt-2 font-body-sm text-body-sm text-on-primary/80">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2">
                <CircleCheckIcon className="size-4 text-secondary-fixed" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-start justify-center lg:col-span-4 lg:items-end">
          <div className="w-full max-w-sm space-y-4 rounded-xl bg-surface/95 p-space-md text-on-surface shadow-lg backdrop-blur-md">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              {entry && (
                <div>
                  <span className="font-headline-md text-headline-md text-primary">{money(entry.price)}</span>
                  <span className="font-body-sm text-body-sm text-outline"> {per(entry.intervalMonths)}</span>
                </div>
              )}
              {trialDays > 0 && (
                <span className="rounded bg-secondary-fixed px-2 py-0.5 font-label-sm text-label-sm font-semibold tracking-wider text-clay uppercase">
                  {t("trial", { days: trialDays })}
                </span>
              )}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t("cardBody")}</p>
            <div className="space-y-2 pt-1">
              <Link
                href="/membership"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container"
              >
                {t("cta")}
                <ArrowRightIcon className="size-4 rtl:rotate-180" />
              </Link>
              <p className="text-center font-label-sm text-label-sm text-outline">{t("note")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
