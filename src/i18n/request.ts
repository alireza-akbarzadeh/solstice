import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { getAllCategories } from "@/modules/categories/server/categories";
import { mergeCategoryNames } from "@/modules/categories/server/names";
import { mergePublishedCopy } from "@/modules/pages/definitions";
import { getPublishedMessages } from "@/modules/pages/server/messages";
import { getBuiltinPagePreview } from "@/modules/pages/server/request";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [published, preview, categories] = await Promise.all([
    getPublishedMessages(locale),
    getBuiltinPagePreview(),
    getAllCategories(),
  ]);
  // Ordinary requests see published snapshots. Only an authenticated instructor's
  // explicit preview can replace one registered page's copy with its saved draft.
  const messages = preview
    ? mergePublishedCopy(published, locale, [{ slug: preview.slug, publishedContent: preview.draftContent }])
    : published;
  // Category names come from the studio's categories table, not from page copy.
  return { locale, messages: mergeCategoryNames(structuredClone(messages), locale, categories) as unknown as Messages };
});
