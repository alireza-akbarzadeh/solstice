import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StudioCrumb } from "@/components/layout/studio-breadcrumb";
import { routing } from "@/i18n/routing";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { TestimonialsManager } from "@/modules/testimonials/components/testimonials-manager";
import { getTestimonials } from "@/modules/testimonials/server/testimonials";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.testimonials" });
  return {
    title: t("title"),
    robots: { index: false },
  };
}

export default async function StudioTestimonialsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/testimonials");

  const [t, testimonials] = await Promise.all([
    getTranslations("Studio.testimonials"),
    getTestimonials(),
  ]);

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioCrumb items={[{ label: t("title") }]} />
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("description")}
      />
      <TestimonialsManager initialItems={testimonials} />
    </div>
  );
}
