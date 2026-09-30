import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { StudioNav } from "@/components/layout/studio-nav";
import { routing } from "@/i18n/routing";
import { TestPanel } from "@/modules/memberships/components/test-panel";

// The instructor's studio. Each page guards itself with requireInstructor().
export default async function InstructorLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-surface-container-low">
        <Container className="grid grid-cols-1 gap-gutter py-space-lg lg:grid-cols-[220px_1fr] lg:py-space-xl">
          <StudioNav />
          <div className="min-w-0">{children}</div>
        </Container>
      </main>
      <TestPanel />
    </>
  );
}
