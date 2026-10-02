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

export async function generateMetadata({ params }: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Auth.signIn" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Stitch: member-sign-in-desktop.html (+ member-sign-in-mobile.html)
export default async function SignInPage({ params, searchParams }: PageProps<"/[locale]/sign-in">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const next = safeNextPath((await searchParams).next);
  if ((await getSession()) && (await getBuiltinPagePreview())?.slug !== "account-access") redirect({ href: next, locale });

  const [t, tBrand] = await Promise.all([getTranslations("Auth"), getTranslations("Brand")]);

  return (
    <Container className="py-8 md:py-12">
      <div className="grid min-h-[680px] grid-cols-1 overflow-hidden rounded-xl bg-surface-container-low shadow-xl lg:grid-cols-12">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-8 md:p-12 lg:col-span-5 lg:flex">
          <Image src="/images/auth/sign-in.jpg" alt="" fill priority sizes="40vw" className="object-cover opacity-40 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-transparent rtl:bg-gradient-to-l" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-surface/10 backdrop-blur-md">
                <Image src="/images/brand/logo.svg" alt="" width={24} height={24} unoptimized />
              </span>
              <span className="flex flex-col">
                <span className="font-heading text-sm font-semibold tracking-[0.24em] text-surface uppercase">{tBrand("name")}</span>
                <span className="font-label-sm text-[9px] tracking-[0.28em] text-primary-fixed-dim uppercase">{t("tagline")}</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/15 px-3 py-1 font-label-sm text-label-sm tracking-widest text-surface uppercase backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-secondary-fixed motion-safe:animate-pulse" />
              {t("live")}
            </span>
          </div>

          <div className="relative z-10 mt-auto pt-16">
            <figure className="rounded-xl bg-surface/15 p-6 text-surface backdrop-blur-md md:p-8">
              <div className="mb-4 flex items-center gap-2 text-secondary-fixed">
                <QuoteIcon className="size-5" />
                <span className="font-label-sm text-label-sm tracking-widest text-primary-fixed-dim uppercase">{t("quoteLabel")}</span>
              </div>
              <blockquote className="mb-6 font-headline-sm text-headline-sm leading-relaxed font-normal text-surface italic rtl:not-italic">
                {t("quote")}
              </blockquote>
              <figcaption className="flex items-center gap-3 rounded-lg bg-surface/5 px-4 py-3">
                <Image src="/images/brand/elena-portrait.jpg" alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
                <span>
                  <span className="block font-label-md text-label-md font-semibold text-surface">{tBrand("instructor")}</span>
                  <span className="block font-label-sm text-label-sm text-primary-fixed-dim">{t("guideRole")}</span>
                </span>
              </figcaption>
            </figure>
            <ul className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 font-label-sm text-[11px] tracking-wider text-primary-fixed-dim uppercase">
              {[t("stat1"), t("stat2"), t("stat3")].map((stat) => (
                <li key={stat} className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-secondary-fixed" />
                  {stat}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col justify-center bg-surface px-6 py-10 md:px-14 lg:col-span-7 lg:px-20">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-px w-5 bg-clay" />
              <span className="font-label-md text-label-md font-semibold tracking-[0.25em] text-clay uppercase">{t("signIn.eyebrow")}</span>
            </div>
            <h1 className="mb-3 font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
              {t("signIn.title")}
            </h1>
            <p className="mb-8 font-body-md text-body-md text-on-surface-variant">{t("signIn.lede")}</p>

            {enabledSocialProviders.length > 0 && (
              <>
                <SocialButtons providers={enabledSocialProviders} next={next} />
                <div className="relative my-6 flex items-center justify-center">
                  <div className="h-px w-full bg-surface-container-highest" />
                  <span className="absolute bg-surface px-4 font-label-sm text-[10px] tracking-widest text-outline uppercase">{t("orEmail")}</span>
                </div>
              </>
            )}

            <SignInForm next={next} />

            <div className="mt-8 space-y-4 pt-6 text-center">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("signIn.noAccount")}{" "}
                <Link href={withNext("/sign-up", next)} className="ms-1 font-label-md text-label-md font-semibold text-primary transition-colors hover:text-clay">
                  {t("signIn.createAccount")}
                </Link>
              </p>
              <div className="flex items-center justify-center gap-4 pt-2 font-label-sm text-[11px] tracking-widest text-outline uppercase">
                <span className="inline-flex items-center gap-1.5">
                  <LockIcon className="size-3.5 text-primary" />
                  {t("encrypted")}
                </span>
                <span aria-hidden>•</span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldIcon className="size-3.5 text-primary" />
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
