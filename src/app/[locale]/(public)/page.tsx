import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { FeaturedPractices } from "@/components/marketing/home/featured-practices";
import { FeaturedPrograms } from "@/components/marketing/home/featured-programs";
import { Hero } from "@/components/marketing/home/hero";
import { InstructorFeature } from "@/components/marketing/home/instructor-feature";
import { MembershipBanner } from "@/components/marketing/home/membership-banner";
import { Testimonials } from "@/components/marketing/home/testimonials";
import { routing } from "@/i18n/routing";

// Stitch: design/stitch/screens/solstice-studio-desktop-home.html
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <FeaturedPractices locale={locale} />
      <FeaturedPrograms locale={locale} />
      <InstructorFeature />
      <Testimonials />
      <MembershipBanner />
    </>
  );
}
