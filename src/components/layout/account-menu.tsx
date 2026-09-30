"use client";

import {
  BadgeCheckIcon,
  BookmarkIcon,
  ChartNoAxesColumnIcon,
  CreditCardIcon,
  LogOutIcon,
  SunriseIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

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
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/server/better-auth/client";

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
  "/profile": UserRoundIcon,
} as const;

export function AccountMenu({ user, status }: { user: { name: string; email: string; image?: string | null }; status: AccountStatus }) {
  const t = useTranslations("Account");
  const tNav = useTranslations("Nav");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const signOut = () =>
    startTransition(async () => {
      await authClient.signOut();
      router.replace("/");
      router.refresh();
    });

  const initial = user.name ? user.name.charAt(0).toUpperCase() : "·";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        aria-label={t("menu")}
        className="rounded-full transition-transform focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
      >
        <Avatar className="size-10 ring-2 ring-primary-container/20">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback className="bg-primary-container font-label-lg text-label-lg text-on-primary">{initial}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 rounded-xl p-2">
        <DropdownMenuLabel className="p-3 font-normal">
          <div className="flex items-start gap-3">
            <Avatar className="size-11">
              {user.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback className="bg-primary-container font-label-lg text-label-lg text-on-primary">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate font-label-lg text-label-lg text-on-surface">{user.name}</p>
              <p dir="ltr" className="truncate text-start font-body-sm text-body-sm text-on-surface-variant rtl:text-end">
                {user.email}
              </p>
              <span className={cn("inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-label-sm text-label-sm", statusTone[status])}>
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
              <DropdownMenuItem key={item.href} asChild className="cursor-pointer rounded-lg py-2">
                <Link href={item.href}>
                  <Icon className="text-on-surface-variant" />
                  {tNav(item.label)}
                </Link>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2">
            <Link href="/membership">
              <CreditCardIcon className="text-on-surface-variant" />
              {t("membership")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} disabled={isPending} variant="destructive" className="cursor-pointer rounded-lg py-2">
          <LogOutIcon />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
