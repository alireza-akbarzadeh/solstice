"use client";

import { Flower2Icon, RouteIcon, SunIcon, SunriseIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { isActivePath } from "./nav-items";

// Stitch: the fixed tab bar on today-sanctuary / community-reflections (mobile).
const tabs = [
  { href: "/dashboard", label: "today", icon: SunriseIcon },
  { href: "/practices", label: "library", icon: Flower2Icon },
  { href: "/programs", label: "programs", icon: RouteIcon },
  { href: "/community", label: "community", icon: UsersIcon },
  { href: "/profile", label: "mySpace", icon: SunIcon },
] as const;

/**
 * The app shell's bottom navigation: phones only, signed-in members only. Signed-out visitors
 * are reading a marketing site and keep the header's sheet menu — every tab here would bounce
 * them to sign-in. Hidden from `lg` up, where the header nav takes over.
 */
export function BottomTabs() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("primary")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/90 pb-safe backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex h-(--bottom-nav-height) max-w-lg items-stretch justify-between px-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-full min-w-11 flex-col items-center justify-center gap-0.5 transition-colors",
                  active ? "text-primary" : "text-on-surface-variant hover:text-primary",
                )}
              >
                <Icon className={cn("size-[22px] transition-transform group-active:scale-95", active && "fill-primary/10")} />
                <span className={cn("font-label-sm text-label-sm tracking-normal", active && "font-semibold")}>{t(label)}</span>
                <span aria-hidden className={cn("size-1 rounded-full bg-primary transition-opacity", active ? "opacity-100" : "opacity-0")} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
