import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { emailTestMode } from "@/infrastructure/email";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { ForgotPasswordForm } from "@/modules/auth/components/recovery-forms";

export async function generateMetadata({ params }: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Auth.recovery" });
  return { title: t("forgotTitle"), robots: { index: false } };
}

// No Stitch screen: the sign-in card language, one field.
export default async function ForgotPasswordPage({ params }: PageProps<"/[locale]/forgot-password">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Auth.recovery");

  return (
    <AuthCard eyebrow={t("eyebrow")} title={t("forgotTitle")} lede={t("forgotLede")}>
      <ForgotPasswordForm mailbox={await emailTestMode()} />
      <Link href="/sign-in" className="text-center font-label-md text-label-md text-on-surface-variant underline-offset-4 hover:text-primary hover:underline">
        {t("backToSignIn")}
      </Link>
    </AuthCard>
  );
}
