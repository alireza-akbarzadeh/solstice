"use client";

import {
  ArrowUpRightIcon,
  CreditCardIcon,
  Flower2Icon,
  LayoutGridIcon,
  MegaphoneIcon,
  MessagesSquareIcon,
  UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/instructor", label: "overview", icon: LayoutGridIcon, exact: true },
  { href: "/instructor/videos", label: "practices", icon: Flower2Icon },
  { href: "/instructor/members", label: "members", icon: UsersIcon },
  { href: "/instructor/revenue", label: "revenue", icon: CreditCardIcon },
  { href: "/instructor/community", label: "community", icon: MessagesSquareIcon },
  { href: "/instructor/posts", label: "announcements", icon: MegaphoneIcon },
] as const;

/** Studio navigation: a sidebar on desktop, a scrolling tab row on phones. */
export function StudioNav() {
  const t = useTranslations("Studio.nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="lg:sticky lg:top-24">
      <p className="mb-3 hidden px-3 font-label-sm text-label-sm tracking-widest text-clay uppercase lg:block">{t("title")}</p>
      <ul className="-mx-margin-mobile flex gap-1 overflow-x-auto px-margin-mobile pb-2 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map(({ href, label, icon: Icon, ...rest }) => {
          const active = "exact" in rest ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 font-label-lg text-label-lg whitespace-nowrap transition-colors",
                  active ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container hover:text-primary",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {t(label)}
              </Link>
            </li>
          );
        })}
        <li className="lg:mt-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-label-md text-label-md whitespace-nowrap text-outline transition-colors hover:text-primary"
          >
            <ArrowUpRightIcon className="size-4 shrink-0 rtl:-scale-x-100" />
            {t("site")}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
