"use client";

import { BookmarkIcon, ChartNoAxesColumnIcon, MessageCircleIcon, SunriseIcon, UserRoundIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { isActivePath, memberNavItems } from "./nav-items";

const icons = {
  "/dashboard": SunriseIcon,
  "/my-practices": BookmarkIcon,
  "/progress": ChartNoAxesColumnIcon,
  "/community": UsersIcon,
  "/guidance": MessageCircleIcon,
  "/profile": UserRoundIcon,
} as const;

/**
 * Tabs across the top of every member page. Desktop only: on phones `BottomTabs` is the
 * primary navigation, and the header's account menu still reaches the pages it doesn't carry.
 */
export function MemberNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("member")} className="hidden border-b border-hairline bg-surface lg:block">
      <ul className="mx-auto flex w-full max-w-content gap-1 overflow-x-auto px-margin-mobile [scrollbar-width:none] md:px-margin [&::-webkit-scrollbar]:hidden">
        {memberNavItems.map((item) => {
          const Icon = icons[item.href];
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-3.5 font-label-lg text-label-lg whitespace-nowrap transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary",
                )}
              >
                <Icon className="size-4" />
                {t(item.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
