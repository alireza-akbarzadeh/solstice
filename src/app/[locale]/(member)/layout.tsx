import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BottomTabs } from "@/components/layout/bottom-tabs";
import { MemberNav } from "@/components/layout/member-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { routing } from "@/i18n/routing";
import { TestPanel } from "@/modules/memberships/components/test-panel";

// The signed-in area. Each page guards itself with requireUser() so it can return here after sign-in.
export default async function MemberLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <MemberNav />
      <main className="flex-1 bg-surface">{children}</main>
      <SiteFooter className="pb-safe-nav lg:pb-0" />
      <BottomTabs />
      <TestPanel />
    </>
  );
}
