"use client";

import { FlaskConicalIcon, InboxIcon, LoaderCircleIcon, LogInIcon, LogOutIcon, UserPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { withNext } from "@/lib/safe-next";
import { authClient } from "@/server/better-auth/client";

import { createTestAccount, setTestMembership, setTestRole } from "../test-actions";
import { membershipPresets, type MembershipPreset } from "../test-presets";

type Props = {
  user: { name: string; email: string; role: "member" | "instructor" } | null;
  hasAccess: boolean;
  preset: MembershipPreset;
  periodEnd: string | null;
  daysLeft: number | null;
  password: string;
};

export function TestPanelMenu({ user, hasAccess, preset, periodEnd, daysLeft, password }: Props) {
  const t = useTranslations("TestMode.panel");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const run = (work: () => Promise<unknown>, done?: string) =>
    startTransition(async () => {
      try {
        await work();
        router.refresh();
        if (done) toast.success(done);
      } catch {
        toast.error(t("failed"));
      }
    });

  const signOut = () => run(() => authClient.signOut(), t("signedOut"));

  const state = !user ? t("state.guest") : user.role === "instructor" ? t("state.instructor") : hasAccess ? t("state.member") : t("state.free");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        // Lifted clear of the mobile tab bar; back to the corner once that bar is gone.
        className="fixed end-4 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px)+0.75rem)] z-[60] inline-flex items-center gap-2 rounded-full bg-inverse-surface px-3.5 py-2 font-label-md text-label-md text-inverse-on-surface shadow-lg transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-95 lg:bottom-4"
        aria-label={t("open")}
      >
        {pending ? <LoaderCircleIcon className="size-4 animate-spin" /> : <FlaskConicalIcon className="size-4" />}
        <span className="tracking-wider uppercase">{t("badge")}</span>
        <span className="rounded-full bg-inverse-on-surface/15 px-2 py-0.5 normal-case">{state}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="end" className="max-h-[80svh] w-80 overflow-y-auto">
        <DropdownMenuLabel className="space-y-1 font-normal whitespace-normal">
          <span className="block font-label-lg text-label-lg text-on-surface">{t("title")}</span>
          <span className="block font-body-sm text-body-sm text-on-surface-variant">{t("body")}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!user ? (
          <>
            <DropdownMenuItem disabled={pending} onSelect={() => run(createTestAccount, t("accountCreated"))}>
              <UserPlusIcon />
              {t("createAccount")}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={withNext("/sign-in", pathname)}>
                <LogInIcon />
                {t("signIn")}
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="font-normal whitespace-normal">
              <span className="block truncate font-label-md text-label-md text-on-surface">{user.name}</span>
              <span className="block truncate font-body-sm text-body-sm text-on-surface-variant">{user.email}</span>
              {user.email.endsWith("@solstice.test") && (
                <span className="block font-body-sm text-body-sm text-outline">{t("password", { password })}</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuLabel className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("roleTitle")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={user.role}
              onValueChange={(role) => run(() => setTestRole(role as "member" | "instructor"))}
            >
              <DropdownMenuRadioItem value="member" disabled={pending} onSelect={(e) => e.preventDefault()}>
                {t("roles.member")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="instructor" disabled={pending} onSelect={(e) => e.preventDefault()}>
                {t("roles.instructor")}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />

            <DropdownMenuLabel className="font-label-sm text-label-sm tracking-widest text-clay uppercase">
              {t("membershipTitle")}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={preset} onValueChange={(p) => run(() => setTestMembership(p as MembershipPreset))}>
              {membershipPresets.map((p) => (
                <DropdownMenuRadioItem key={p} value={p} disabled={pending} onSelect={(e) => e.preventDefault()}>
                  <span className="flex flex-col">
                    <span>{t(`presets.${p}.label`)}</span>
                    <span className="font-body-sm text-[12px] text-outline">{t(`presets.${p}.hint`)}</span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {periodEnd && daysLeft !== null && (
              <p className="px-2 pb-1 font-body-sm text-[12px] text-on-surface-variant">
                {daysLeft > 0 ? t("periodEnds", { date: periodEnd, days: daysLeft }) : t("periodEnded", { date: periodEnd })}
              </p>
            )}
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/membership">{t("checkout")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled={pending} onSelect={() => run(createTestAccount, t("accountCreated"))}>
              <UserPlusIcon />
              {t("freshAccount")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={pending} onSelect={signOut}>
              <LogOutIcon />
              {t("signOut")}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/test/mailbox">
            <InboxIcon />
            {t("mailbox")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
