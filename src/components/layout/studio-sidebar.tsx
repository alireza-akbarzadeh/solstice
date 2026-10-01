"use client";

import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CreditCardIcon,
  Flower2Icon,
  LayoutGridIcon,
  MegaphoneIcon,
  MessagesSquareIcon,
  UsersIcon,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";

/** Unread-style counts the sidebar surfaces, so the instructor sees work without opening pages. */
export type StudioBadges = { drafts: number; awaiting: number };

const groups = [
  {
    label: "studio",
    items: [
      {
        href: "/instructor",
        label: "overview",
        icon: LayoutGridIcon,
        exact: true,
      },
    ],
  },
  {
    label: "content",
    items: [
      {
        href: "/instructor/videos",
        label: "practices",
        icon: Flower2Icon,
        badge: "drafts",
      },
      { href: "/instructor/programs", label: "programs", icon: BookOpenIcon },
      { href: "/instructor/journal", label: "journal", icon: BookOpenIcon },
    ],
  },
  {
    label: "people",
    items: [
      { href: "/instructor/members", label: "members", icon: UsersIcon },
      {
        href: "/instructor/community",
        label: "community",
        icon: MessagesSquareIcon,
        badge: "awaiting",
      },
      {
        href: "/instructor/posts",
        label: "announcements",
        icon: MegaphoneIcon,
      },
    ],
  },
  {
    label: "business",
    items: [
      { href: "/instructor/revenue", label: "revenue", icon: CreditCardIcon },
    ],
  },
] as const satisfies readonly {
  label: string;
  items: readonly {
    href: string;
    label: string;
    icon: typeof LayoutGridIcon;
    exact?: true;
    badge?: keyof StudioBadges;
  }[];
}[];

/**
 * The studio's primary navigation. Collapses to icons on desktop and to a sheet on
 * phones (shadcn Sidebar); sits on the end side in Persian so it stays against the margin.
 */
export function StudioSidebar({ badges }: { badges: StudioBadges }) {
  const t = useTranslations("Studio.nav");
  const tBrand = useTranslations("Brand");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <Sidebar side={locale === "fa" ? "right" : "left"} collapsible="icon">
      <SidebarHeader className="border-hairline border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="hover:bg-surface-container-high"
            >
              <Link href="/instructor">
                <Image
                  src="/images/brand/logo.svg"
                  alt=""
                  width={32}
                  height={36}
                  className="h-9 w-8 shrink-0 object-contain"
                  sizes="32px"
                  unoptimized
                />
                <span className="flex min-w-0 flex-col">
                  <span className="font-heading text-primary truncate text-[1.625rem] leading-none font-semibold tracking-tight rtl:text-[1.375rem] rtl:leading-tight rtl:font-medium">
                    {tBrand("name")}
                  </span>
                  <span className="text-primary/65 mt-1 truncate font-sans text-[0.625rem] leading-tight font-medium rtl:text-[0.6875rem]">
                    {t("title")}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="font-label-sm text-label-sm text-clay tracking-widest uppercase">
              {t(group.label)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active =
                    "exact" in item
                      ? pathname === item.href
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  const count =
                    "badge" in item && item.badge ? badges[item.badge] : 0;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={t(item.label)}
                        className="font-label-md text-label-md data-active:bg-primary-container data-active:text-on-primary-container"
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{t(item.label)}</span>
                        </Link>
                      </SidebarMenuButton>
                      {count > 0 && (
                        <SidebarMenuBadge className="bg-clay/15 text-clay peer-data-active/menu-button:text-on-primary-container">
                          {count}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-hairline border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={t("site")}
              className="font-label-md text-label-md text-on-surface-variant"
            >
              <Link href="/">
                <ArrowUpRightIcon className="rtl:-scale-x-100" />
                <span>{t("site")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
