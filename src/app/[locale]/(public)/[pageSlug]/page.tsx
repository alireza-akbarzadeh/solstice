import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { isCustomPageSlug } from "@/modules/pages/definitions";
import { getPublishedCustomPage } from "@/modules/pages/server/library";
import { ContentPage } from "@/modules/pages/components/content-page";

type Props = { params: Promise<{ locale: string; pageSlug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, pageSlug } = await params;
  if (!hasLocale(routing.locales, locale) || !isCustomPageSlug(pageSlug))
    return {};
  const page = await getPublishedCustomPage(pageSlug);
  if (!page?.publishedContent) return {};
  const content = page.publishedContent;
  return {
    title:
      localize(content.seoTitle, locale) || localize(content.title, locale),
    description: localize(content.description, locale),
    openGraph: content.image ? { images: [content.image] } : undefined,
  };
}
export default async function WebsitePage({ params }: Props) {
  const { locale, pageSlug } = await params;
  if (!hasLocale(routing.locales, locale) || !isCustomPageSlug(pageSlug))
    notFound();
  setRequestLocale(locale);
  const page = await getPublishedCustomPage(pageSlug);
  if (!page?.publishedContent) notFound();
  return <ContentPage locale={locale} content={page.publishedContent} />;
}
