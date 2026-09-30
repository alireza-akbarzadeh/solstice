"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { isActivePath, publicNavItems } from "./nav-items";

export function MainNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("primary")} className="hidden items-center gap-space-lg lg:flex">
      {publicNavItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b border-transparent py-1 font-label-lg text-label-lg tracking-wider transition-colors duration-300",
              active ? "border-primary font-bold text-primary" : "text-on-surface-variant hover:text-primary",
            )}
          >
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
