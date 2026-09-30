import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { isPushConfigured } from "@/infrastructure/push/web-push";
import { getViewer } from "@/modules/memberships/server/viewer";
import { PushToggle } from "@/modules/notifications/components/push-toggle";

import { AccountMenu, type AccountStatus } from "./account-menu";
import { Container } from "./container";
import { LocaleSwitcher } from "./locale-switcher";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const [t, tBrand, viewer] = await Promise.all([getTranslations("Nav"), getTranslations("Brand"), getViewer()]);
  const { user } = viewer;

  let status: AccountStatus = "none";
  if (user?.role === "instructor") status = "instructor";
  else if (viewer.hasAccess) status = viewer.membership?.status === "trialing" ? "trial" : "member";

  return (
    <header className="sticky top-0 z-50 bg-surface/85 shadow-[0_1px_8px_rgba(0,0,0,0.03)] backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-space-md lg:h-20">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/icons/mark.svg" alt={tBrand("logoAlt")} width={32} height={32} className="size-8" priority unoptimized />
          <span className="flex flex-col">
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary">{tBrand("name")}</span>
            <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{tBrand("studio")}</span>
          </span>
        </Link>

        <MainNav />

        <div className="flex items-center gap-space-xs md:gap-space-md">
          <LocaleSwitcher />
          {user && isPushConfigured() && <PushToggle />}
          {!user && (
            <Link
              href="/sign-in"
              className="hidden font-label-lg text-label-lg tracking-wide text-on-surface-variant transition-colors hover:text-primary sm:inline-block"
            >
              {t("signIn")}
            </Link>
          )}
          {!viewer.hasAccess && (
            <Link
              href="/membership"
              className="hidden items-center justify-center rounded-full bg-primary px-6 py-2.5 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors duration-300 hover:bg-primary-container md:inline-flex"
            >
              {t("join")}
            </Link>
          )}
          {user && <AccountMenu user={user} status={status} />}
          <MobileNav signedIn={!!user} />
        </div>
      </Container>
    </header>
  );
}
