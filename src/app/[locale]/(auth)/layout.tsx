import Image from "next/image";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Standalone like the Stitch auth screens: brand + language only, no site navigation.
export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Brand");

  return (
    <>
      <header>
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/icons/mark.svg" alt={t("logoAlt")} width={32} height={32} className="size-8" unoptimized priority />
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary">{t("name")}</span>
          </Link>
          <LocaleSwitcher />
        </Container>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
