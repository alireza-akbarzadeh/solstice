"use client";

import { LayoutGridIcon, MenuIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { getDirection, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { isActivePath, memberNavItems, publicNavItems } from "./nav-items";
import { AccountThemeToggle } from "@/components/theme/theme-toggle";
import { BrandLockup } from "./brand-lockup";

type AccountStatus = "none" | "trial" | "member" | "instructor";

const statusTone: Record<AccountStatus, string> = {
  member: "bg-primary-fixed text-on-primary-fixed",
  trial: "bg-secondary-fixed text-on-secondary-fixed",
  instructor: "bg-primary text-on-primary",
  none: "bg-surface-container-high text-on-surface-variant",
};

export function MobileNav({
  signedIn,
  isInstructor,
  extraItems = [],
  user,
  status = "none",
}: {
  signedIn: boolean;
  isInstructor: boolean;
  extraItems?: { href: string; label: string }[];
  user?: { name: string; email: string; image?: string | null } | null;
  status?: AccountStatus;
}) {
  const t = useTranslations("Nav");
  const tAccount = useTranslations("Account");
  const tBrand = useTranslations("Brand");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const side = getDirection(locale) === "rtl" ? "left" : "right";

  function switchLocale(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- params always match the current pathname
        { pathname, params },
        { locale: next },
      );
      setOpen(false);
    });
  }

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "·";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex size-9.5 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-low/70 text-on-surface-variant backdrop-blur-sm transition-all hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 lg:hidden dark:bg-surface-container-high/40 dark:hover:bg-surface-container-highest/80"
          aria-label={t("openMenu")}
        >
          <MenuIcon className="size-4.5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side={side}
        className="flex w-84 max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-y-auto border-hairline bg-surface/98 p-5 backdrop-blur-2xl [overflow-wrap:anywhere]"
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <Link href="/" onClick={() => setOpen(false)}>
            <BrandLockup
              name={tBrand("name")}
              studio={tBrand("studio")}
              logoAlt={tBrand("logoAlt")}
            />
          </Link>
          <SheetTitle className="sr-only">{t("menuTitle")}</SheetTitle>
        </div>

        {/* Bilingual Segmented Switcher */}
        <div className="mt-4 flex items-center rounded-full border border-outline-variant/20 bg-surface-container-low/60 p-1">
          <button
            type="button"
            onClick={() => switchLocale("en")}
            className={cn(
              "flex-1 rounded-full py-1.5 text-center font-mono text-xs font-semibold uppercase tracking-wider transition-all",
              locale === "en"
                ? "bg-surface text-primary shadow-xs"
                : "text-on-surface-variant/75 hover:text-on-surface",
            )}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => switchLocale("fa")}
            className={cn(
              "flex-1 rounded-full py-1.5 text-center font-sans text-xs font-semibold transition-all",
              locale === "fa"
                ? "bg-surface text-primary shadow-xs"
                : "text-on-surface-variant/75 hover:text-on-surface",
            )}
          >
            فارسی
          </button>
        </div>

        {/* Public Navigation */}
        <div className="mt-4 flex flex-col gap-1">
          <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-clay">
            {t("primary")}
          </span>
          <nav aria-label={t("primary")} className="mt-1 flex flex-col gap-1">
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
                    "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "border-s-3 border-primary bg-primary/10 font-semibold text-primary"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                  )}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Member Section if signed in */}
        {signedIn && user && (
          <div className="mt-5 border-t border-hairline pt-4">
            <div className="flex items-center gap-3 rounded-xl bg-surface-container-low/60 p-2.5">
              <Avatar className="size-9 border border-outline-variant/30 ring-1 ring-primary/20">
                {user.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback
                  className={cn(
                    "text-xs font-semibold tracking-wider",
                    statusTone[status],
                  )}
                >
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-sans text-xs font-semibold text-on-surface">
                  {user.name || user.email}
                </span>
                <span className="truncate font-sans text-[11px] text-on-surface-variant">
                  {user.email}
                </span>
              </div>
              {status !== "none" && (
                <Badge
                  variant="outline"
                  className="rounded-full px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30 bg-primary/10"
                >
                  {status}
                </Badge>
              )}
            </div>

            <nav aria-label={t("member")} className="mt-3 flex flex-col gap-0.5">
              <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-clay mb-1">
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
                      "flex items-center justify-between rounded-xl px-3.5 py-2 text-sm transition-all",
                      active
                        ? "border-s-3 border-primary bg-primary/10 font-semibold text-primary"
                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                    )}
                  >
                    <span>{t(item.label)}</span>
                  </Link>
                );
              })}

              {isInstructor && (
                <Link
                  href="/instructor"
                  onClick={() => setOpen(false)}
                  aria-current={
                    isActivePath(pathname, "/instructor") ? "page" : undefined
                  }
                  className={cn(
                    "mt-1 flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all",
                    isActivePath(pathname, "/instructor")
                      ? "border-s-3 border-primary bg-primary/10 text-primary"
                      : "text-clay hover:bg-surface-container-low hover:text-primary",
                  )}
                >
                  <LayoutGridIcon className="size-4" />
                  <span>{tAccount("studio")}</span>
                </Link>
              )}
            </nav>
          </div>
        )}

        {/* Appearance Toggle */}
        <div className="mt-5 border-t border-hairline pt-4">
          <AccountThemeToggle />
        </div>

        {/* Visitor Actions when signed out */}
        {!signedIn && (
          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Link
              href="/membership"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-on-primary shadow-xs transition-all hover:bg-primary/90 active:scale-98"
            >
              {t("join")}
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-low/50 px-5 py-2 text-center text-sm font-medium text-on-surface transition-all hover:bg-surface-container"
            >
              {t("signIn")}
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
