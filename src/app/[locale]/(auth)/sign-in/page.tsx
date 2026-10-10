import { LockIcon, QuoteIcon, ShieldIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { safeNextPath, withNext } from "@/lib/safe-next";
import { SignInForm } from "@/modules/auth/components/sign-in-form";
import { SocialButtons } from "@/modules/auth/components/social-buttons";
import { enabledSocialProviders } from "@/server/better-auth/config";
import { getSession } from "@/server/better-auth/server";
import { getBuiltinPagePreview } from "@/modules/pages/server/request";
import { getBrandAssets } from "@/modules/brand/server/brand-assets";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Auth.signIn" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Stitch: member-sign-in-desktop.html (+ member-sign-in-mobile.html)
export default async function SignInPage({
  params,
  searchParams,
}: PageProps<"/[locale]/sign-in">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const next = safeNextPath((await searchParams).next);
  if (
    (await getSession()) &&
    (await getBuiltinPagePreview())?.slug !== "account-access"
  )
    redirect({ href: next, locale });

  const [t, tBrand, brandAssets] = await Promise.all([
    getTranslations("Auth"),
    getTranslations("Brand"),
    getBrandAssets(),
  ]);

  return (
    <Container className="py-8 md:py-12">
      <div className="bg-surface-container-low grid min-h-170 grid-cols-1 overflow-hidden rounded-xl shadow-xl lg:grid-cols-12">
        <div className="bg-primary relative hidden flex-col justify-between overflow-hidden p-8 md:p-12 lg:col-span-5 lg:flex">
          <Image
            src={brandAssets.signInPhotoUrl}
            alt=""
            fill
            priority
            sizes="40vw"
            className="object-cover opacity-40 mix-blend-luminosity"
          />
          <div className="from-primary via-primary/80 absolute inset-0 bg-gradient-to-t to-transparent" />
          <div className="from-primary/60 absolute inset-0 bg-gradient-to-r to-transparent rtl:bg-gradient-to-l" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="bg-surface/10 flex size-10 items-center justify-center rounded-full backdrop-blur-md">
                <Image
                  src={brandAssets.logoUrl}
                  alt=""
                  width={24}
                  height={24}
                  unoptimized
                />
              </span>
              <span className="flex flex-col">
                <span className="font-heading text-surface text-sm font-semibold tracking-[0.24em] uppercase">
                  {tBrand("name")}
                </span>
                <span className="font-label-sm text-primary-fixed-dim text-[9px] tracking-[0.28em] uppercase">
                  {t("tagline")}
                </span>
              </span>
            </div>
            <span className="bg-surface/15 font-label-sm text-label-sm text-surface inline-flex items-center gap-1.5 rounded-full px-3 py-1 tracking-widest uppercase backdrop-blur-md">
              <span className="bg-secondary-fixed size-1.5 rounded-full motion-safe:animate-pulse" />
              {t("live")}
            </span>
          </div>

          <div className="relative z-10 mt-auto pt-16">
            <figure className="bg-surface/15 text-surface rounded-xl p-6 backdrop-blur-md md:p-8">
              <div className="text-secondary-fixed mb-4 flex items-center gap-2">
                <QuoteIcon className="size-5" />
                <span className="font-label-sm text-label-sm text-primary-fixed-dim tracking-widest uppercase">
                  {t("quoteLabel")}
                </span>
              </div>
              <blockquote className="font-headline-sm text-headline-sm text-surface mb-6 leading-relaxed font-normal italic rtl:not-italic">
                {t("quote")}
              </blockquote>
              <figcaption className="bg-surface/5 flex items-center gap-3 rounded-lg px-4 py-3">
                <Image
                  src={brandAssets.instructorAvatarUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 rounded-full object-cover"
                />
                <span>
                  <span className="font-label-md text-label-md text-surface block font-semibold">
                    {brandAssets.instructorName[locale] || tBrand("instructor")}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary-fixed-dim block">
                    {t("guideRole")}
                  </span>
                </span>
              </figcaption>
            </figure>
            <ul className="font-label-sm text-primary-fixed-dim mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[11px] tracking-wider uppercase">
              {[t("stat1"), t("stat2"), t("stat3")].map((stat) => (
                <li key={stat} className="flex items-center gap-1.5">
                  <span className="bg-secondary-fixed size-1 rounded-full" />
                  {stat}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-surface flex flex-col justify-center px-6 py-10 md:px-14 lg:col-span-7 lg:px-20">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-3 flex items-center gap-2">
              <span className="bg-clay h-px w-5" />
              <span className="font-label-md text-label-md text-clay font-semibold tracking-[0.25em] uppercase">
                {t("signIn.eyebrow")}
              </span>
            </div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg mb-3">
              {t("signIn.title")}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8">
              {t("signIn.lede")}
            </p>

            {enabledSocialProviders.length > 0 && (
              <>
                <SocialButtons providers={enabledSocialProviders} next={next} />
                <div className="relative my-6 flex items-center justify-center">
                  <div className="bg-surface-container-highest h-px w-full" />
                  <span className="bg-surface font-label-sm text-outline absolute px-4 text-[10px] tracking-widest uppercase">
                    {t("orEmail")}
                  </span>
                </div>
              </>
            )}

            <SignInForm next={next} />

            <div className="mt-8 space-y-4 pt-6 text-center">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("signIn.noAccount")}{" "}
                <Link
                  href={withNext("/sign-up", next)}
                  className="font-label-md text-label-md text-primary hover:text-clay ms-1 font-semibold transition-colors"
                >
                  {t("signIn.createAccount")}
                </Link>
              </p>
              <div className="font-label-sm text-outline flex items-center justify-center gap-4 pt-2 text-[11px] tracking-widest uppercase">
                <span className="inline-flex items-center gap-1.5">
                  <LockIcon className="text-primary size-3.5" />
                  {t("encrypted")}
                </span>
                <span aria-hidden>•</span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldIcon className="text-primary size-3.5" />
                  {t("private")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
