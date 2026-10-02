import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { mergePublishedCopy } from "@/modules/pages/definitions";
import { getPublishedBuiltinPages } from "@/modules/pages/server/library";
import type { CopyRecord } from "@/modules/pages/types";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const original = (
    (await import(`../../messages/${locale}.json`)) as { default: Messages }
  ).default;
  // Database copy is published explicitly; drafts never reach public/client translations.
  // Keep the original website available during a transient CMS database outage.
  let messages = original;
  try {
    messages = mergePublishedCopy(
      original as unknown as CopyRecord,
      locale,
      await getPublishedBuiltinPages(),
    ) as unknown as Messages;
  } catch {
    console.warn(
      "Published page content is temporarily unavailable; using the original website copy.",
    );
  }
  return { locale, messages };
});
