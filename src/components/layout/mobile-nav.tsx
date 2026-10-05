"use client";

import { LayoutGridIcon, MenuIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { getDirection } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { isActivePath, memberNavItems, publicNavItems } from "./nav-items";
import { AccountThemeToggle } from "@/components/theme/theme-toggle";

export function MobileNav({
  signedIn,
  isInstructor,
  extraItems = [],
}: {
  signedIn: boolean;
  isInstructor: boolean;
  extraItems?: { href: string; label: string }[];
}) {
  const t = useTranslations("Nav");
  const tAccount = useTranslations("Account");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Sheet sides are physical; open from the inline end in both directions.
  const side = getDirection(useLocale()) === "rtl" ? "left" : "right";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="size-11 rounded-full lg:hidden"
          aria-label={t("openMenu")}
        >
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={side}
        className="w-80 max-w-[calc(100vw-1rem)] overflow-y-auto border-hairline bg-surface p-space-lg [overflow-wrap:anywhere]"
      >
        <SheetTitle className="font-label-md text-label-md text-clay tracking-widest uppercase">
          {t("menuTitle")}
        </SheetTitle>
        <nav aria-label={t("primary")} className="mt-space-md flex flex-col">
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
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "border-hairline py-space-sm font-headline-sm text-headline-sm border-b transition-colors",
                  active
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {signedIn && (
          <nav aria-label={t("member")} className="mt-space-md flex flex-col">
            <span className="font-label-sm text-label-sm text-clay mb-1 tracking-widest uppercase">
              {t("account")}
            </span>
            {memberNavItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "font-label-lg text-label-lg py-2 transition-colors",
                    active
                      ? "text-primary"
                      : "text-on-surface-variant hover:text-primary",
                  )}
                >
                  {t(item.label)}
                </Link>
              );
            })}
            {/* The studio is not advertised, but an instructor needs to reach it on a phone too. */}
            {isInstructor && (
              <Link
                href="/instructor"
                onClick={() => setOpen(false)}
                aria-current={
                  isActivePath(pathname, "/instructor") ? "page" : undefined
                }
                className={cn(
                  "font-label-lg text-label-lg mt-1 flex items-center gap-2 py-2 transition-colors",
                  isActivePath(pathname, "/instructor")
                    ? "text-primary"
                    : "text-clay hover:text-primary",
                )}
              >
                <LayoutGridIcon className="size-4" />
                {tAccount("studio")}
              </Link>
            )}
          </nav>
        )}
        <div className="mt-space-md border-t border-hairline pt-space-sm">
          <AccountThemeToggle />
        </div>
        {!signedIn && (
          <div className="gap-space-sm mt-auto flex flex-col">
            <Link
              href="/membership"
              onClick={() => setOpen(false)}
              className="bg-primary font-label-lg text-label-lg text-on-primary hover:bg-primary-container rounded-full px-6 py-3 text-center transition-colors"
            >
              {t("join")}
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary py-2 text-center"
            >
              {t("signIn")}
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
