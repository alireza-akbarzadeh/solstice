import { ArrowUpRightIcon, InboxIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";
import { emailProvider, readOutbox } from "@/infrastructure/email";
import { AuthCard } from "@/modules/auth/components/auth-card";

export async function generateMetadata({ params }: PageProps<"/[locale]/test/mailbox">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "TestMode.mailbox" });
  return { title: t("title"), robots: { index: false } };
}

// Where the "outbox" EmailProvider's messages can be read while email isn't connected.
export default async function MailboxPage({ params }: PageProps<"/[locale]/test/mailbox">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  if (!emailProvider.testMode) notFound();

  const [t, format, messages] = await Promise.all([getTranslations("TestMode.mailbox"), getFormatter(), readOutbox()]);

  return (
    <AuthCard eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")} wide>
      {messages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center text-on-surface-variant">
          <InboxIcon className="size-8 text-outline" />
          <p className="font-body-md text-body-md">{t("empty")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((message) => (
            <li key={message.id} className="rounded-xl bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-label-lg text-label-lg text-on-surface">{message.subject}</p>
                <time dateTime={message.createdAt.toISOString()} className="font-label-sm text-label-sm text-outline">
                  {format.relativeTime(message.createdAt)}
                </time>
              </div>
              <p dir="ltr" className="mt-0.5 text-start font-body-sm text-body-sm text-on-surface-variant rtl:text-end">
                {message.to}
              </p>
              <p dir="auto" className="mt-3 font-body-sm text-body-sm whitespace-pre-line text-on-surface">
                {message.text}
              </p>
              {message.actionUrl && (
                <a
                  href={message.actionUrl}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container"
                >
                  {t("open")}
                  <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </AuthCard>
  );
}
