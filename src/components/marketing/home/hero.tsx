import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { getPageAssets } from "@/modules/pages/server/request";

import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { sanctuaryPlan } from "@/modules/memberships/plans";
import { getViewer } from "@/modules/memberships/server/viewer";

export async function Hero() {
  const [t, viewer, assets] = await Promise.all([
    getTranslations("Home.hero"),
    getViewer(),
    getPageAssets("home"),
  ]);

  return (
    <section
      aria-labelledby="home-hero-title"
      className="pt-5 pb-12 md:pt-7 md:pb-16"
    >
      <Container>
        <div className="bg-primary relative isolate overflow-hidden rounded-3xl">
          <div className="relative h-[220px] sm:h-[340px] lg:absolute lg:inset-0 lg:h-full">
            <Image
              src={assets.hero!}
              alt={t("imageAlt")}
              fill
              priority
              sizes="(min-width: 1320px) 1224px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 40px)"
              className="object-cover object-[58%_35%] lg:object-[center_35%]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(30,43,32,0.96)_0%,rgba(30,43,32,0.9)_28%,rgba(30,43,32,0.55)_48%,rgba(30,43,32,0.08)_72%,transparent_100%)] lg:block rtl:bg-[linear-gradient(270deg,rgba(30,43,32,0.96)_0%,rgba(30,43,32,0.9)_28%,rgba(30,43,32,0.55)_48%,rgba(30,43,32,0.08)_72%,transparent_100%)]"
            />
          </div>

          <div className="text-on-primary relative z-10 flex flex-col items-start px-7 py-7 sm:px-10 sm:py-12 lg:min-h-[600px] lg:w-[54%] lg:justify-center lg:px-14 lg:py-14">
            <p className="text-on-primary/75 mb-4 text-xs font-medium tracking-[0.18em] uppercase lg:mb-7">
              {t("eyebrow")}
            </p>
            <h1
              id="home-hero-title"
              className="font-heading text-[50px] leading-[0.98] font-medium tracking-[-0.035em] sm:text-[68px] lg:text-[80px] xl:text-[88px] rtl:text-[38px] rtl:leading-[1.5] rtl:sm:text-[48px] rtl:lg:text-[58px]"
            >
              <span className="block">{t("titleLine1")}</span>
              <span className="block">{t("titleLine2")}</span>
            </h1>
            <p className="text-on-primary/85 mt-6 max-w-[36ch] text-[15px] leading-[1.8] sm:text-base lg:mt-7">
              {t("subtitle")}
            </p>

            <div className="mt-6 flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-7 lg:mt-9">
              <Link
                href={viewer.hasAccess ? "/dashboard" : "/membership"}
                className="bg-surface text-primary hover:bg-secondary-fixed focus-visible:outline-surface inline-flex min-h-12 w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 sm:w-auto"
              >
                {t(viewer.hasAccess ? "memberCta" : "primaryCta")}
              </Link>
              <Link
                href="/practices"
                className="text-on-primary decoration-on-primary/40 hover:decoration-on-primary focus-visible:outline-surface inline-flex min-h-11 items-center self-center text-sm font-medium underline underline-offset-8 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 sm:self-auto"
              >
                {t("secondaryCta")}
              </Link>
            </div>
            {!viewer.hasAccess && (
              <p className="text-on-primary/70 mt-4 text-xs leading-relaxed">
                {t("trialNote", { days: sanctuaryPlan.trialDays })}
              </p>
            )}

            <p className="border-on-primary/20 text-on-primary/75 mt-6 border-t pt-4 text-xs tracking-wide lg:mt-10">
              {t("practiceTypes")}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
