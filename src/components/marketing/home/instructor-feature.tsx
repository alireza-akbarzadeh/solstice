import { BadgeCheckIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { getPageAssets } from "@/modules/pages/server/request";

export async function InstructorFeature() {
  const [t, tBrand, assets] = await Promise.all([getTranslations("Home.instructor"), getTranslations("Brand"), getPageAssets("home")]);
  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
  ];

  return (
    <section id="about" className="w-full bg-surface py-20 lg:py-28">
      <Container>
        <div className="grid grid-cols-1 items-center gap-gutter lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-surface-container shadow-xl">
              <Image
                src={assets.portrait!}
                alt={t("portraitAlt")}
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute end-4 -bottom-6 max-w-xs rounded-2xl border border-surface-variant bg-surface-container-lowest p-5 shadow-lg sm:end-6">
              <div className="flex items-center gap-3">
                <BadgeCheckIcon className="size-6 shrink-0 text-primary" />
                <div>
                  <p className="font-label-sm text-label-sm font-semibold tracking-wider text-clay uppercase">
                    {t("credentialsTitle")}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface">{t("credentials")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 space-y-8 lg:col-span-6 lg:col-start-7 lg:mt-0">
            <div>
              <span className="mb-3 block font-label-md text-label-md tracking-widest text-clay uppercase">{t("eyebrow")}</span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
                {tBrand("instructor")}
              </h2>
            </div>
            <div className="rounded-2xl border-s-4 border-clay bg-surface-container-low p-6">
              <blockquote className="font-display text-headline-sm leading-relaxed text-clay italic rtl:not-italic">
                {t("quote")}
              </blockquote>
            </div>
            <p className="font-body-lg text-body-lg text-on-surface-variant">{t("bio1")}</p>
            <p className="font-body-md text-body-md text-on-surface-variant">{t("bio2")}</p>
            <dl className="flex flex-wrap items-center gap-8 pt-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse">
                  <dt className="font-label-sm text-label-sm tracking-wider text-outline uppercase">{stat.label}</dt>
                  <dd className="font-headline-md text-headline-md text-primary">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  );
}
