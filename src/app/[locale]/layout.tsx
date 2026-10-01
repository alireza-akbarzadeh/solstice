import "@/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Playfair_Display, Plus_Jakarta_Sans, Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";

import { PwaUpdatePrompt } from "@/components/pwa/pwa-update-prompt";
import { PwaUpdateProvider } from "@/components/pwa/pwa-update-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import { env } from "@/env";
import { getDirection, routing } from "@/i18n/routing";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
});

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#fef8f4",
  // The bottom tab bar sits against the home indicator, so the page must reach under it and
  // pad itself back with env(safe-area-inset-*) — see `pb-safe` in globals.css.
  viewportFit: "cover",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: { default: t("title"), template: `%s · ${t("title")}` },
    description: t("description"),
    metadataBase: new URL(env.BETTER_AUTH_URL),
    applicationName: t("title"),
    icons: {
      icon: [{ url: "/icons/mark.svg", type: "image/svg+xml" }, { url: "/favicon.ico", sizes: "any" }],
      apple: "/icons/apple-touch-icon.png",
    },
    appleWebApp: { capable: true, title: t("title"), statusBarStyle: "default" },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const dir = getDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${playfair.variable} ${jakarta.variable} ${vazirmatn.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-svh flex-col">
        <NextIntlClientProvider>
          <DirectionProvider dir={dir}>
            <PwaUpdateProvider>
              {children}
              <Toaster />
              <PwaUpdatePrompt />
            </PwaUpdateProvider>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
