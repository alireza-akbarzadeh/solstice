import { cache } from "react";
import type { Locale } from "@/i18n/routing";
import { defaultMessages } from "../defaults";
import { mergePublishedCopy } from "../definitions";
import { getPublishedBuiltinPages } from "./library";

/** Published website copy, also used outside locale pages by the app manifest. */
export const getPublishedMessages = cache(async (locale: Locale) => {
  const original = defaultMessages(locale);
  try {
    return mergePublishedCopy(original, locale, await getPublishedBuiltinPages());
  } catch {
    console.warn("Published page content is temporarily unavailable; using the original website copy.");
    return structuredClone(original);
  }
});
