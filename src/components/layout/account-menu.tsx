"use client";

import {
  BadgeCheckIcon,
  BookmarkIcon,
  ChartNoAxesColumnIcon,
  ChevronRightIcon,
  CreditCardIcon,
  LayoutGridIcon,
  LogOutIcon,
  MessageCircleIcon,
  SunriseIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/server/better-auth/client";
import { AccountThemeToggle } from "@/components/theme/theme-toggle";

import { memberNavItems } from "./nav-items";

export type AccountStatus = "member" | "trial" | "instructor" | "none";

const statusKey = {
  member: "statusMember",
  trial: "statusTrial",
  instructor: "statusInstructor",
  none: "statusNone",
} as const;

const statusTone: Record<AccountStatus, string> = {
  member: "bg-primary-fixed text-on-primary-fixed",
  trial: "bg-secondary-fixed text-on-secondary-fixed",
  instructor: "bg-primary text-on-primary",
  none: "bg-surface-container-high text-on-surface-variant",
};

const icons = {
  "/dashboard": SunriseIcon,
  "/my-practices": BookmarkIcon,
  "/progress": ChartNoAxesColumnIcon,
  "/community": UsersIcon,
  "/guidance": MessageCircleIcon,
  "/profile": UserRoundIcon,
} as const;

export function AccountMenu({
  user,
  status,
}: {
  user: { name: string; email: string; image?: string | null };
  status: AccountStatus;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const t = useTranslations("Account");
  const tNav = useTranslations("Nav");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const signOut = () =>
    startTransition(async () => {
      await authClient.signOut();
      setOpen(false);
      router.replace("/");
      router.refresh();
    });

  const initial = user.name ? user.name.charAt(0).toUpperCase() : "·";

  const triggerButton = (
    <button
      type="button"
      disabled={isPending}
      aria-label={t("menu")}
      className="rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95"
    >
      <Avatar className="size-10 border border-outline-variant/30 ring-2 ring-transparent transition-all hover:ring-primary/40">
        {user.image && <AvatarImage src={user.image} alt="" />}
        <AvatarFallback className="bg-primary-container font-headline-sm text-sm font-semibold text-on-primary">
          {initial}
        </AvatarFallback>
      </Avatar>
    </button>
  );

  // Mobile bottom sheet with native drawer vibe
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="border-t border-hairline bg-surface p-0">
          <DrawerTitle className="sr-only">{t("menu")}</DrawerTitle>
          <div className="max-h-[85svh] overflow-y-auto overscroll-contain px-4 pb-safe pt-2">
            {/* Profile header card */}
          <div className="flex items-center gap-3.5 rounded-2xl bg-surface-container-low p-3.5">
            <Avatar className="size-12 ring-2 ring-primary/20">
              {user.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback className="bg-primary-container font-headline-sm text-headline-sm text-on-primary">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate font-headline-sm text-headline-sm text-on-surface">
                {user.name}
              </p>
              <p
                dir="ltr"
                className="truncate text-start font-body-sm text-body-sm text-on-surface-variant rtl:text-end"
              >
                {user.email}
              </p>
              <div className="mt-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-label-sm text-label-sm",
                    statusTone[status],
                  )}
                >
                  {status !== "none" && <BadgeCheckIcon className="size-3" />}
                  {t(statusKey[status])}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation items */}
          <nav className="my-3 flex flex-col gap-1">
            {memberNavItems.map((item) => {
              const Icon = icons[item.href];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-surface-container-low active:bg-surface-container"
                >
                  <span className="flex items-center gap-3 font-label-lg text-label-lg text-on-surface">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-surface-container text-primary">
                      <Icon className="size-4" />
                    </span>
                    {tNav(item.label)}
                  </span>
                  <ChevronRightIcon className="size-4 text-outline rtl:rotate-180" />
                </Link>
              );
            })}
            {status === "instructor" && (
              <Link
                href="/instructor"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-surface-container-low active:bg-surface-container"
              >
                <span className="flex items-center gap-3 font-label-lg text-label-lg text-on-surface">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-surface-container text-clay">
                    <LayoutGridIcon className="size-4" />
                  </span>
                  {t("studio")}
                </span>
                <ChevronRightIcon className="size-4 text-outline rtl:rotate-180" />
              </Link>
            )}
            <Link
              href="/membership"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-surface-container-low active:bg-surface-container"
            >
              <span className="flex items-center gap-3 font-label-lg text-label-lg text-on-surface">
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface-container text-primary">
                  <CreditCardIcon className="size-4" />
                </span>
                {t("membership")}
              </span>
              <ChevronRightIcon className="size-4 text-outline rtl:rotate-180" />
            </Link>
          </nav>

          {/* Theme Switch & Sign Out */}
          <div className="space-y-2.5 pt-1">
            <div className="rounded-xl bg-surface-container-low p-1.5">
              <AccountThemeToggle />
            </div>

            <button
              type="button"
              onClick={signOut}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 font-label-lg text-label-lg text-destructive transition-colors hover:bg-destructive/15 active:scale-[0.99] disabled:opacity-50"
            >
              <LogOutIcon className="size-4" />
              {t("signOut")}
            </button>
          </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop dropdown menu
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 rounded-xl p-2">
        <DropdownMenuLabel className="p-3 font-normal">
          <div className="flex items-start gap-3">
            <Avatar className="size-11">
              {user.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback className="bg-primary-container font-label-lg text-label-lg text-on-primary">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate font-label-lg text-label-lg text-on-surface">
                {user.name}
              </p>
              <p
                dir="ltr"
                className="truncate text-start font-body-sm text-body-sm text-on-surface-variant rtl:text-end"
              >
                {user.email}
              </p>
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-label-sm text-label-sm",
                  statusTone[status],
                )}
              >
                {status !== "none" && <BadgeCheckIcon className="size-3" />}
                {t(statusKey[status])}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {memberNavItems.map((item) => {
            const Icon = icons[item.href];
            return (
              <DropdownMenuItem
                key={item.href}
                asChild
                className="cursor-pointer rounded-lg py-2"
              >
                <Link href={item.href}>
                  <Icon className="text-on-surface-variant" />
                  {tNav(item.label)}
                </Link>
              </DropdownMenuItem>
            );
          })}
          {status === "instructor" && (
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-lg py-2"
            >
              <Link href="/instructor">
                <LayoutGridIcon className="text-on-surface-variant" />
                {t("studio")}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2">
            <Link href="/membership">
              <CreditCardIcon className="text-on-surface-variant" />
              {t("membership")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <div className="px-1 py-1">
          <AccountThemeToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={signOut}
          disabled={isPending}
          variant="destructive"
          className="cursor-pointer rounded-lg py-2"
        >
          <LogOutIcon />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
