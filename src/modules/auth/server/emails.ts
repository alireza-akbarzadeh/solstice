import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { emailProvider } from "@/infrastructure/email";

// The auth pages put the locale in their callback paths (/fa/reset-password), so the
// email speaks the language the member was using.
function localeOf(url: string) {
  const decoded = decodeURIComponent(url);
  return routing.locales.find((l) => l !== routing.defaultLocale && new RegExp(`/${l}(/|$|\\?)`).test(decoded)) ?? routing.defaultLocale;
}

export async function sendAuthEmail(kind: "reset" | "verify", user: { email: string; name: string }, url: string) {
  const t = await getTranslations({ locale: localeOf(url), namespace: "Email" });
  await emailProvider.send({
    to: user.email,
    subject: t(`${kind}.subject`),
    text: t(`${kind}.body`, { name: user.name, url }),
    actionUrl: url,
  });
}
