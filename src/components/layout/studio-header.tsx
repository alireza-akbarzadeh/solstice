"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { StudioBreadcrumbTrail } from "./studio-breadcrumb";
import { StudioCommand } from "./studio-command";

/**
 * The studio's top bar: sidebar toggle, a breadcrumb of where you are (pages add the item
 * they show with <StudioCrumb>), the ⌘K search, and the account controls.
 */
export function StudioHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-space-sm border-b border-hairline bg-surface/85 px-margin-mobile backdrop-blur-md md:px-space-lg">
      <SidebarTrigger className="-ms-1 text-on-surface-variant" />
      <Separator orientation="vertical" className="me-1 data-[orientation=vertical]:h-4" />
      <div className="flex min-w-0 flex-1 items-center gap-space-md">
        <div className="min-w-0 shrink">
          <StudioBreadcrumbTrail />
        </div>
        <div className="ms-auto flex min-w-0 flex-1 justify-end lg:justify-center">
          <StudioCommand />
        </div>
      </div>
      <div className="flex items-center gap-space-xs">{children}</div>
    </header>
  );
}
