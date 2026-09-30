import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { routing } from "@/i18n/routing";
import { ProgramSpotlight } from "@/modules/programs/components/program-spotlight";
import { getPrograms } from "@/modules/programs/server/get-program";

export async function generateMetadata({ params }: PageProps<"/[locale]/programs">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Programs" });
  return { title: t("metaTitle"), description: t("lede") };
}

// No Stitch screen: composed from the home page's program spotlights.
export default async function ProgramsPage({ params }: PageProps<"/[locale]/programs">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, programs] = await Promise.all([getTranslations("Programs"), getPrograms(locale)]);

  return (
    <div className="bg-surface-container-low">
      <Container className="py-space-2xl">
        <header className="mb-space-xl max-w-3xl">
          <span className="mb-2 block font-label-md text-label-md tracking-widest text-clay uppercase">{t("eyebrow")}</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-display md:text-display">
            {t("title")}
          </h1>
          <p className="mt-4 font-body-lg text-body-lg text-on-surface-variant">{t("lede")}</p>
        </header>
        <div className="space-y-space-lg">
          {programs.map((program, i) => (
            <ProgramSpotlight
              key={program.slug}
              reversed={i % 2 === 1}
              program={{ ...program, phases: program.weeks.map((w) => ({ label: w.label, title: w.title })) }}
            />
          ))}
        </div>
      </Container>
    </div>
  );
}
