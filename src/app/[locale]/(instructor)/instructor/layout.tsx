import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountMenu } from "@/components/layout/account-menu";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { StudioHeader } from "@/components/layout/studio-header";
import { StudioSidebar } from "@/components/layout/studio-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { routing } from "@/i18n/routing";
import { isPushConfigured } from "@/infrastructure/push/web-push";
import { getStudioBadges } from "@/modules/instructor/server/studio";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { TestPanel } from "@/modules/memberships/components/test-panel";
import { PushToggle } from "@/modules/notifications/components/push-toggle";

/**
 * The instructor's studio: a shadcn sidebar shell, separate from the public site chrome.
 * Guarded here and again in each page, since a layout doesn't re-run on every navigation.
 */
export default async function InstructorLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await requireInstructor(locale, "/instructor");
  const badges = await getStudioBadges();

  return (
    // The sidebar shows tooltips for its icons once collapsed, so it needs a TooltipProvider.
    <TooltipProvider>
      <SidebarProvider>
        <StudioSidebar badges={badges} />
        <SidebarInset className="min-w-0 bg-surface">
          <StudioHeader>
            <LocaleSwitcher />
            {isPushConfigured() && <PushToggle />}
            <AccountMenu user={viewer.user} status="instructor" />
          </StudioHeader>
          <div className="min-w-0 flex-1 px-margin-mobile py-space-lg md:px-space-lg md:py-space-xl">{children}</div>
        </SidebarInset>
        <TestPanel />
      </SidebarProvider>
    </TooltipProvider>
  );
}
