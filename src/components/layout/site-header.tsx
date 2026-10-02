import { getNavigationPages } from "@/modules/pages/server/library";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { isPushConfigured } from "@/infrastructure/push/web-push";
import { getViewer } from "@/modules/memberships/server/viewer";
import { PushToggle } from "@/modules/notifications/components/push-toggle";

import { AccountMenu, type AccountStatus } from "./account-menu";
import { BrandLockup } from "./brand-lockup";
import { Container } from "./container";
import { LocaleSwitcher } from "./locale-switcher";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const locale = await getLocale();
  const [t, tBrand, viewer, extraPages] = await Promise.all([
    getTranslations("Nav"),
    getTranslations("Brand"),
    getViewer(),
    getNavigationPages(locale).catch(() => []),
  ]);
  const { user } = viewer;

  let status: AccountStatus = "none";
  if (user?.role === "instructor") status = "instructor";
  else if (viewer.hasAccess)
    status = viewer.membership?.status === "trialing" ? "trial" : "member";

  return (
    <header className="bg-surface/85 sticky top-0 z-50 shadow-[0_1px_8px_rgba(0,0,0,0.03)] backdrop-blur-md">
      <Container className="gap-space-md flex h-16 items-center justify-between lg:h-22">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label={`${tBrand("name")} ${tBrand("studio")}`}
        >
          <BrandLockup
            name={tBrand("name")}
            studio={tBrand("studio")}
            logoAlt={tBrand("logoAlt")}
          />
        </Link>

        <MainNav extraItems={extraPages} />

        <div className="gap-space-xs md:gap-space-md flex items-center">
          <LocaleSwitcher />
          {user && isPushConfigured() && <PushToggle />}
          {!user && (
            <Link
              href="/sign-in"
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary hidden tracking-wide transition-colors sm:inline-block"
            >
              {t("signIn")}
            </Link>
          )}
          {!viewer.hasAccess && (
            <Link
              href="/membership"
              className="bg-primary font-label-lg text-label-lg text-on-primary hover:bg-primary-container hidden items-center justify-center rounded-full px-6 py-2.5 shadow-sm transition-colors duration-300 md:inline-flex"
            >
              {t("join")}
            </Link>
          )}
          {user && <AccountMenu user={user} status={status} />}
          <MobileNav
            extraItems={extraPages}
            signedIn={!!user}
            isInstructor={user?.role === "instructor"}
          />
        </div>
      </Container>
    </header>
  );
}
