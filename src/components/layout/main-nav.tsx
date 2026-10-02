"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { isActivePath, publicNavItems } from "./nav-items";

export function MainNav({
  extraItems = [],
}: {
  extraItems?: { href: string; label: string }[];
}) {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("primary")}
      className="hidden min-w-0 flex-1 items-center gap-5 overflow-x-auto lg:flex"
    >
      {[
        ...publicNavItems.map((item) => ({
          href: item.href,
          label: t(item.label),
        })),
        ...extraItems,
      ].map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "font-label-lg text-label-lg max-w-44 shrink-0 truncate border-b border-transparent py-1 tracking-wider transition-colors duration-300",
              active
                ? "border-primary text-primary font-bold"
                : "text-on-surface-variant hover:text-primary",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
