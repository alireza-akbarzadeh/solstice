import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import type { Locale } from "@/i18n/routing";
import { ProgramSpotlight } from "@/modules/programs/components/program-spotlight";
import { getFeaturedPrograms } from "@/modules/programs/server/get-featured-programs";

export async function FeaturedPrograms({ locale }: { locale: Locale }) {
  const [t, programs] = await Promise.all([getTranslations("Home.programs"), getFeaturedPrograms(locale)]);

  return (
    <section className="w-full bg-surface-container-low py-20 lg:py-24">
      <Container>
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          className="mb-14 max-w-2xl"
        />
        <div className="space-y-12">
          {programs.map((program, i) => (
            <ProgramSpotlight key={program.slug} program={program} reversed={i % 2 === 1} />
          ))}
        </div>
      </Container>
    </section>
  );
}
