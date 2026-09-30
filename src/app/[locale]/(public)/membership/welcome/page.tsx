import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { safeNextPath, withNext } from "@/lib/safe-next";
import { sanctuaryPlan } from "@/modules/memberships/plans";
import { getViewer } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/membership/welcome">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Membership.welcome" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Landing after a successful checkout; hosted payment providers return here too.
export default async function MembershipWelcomePage({ params, searchParams }: PageProps<"/[locale]/membership/welcome">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const next = safeNextPath((await searchParams).next, "/practices");
  const viewer = await getViewer();
  if (!viewer.hasAccess) redirect({ href: withNext("/membership", next), locale });

  const t = await getTranslations("Membership.welcome");

  return (
    <Container className="py-space-2xl">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-2xl bg-surface-container-lowest p-8 text-center shadow-ambient md:p-12">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <SparklesIcon className="size-7" />
        </span>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">{t("title")}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">{t("body", { days: sanctuaryPlan.trialDays })}</p>
        <Link
          href={next}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container"
        >
          {t("continue")}
          <ArrowRightIcon className="size-4 rtl:rotate-180" />
        </Link>
        {next !== "/practices" && (
          <Link href="/practices" className="font-label-md text-label-md text-on-surface-variant underline-offset-4 hover:text-primary hover:underline">
            {t("browse")}
          </Link>
        )}
      </div>
    </Container>
  );
}
