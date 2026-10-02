"use client";

import { useTranslations } from "next-intl";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "@/i18n/navigation";

// Longest match wins, so /instructor/videos beats /instructor.
const sections = [
  { href: "/instructor/videos", label: "practices" },
  { href: "/instructor/programs", label: "programs" },
  { href: "/instructor/journal", label: "journal" },
  { href: "/instructor/pages", label: "pages" },
  { href: "/instructor/members", label: "members" },
  { href: "/instructor/community", label: "community" },
  { href: "/instructor/posts", label: "announcements" },
  { href: "/instructor/revenue", label: "revenue" },
  { href: "/instructor", label: "overview" },
] as const;

/** The studio's top bar: sidebar toggle, where you are, and the account controls. */
export function StudioHeader({ children }: { children?: React.ReactNode }) {
  const t = useTranslations("Studio.nav");
  const pathname = usePathname();
  const section = sections.find((s) => pathname === s.href || pathname.startsWith(`${s.href}/`));

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-space-sm border-b border-hairline bg-surface/85 px-margin-mobile backdrop-blur-md md:px-space-lg">
      <SidebarTrigger className="-ms-1 text-on-surface-variant" />
      <Separator orientation="vertical" className="me-1 data-[orientation=vertical]:h-4" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("title")}</span>
        <span className="truncate font-label-lg text-label-lg text-on-surface">{t(section?.label ?? "overview")}</span>
      </div>
      <div className="flex items-center gap-space-xs">{children}</div>
    </header>
  );
}
