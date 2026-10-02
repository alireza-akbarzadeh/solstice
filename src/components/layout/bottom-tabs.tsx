"use client";

import { BookOpenIcon, Flower2Icon, HouseIcon, LogInIcon, RouteIcon, SunIcon, SunriseIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { isActivePath } from "./nav-items";

// Stitch: the fixed tab bar on today-sanctuary / community-reflections (mobile).
const memberTabs = [
  { href: "/dashboard", label: "today", icon: SunriseIcon },
  { href: "/practices", label: "library", icon: Flower2Icon },
  { href: "/programs", label: "programs", icon: RouteIcon },
  { href: "/community", label: "community", icon: UsersIcon },
  { href: "/profile", label: "mySpace", icon: SunIcon },
] as const;

const guestTabs = [
  { href: "/", label: "home", icon: HouseIcon },
  { href: "/practices", label: "library", icon: Flower2Icon },
  { href: "/programs", label: "programs", icon: RouteIcon },
  { href: "/journal", label: "journal", icon: BookOpenIcon },
  { href: "/sign-in", label: "signIn", icon: LogInIcon },
] as const;

/**
 * The mobile shell is available before and after sign-in. Guests browse public pages;
 * members also get their dashboard, community and profile. Desktop uses the header nav.
 */
export function BottomTabs({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const tabs = signedIn ? memberTabs : guestTabs;

  return (
    <nav
      aria-label={t("primary")}
      data-slot="bottom-tabs"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/90 pb-safe backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid h-(--bottom-nav-height) w-full max-w-lg grid-cols-5 px-[max(0.25rem,env(safe-area-inset-left,0px),env(safe-area-inset-right,0px))]">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={t(label)}
                className={cn(
                  "group flex h-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                  active ? "text-primary" : "text-on-surface-variant hover:text-primary",
                )}
              >
                <Icon aria-hidden className={cn("size-[22px] shrink-0 transition-transform group-active:scale-95", active && "fill-primary/10")} />
                <span className={cn("line-clamp-2 max-w-full font-label-sm text-label-sm text-center leading-tight tracking-normal [overflow-wrap:anywhere]", active && "font-semibold")}>{t(label)}</span>
                <span aria-hidden className={cn("size-1 shrink-0 rounded-full bg-primary transition-opacity", active ? "opacity-100" : "opacity-0")} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
