import { CircleCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { emailProvider } from "@/infrastructure/email";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { ResendVerification } from "@/modules/auth/components/recovery-forms";
import { getSession } from "@/server/better-auth/server";

export async function generateMetadata({ params }: PageProps<"/[locale]/verify-email">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Auth.recovery" });
  return { title: t("verifyTitle"), robots: { index: false } };
}

// Verification links land here after Better Auth checks them (?error=… when they fail).
// Signed-in members who haven't verified can send a fresh link.
export default async function VerifyEmailPage({ params, searchParams }: PageProps<"/[locale]/verify-email">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, session, query] = await Promise.all([getTranslations("Auth.recovery"), getSession(), searchParams]);
  const failed = typeof query.error === "string";
  const verified = !failed && !!session?.user.emailVerified;

  return (
    <AuthCard eyebrow={t("eyebrow")} title={verified ? t("verifiedTitle") : t("verifyTitle")}>
      {verified ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <CircleCheckIcon className="size-6" />
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant">{t("verifiedBody")}</p>
          <Link href="/dashboard" className="rounded-lg bg-primary px-6 py-2.5 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container">
            {t("toSanctuary")}
          </Link>
        </div>
      ) : (
        <>
          {failed ? (
            <p role="alert" className="rounded-lg bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container">
              {t("verifyFailed")}
            </p>
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant">{session ? t("verifyPending", { email: session.user.email }) : t("verifySignIn")}</p>
          )}
          {session ? (
            <ResendVerification email={session.user.email} mailbox={emailProvider.testMode} />
          ) : (
            <Link
              href="/sign-in?next=/verify-email"
              className="rounded-lg bg-primary px-6 py-3 text-center font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container"
            >
              {t("backToSignIn")}
            </Link>
          )}
        </>
      )}
    </AuthCard>
  );
}
