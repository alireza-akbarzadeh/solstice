import type { Locale } from "@/i18n/routing";

// Content that will come from the database carries one string per locale.
export type Localized = Record<Locale, string>;

export function localize(value: Localized, locale: Locale) {
  return value[locale];
}
