import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { ResetPasswordForm } from "@/modules/auth/components/recovery-forms";

export async function generateMetadata({ params }: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Auth.recovery" });
  return { title: t("resetPageTitle"), robots: { index: false } };
}

// Better Auth sends the email link through /api/auth/reset-password/:token, which lands here
// with ?token=… (or ?error=INVALID_TOKEN when the link is stale).
export default async function ResetPasswordPage({ params, searchParams }: PageProps<"/[locale]/reset-password">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : null;
  const t = await getTranslations("Auth.recovery");

  return (
    <AuthCard eyebrow={t("eyebrow")} title={t("resetPageTitle")} lede={token ? t("resetLede") : undefined}>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <p role="alert" className="rounded-lg bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container">
            {t("invalidToken")}
          </p>
          <Link
            href="/forgot-password"
            className="rounded-lg bg-primary px-6 py-3 text-center font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container"
          >
            {t("requestNew")}
          </Link>
        </>
      )}
    </AuthCard>
  );
}
