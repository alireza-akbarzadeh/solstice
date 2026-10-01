import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BottomTabs } from "@/components/layout/bottom-tabs";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { routing } from "@/i18n/routing";
import { TestPanel } from "@/modules/memberships/components/test-panel";
import { getViewer } from "@/modules/memberships/server/viewer";

export default async function PublicLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // Layouts render independently of pages, so each one sets the locale for its own tree.
  setRequestLocale(locale);

  // Signed-in members get the app's tab bar even on public pages, so the shell never flickers
  // away as they move between the library and their sanctuary.
  const { user } = await getViewer();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter className={user ? "pb-safe-nav lg:pb-0" : undefined} />
      {user && <BottomTabs />}
      <TestPanel />
    </>
  );
}
