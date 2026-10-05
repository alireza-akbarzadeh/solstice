import { MailCheckIcon, MailXIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { confirmUnsubscribe } from "@/modules/newsletter/unsubscribe-actions";
import { verifyUnsubscribe } from "@/modules/newsletter/server/unsubscribe";

export async function generateMetadata({ params }: PageProps<"/[locale]/unsubscribe">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Newsletter.unsubscribe" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen. The newsletter's unsubscribe link lands here; the reader confirms with a
// button, so a mail scanner that opens links unsubscribes nobody.
export default async function UnsubscribePage({ params, searchParams }: PageProps<"/[locale]/unsubscribe">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const query = await searchParams;
  const t = await getTranslations("Newsletter.unsubscribe");
  const email = verifyUnsubscribe(query.e, query.t);
  const done = query.done === "1";

  return (
    <Container className="py-space-2xl">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl bg-surface-container-lowest p-8 text-center shadow-ambient">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
          {done ? <MailCheckIcon className="size-6" /> : <MailXIcon className="size-6" />}
        </span>
        {!email ? (
          <>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">{t("invalidTitle")}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{t("invalidBody")}</p>
          </>
        ) : done ? (
          <>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">{t("doneTitle")}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{t("doneBody", { email })}</p>
            <Link href="/" className="font-label-lg text-label-lg text-primary underline-offset-4 hover:underline">
              {t("home")}
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">{t("title")}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{t("body", { email })}</p>
            <form action={confirmUnsubscribe}>
              <input type="hidden" name="e" value={String(query.e)} />
              <input type="hidden" name="t" value={String(query.t)} />
              <button
                type="submit"
                className="rounded-lg bg-primary px-6 py-3 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container"
              >
                {t("confirm")}
              </button>
            </form>
          </>
        )}
      </div>
    </Container>
  );
}
