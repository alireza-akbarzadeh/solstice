import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getBrandAssets } from "@/modules/brand/server/brand-assets";
import { TestPanel } from "@/modules/memberships/components/test-panel";

// Standalone like the Stitch auth screens: brand + language only, no site navigation.
export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, brandAssets] = await Promise.all([getTranslations("Brand"), getBrandAssets()]);

  return (
    <>
      <header>
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center" aria-label={`${t("name")} ${t("studio")}`}>
            <BrandLockup
              name={t("name")}
              studio={t("studio")}
              logoAlt={t("logoAlt")}
              logoUrl={brandAssets.logoUrl}
            />
          </Link>
          <LocaleSwitcher />
        </Container>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <TestPanel />
    </>
  );
}
