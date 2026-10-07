import { env } from "@/env";
import { routing } from "@/i18n/routing";
import { sendEmail } from "@/infrastructure/email";
import { renderEmailTemplate } from "@/modules/email/server/templates";
import type { EmailTemplateKey } from "@/modules/email/templates";

// The auth pages put the locale in their callback paths (/fa/reset-password), so the
// email speaks the language the member was using.
function localeOf(url?: string) {
  if (!url) return routing.defaultLocale;
  const decoded = decodeURIComponent(url);
  return routing.locales.find((l) => l !== routing.defaultLocale && new RegExp(`/${l}(/|$|\\?)`).test(decoded)) ?? routing.defaultLocale;
}

export async function sendAuthEmail(
  kind: EmailTemplateKey,
  user: { email: string; name: string },
  url?: string,
  preferredLocale?: string,
) {
  const locale = preferredLocale ?? localeOf(url);
  const actionUrl = url ?? (locale === "fa" ? `${env.BETTER_AUTH_URL}/fa/dashboard` : `${env.BETTER_AUTH_URL}/dashboard`);

  const { subject, text } = await renderEmailTemplate({
    key: kind,
    locale,
    variables: {
      name: user.name || (locale === "fa" ? "همراه گرامی" : "friend"),
      url: actionUrl,
    },
  });

  await sendEmail({
    to: user.email,
    subject,
    text,
    actionUrl,
  });
}

export async function sendWelcomeEmail(
  user: { email: string; name: string },
  url?: string,
  preferredLocale?: string,
) {
  await sendAuthEmail("welcome", user, url, preferredLocale);
}
