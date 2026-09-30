import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fa"],
  defaultLocale: "en",
  // English lives at `/`, Persian at `/fa`.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

const rtlLocales: readonly Locale[] = ["fa"];

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}
