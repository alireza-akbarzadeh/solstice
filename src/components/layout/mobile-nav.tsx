"use client";

import { LayoutGridIcon, MenuIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { getDirection } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { isActivePath, memberNavItems, publicNavItems } from "./nav-items";

export function MobileNav({ signedIn, isInstructor }: { signedIn: boolean; isInstructor: boolean }) {
  const t = useTranslations("Nav");
  const tAccount = useTranslations("Account");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Sheet sides are physical; open from the inline end in both directions.
  const side = getDirection(useLocale()) === "rtl" ? "left" : "right";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="rounded-full lg:hidden" aria-label={t("openMenu")}>
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="w-80 border-hairline bg-surface p-space-lg">
        <SheetTitle className="font-label-md text-label-md tracking-widest text-clay uppercase">
          {t("menuTitle")}
        </SheetTitle>
        <nav aria-label={t("primary")} className="mt-space-md flex flex-col">
          {publicNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "border-b border-hairline py-space-sm font-headline-sm text-headline-sm transition-colors",
                  active ? "text-primary" : "text-on-surface-variant hover:text-primary",
                )}
              >
                {t(item.label)}
              </Link>
            );
          })}
        </nav>
        {signedIn && (
          <nav aria-label={t("member")} className="mt-space-md flex flex-col">
            <span className="mb-1 font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("account")}</span>
            {memberNavItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "py-2 font-label-lg text-label-lg transition-colors",
                    active ? "text-primary" : "text-on-surface-variant hover:text-primary",
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
                aria-current={isActivePath(pathname, "/instructor") ? "page" : undefined}
                className={cn(
                  "mt-1 flex items-center gap-2 py-2 font-label-lg text-label-lg transition-colors",
                  isActivePath(pathname, "/instructor") ? "text-primary" : "text-clay hover:text-primary",
                )}
              >
                <LayoutGridIcon className="size-4" />
                {tAccount("studio")}
              </Link>
            )}
          </nav>
        )}
        {!signedIn && (
          <div className="mt-auto flex flex-col gap-space-sm">
            <Link
              href="/membership"
              onClick={() => setOpen(false)}
              className="rounded-full bg-primary px-6 py-3 text-center font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container"
            >
              {t("join")}
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="py-2 text-center font-label-lg text-label-lg text-on-surface-variant hover:text-primary"
            >
              {t("signIn")}
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
