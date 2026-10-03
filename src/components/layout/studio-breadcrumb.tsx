"use client";

import { useTranslations } from "next-intl";
import { createContext, Fragment, useContext, useEffect, useState } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, usePathname } from "@/i18n/navigation";

import { studioSectionFor } from "./studio-nav";

/** A trail entry after the section, e.g. the plan being edited. The last one is the page. */
export type StudioCrumbItem = { label: string; href?: string };

const CrumbContext = createContext<{
  items: StudioCrumbItem[];
  setItems: (items: StudioCrumbItem[]) => void;
} | null>(null);

/** Holds the trail that pages contribute; the header reads it. */
export function StudioBreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<StudioCrumbItem[]>([]);
  return <CrumbContext.Provider value={{ items, setItems }}>{children}</CrumbContext.Provider>;
}

/**
 * Rendered by a studio page to extend the breadcrumb beyond its section (the item being
 * edited, a filtered view…). Renders nothing itself; the trail clears when the page leaves.
 */
export function StudioCrumb({ items }: { items: StudioCrumbItem[] }) {
  const context = useContext(CrumbContext);
  const key = JSON.stringify(items);
  useEffect(() => {
    context?.setItems(JSON.parse(key) as StudioCrumbItem[]);
    return () => context?.setItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` is the serialized items
  }, [key]);
  return null;
}

/** Studio › Section › …items. The section links back to its list once there's more after it. */
export function StudioBreadcrumbTrail() {
  const t = useTranslations("Studio.nav");
  const pathname = usePathname();
  const section = studioSectionFor(pathname);
  const items = useContext(CrumbContext)?.items ?? [];

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="hidden sm:inline-flex">
          <BreadcrumbLink asChild>
            <Link href="/instructor">{t("title")}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {section && section.href !== "/instructor" && (
          <>
            <BreadcrumbSeparator className="hidden sm:inline-flex rtl:rotate-180" />
            <BreadcrumbItem className={items.length ? "hidden md:inline-flex" : "min-w-0"}>
              {items.length ? (
                <BreadcrumbLink asChild>
                  <Link href={section.href}>{t(section.label)}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate">{t(section.label)}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={`${index}-${item.label}`}>
              <BreadcrumbSeparator className="hidden md:inline-flex rtl:rotate-180" />
              <BreadcrumbItem className="min-w-0">
                {last || !item.href ? (
                  <BreadcrumbPage className="truncate">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
        {(!section || section.href === "/instructor") && (
          <>
            <BreadcrumbSeparator className="hidden sm:inline-flex rtl:rotate-180" />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("overview")}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
