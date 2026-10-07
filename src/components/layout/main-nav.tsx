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
      className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:gap-1.5 overflow-x-auto lg:flex"
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
              "group relative inline-flex shrink-0 items-center justify-center rounded-full px-3.5 py-1.5 text-[13px] xl:text-[13.5px] font-medium tracking-normal transition-all duration-200 select-none",
              active
                ? "bg-primary/10 text-primary font-semibold shadow-[inset_0_1px_2px_rgba(47,79,65,0.06)] dark:bg-primary/20 dark:text-primary-fixed"
                : "text-on-surface-variant/85 hover:bg-surface-container-high/50 hover:text-on-surface active:scale-[0.97]",
            )}
          >
            <span>{item.label}</span>
            {active && (
              <span className="absolute bottom-1 inset-x-0 mx-auto size-1 rounded-full bg-primary dark:bg-primary-fixed shadow-xs" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
