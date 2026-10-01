import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";

import { LegalPage, type LegalSection } from "./legal-page";

type LegalKey = "privacy" | "terms" | "ethics";

/**
 * The three policy routes differ only by which part of the `Legal` namespace they read, so the
 * page body and its metadata are built once here rather than copied three times.
 */
export async function legalMetadata(locale: string, key: LegalKey): Promise<Metadata> {
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: `Legal.${key}` });
  return { title: t("metaTitle"), description: t("lede") };
}

export async function renderLegalPage(locale: string, key: LegalKey) {
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, tLegal] = await Promise.all([getTranslations(`Legal.${key}`), getTranslations("Legal")]);
  // Sections are authored as structured data in the message files, so both locales stay in step.
  const sections = t.raw("sections") as LegalSection[];

  return (
    <LegalPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      lede={t("lede")}
      updated={tLegal("updated", { date: tLegal("updatedDate") })}
      notice={{ title: t("noticeTitle"), body: t("noticeBody") }}
      sections={sections}
    />
  );
}
