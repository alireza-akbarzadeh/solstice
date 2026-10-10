import { AwardIcon, BadgeCheckIcon, Flower2Icon, HourglassIcon, UsersIcon, InfinityIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { safeNextPath, withNext } from "@/lib/safe-next";
import { SignUpForm } from "@/modules/auth/components/sign-up-form";
import { SocialButtons } from "@/modules/auth/components/social-buttons";
import { getVisitorPlanDisplay } from "@/modules/memberships/server/plan-display";
import { enabledSocialProviders } from "@/server/better-auth/config";
import { getSession } from "@/server/better-auth/server";
import { getBrandAssets } from "@/modules/brand/server/brand-assets";
import { getBuiltinPagePreview } from "@/modules/pages/server/request";

export async function generateMetadata({ params }: PageProps<"/[locale]/sign-up">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Auth.signUp" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Stitch: member-registration-desktop.html (+ create-account-mobile.html)
export default async function SignUpPage({ params, searchParams }: PageProps<"/[locale]/sign-up">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // After creating an account, people go on to choose a membership unless told otherwise.
  const next = safeNextPath((await searchParams).next, "/membership");
  if ((await getSession()) && (await getBuiltinPagePreview())?.slug !== "account-access") redirect({ href: next, locale });

  const [t, tBrand, { catalog, money, per }, brandAssets] = await Promise.all([
    getTranslations("Auth"),
    getTranslations("Brand"),
    getVisitorPlanDisplay(locale),
    getBrandAssets(),
  ]);
  const { trialDays, entry } = catalog;
  const benefits = [
    { icon: Flower2Icon, text: t("signUp.benefit1") },
    { icon: HourglassIcon, text: t("signUp.benefit2") },
    { icon: UsersIcon, text: t("signUp.benefit3") },
    { icon: InfinityIcon, text: t("signUp.benefit4") },
  ];

  return (
    <Container className="py-8 md:py-12">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
        <section className="order-2 flex flex-col gap-6 lg:order-1 lg:col-span-5">
          <div className="relative overflow-hidden rounded-xl bg-surface-container shadow-md">
            <div className="relative h-64 w-full overflow-hidden md:h-72">
              <Image src={brandAssets.signUpPhotoUrl} alt="" fill sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-on-surface/20 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-center gap-3.5 rounded-lg bg-surface/90 p-3 backdrop-blur-md">
                <Image src={brandAssets.instructorAvatarUrl} alt="" width={56} height={56} className="size-14 shrink-0 rounded-full object-cover shadow-sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-headline-sm text-headline-sm leading-tight text-on-surface">{brandAssets.instructorName[locale] || tBrand("instructor")}</span>
                    <BadgeCheckIcon className="size-4 shrink-0 text-primary" />
                  </div>
                  <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{t("guideRole")}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-5 bg-surface-container-low p-6 md:p-8">
              <h2 className="font-headline-md text-headline-md leading-snug text-on-surface">{t("signUp.sideTitle")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{t("signUp.sideBody")}</p>
              <ul className="flex flex-col gap-3.5 pt-2">
                {benefits.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                      <Icon className="size-3.5" />
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-secondary-fixed/40 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <AwardIcon className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg text-on-surface">{t("signUp.passTitle", { days: trialDays })}</span>
              <span className="font-body-sm text-body-sm text-on-secondary-container">
                {entry && t("signUp.passBody", { price: money(entry.price), per: per(entry.intervalMonths) })}
              </span>
            </div>
          </div>
        </section>

        <section className="order-1 lg:order-2 lg:col-span-7">
          <div className="flex flex-col rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-10 md:p-12">
            <div className="mb-8">
              <span className="mb-2 block font-label-md text-label-md tracking-[0.25em] text-primary uppercase">{t("signUp.eyebrow")}</span>
              <h1 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile font-normal text-on-surface md:font-headline-lg md:text-headline-lg">
                {t("signUp.title")}
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">{t("signUp.lede", { days: trialDays })}</p>
            </div>
            {enabledSocialProviders.length > 0 && (
              <>
                <SocialButtons providers={enabledSocialProviders} next={next} />
                <div className="relative my-6 flex items-center justify-center">
                  <div className="h-px w-full bg-surface-container-highest" />
                  <span className="absolute bg-surface-container-lowest px-4 font-label-sm text-[10px] tracking-widest text-outline uppercase">
                    {t("orEmail")}
                  </span>
                </div>
              </>
            )}
            <SignUpForm next={next} signInHref={withNext("/sign-in", next)} />
          </div>
        </section>
      </div>
    </Container>
  );
}
