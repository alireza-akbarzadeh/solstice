import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/container";
import type { Locale } from "@/i18n/routing";
import { PracticeCard } from "@/modules/practices/components/practice-card";
import { getFeaturedPractices } from "@/modules/practices/server/get-featured-practices";

export async function FeaturedPractices({ locale }: { locale: Locale }) {
  const [t, practices] = await Promise.all([getTranslations("Home.practices"), getFeaturedPractices(locale)]);

  return (
    <section id="practices" className="w-full bg-surface py-20 lg:py-24">
      <Container>
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end lg:mb-16">
          <div>
            <span className="mb-2 block font-label-md text-label-md tracking-widest text-clay uppercase">{t("eyebrow")}</span>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
              {t("title")}
            </h2>
          </div>
          <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t("description")}</p>
        </div>
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {practices.map((practice) => (
            <PracticeCard key={practice.slug} practice={practice} />
          ))}
        </div>
      </Container>
    </section>
  );
}
