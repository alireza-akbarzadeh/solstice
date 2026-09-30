"use client";

import { 
  BadgeCheckIcon, 
  CreditCardIcon, 
  LogOutIcon, 
  UserIcon 
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { authClient } from "@/server/better-auth/client";

export type AccountStatus = "member" | "trial" | "instructor" | "none";

const statusKey = {
  member: "statusMember",
  trial: "statusTrial",
  instructor: "statusInstructor",
  none: "statusNone",
} as const;

const statusBadgeStyles: Record<AccountStatus, string> = {
  member: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  trial: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  instructor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  none: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-transparent",
};

export function AccountMenu({
  user,
  status,
}: {
  user: { name: string; email: string; image?: string | null };
  status: AccountStatus;
}) {
  const t = useTranslations("Account");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const signOut = () =>
    startTransition(async () => {
      await authClient.signOut();
      router.replace("/");
      router.refresh();
    });

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          disabled={isPending}
          aria-label={t("menu")}
        >
          <Avatar className="h-10 w-10 border border-border shadow-sm">
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback className="bg-linear-to-br from-violet-600 to-indigo-600 font-semibold text-white">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72 rounded-xl p-2 shadow-lg ring-1 ring-black/5 dark:ring-white/10"
      >
        {/* User Profile Header */}
        <DropdownMenuLabel className="p-3 font-normal">
          <div className="flex items-start gap-3">
            <Avatar className="h-11 w-11 border border-border">
              {user.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white">
                {userInitial}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col min-w-0 flex-1 space-y-1">
              <p className="truncate text-sm font-semibold text-foreground leading-tight">
                {user.name}
              </p>
              <p className="truncate text-xs font-mono text-muted-foreground leading-tight" dir="ltr">
                {user.email}
              </p>

              <div className="pt-1">
                <Badge
                  variant="outline"
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-wide ${statusBadgeStyles[status]}`}
                >
                  {status !== "none" && <BadgeCheckIcon className="h-3 w-3" />}
                  {t(statusKey[status])}
                </Badge>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="-mx-2 my-1" />

        {/* Navigation Section */}
        <DropdownMenuGroup className="space-y-0.5">
          <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2 text-xs font-medium">
            <Link href="/membership" className="flex items-center gap-2.5 w-full">
              <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
              <span>{t("membership")}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2 text-xs font-medium">
            <Link href="/account" className="flex items-center gap-2.5 w-full">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span>{t("profile") ?? "Profile"}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="-mx-2 my-1" />

        {/* Action / Sign Out */}
        <DropdownMenuItem
          onSelect={signOut}
          disabled={isPending}
          className="rounded-lg cursor-pointer py-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <LogOutIcon className="h-4 w-4" />
            <span>{t("signOut")}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}