import { getNavigationPages } from "@/modules/pages/server/library";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { isPushConfigured } from "@/infrastructure/push/web-push";
import { getBrandAssets } from "@/modules/brand/server/brand-assets";
import { getViewer } from "@/modules/memberships/server/viewer";
import { MessagesLink } from "@/modules/conversations/components/messages-link";
import { countUnreadForMember, countWaiting } from "@/modules/conversations/server/conversations";
import { hasGuidanceAccess } from "@/modules/conversations/server/guidance";
import { PushToggle } from "@/modules/notifications/components/push-toggle";

import { AccountMenu, type AccountStatus } from "./account-menu";
import { BrandLockup } from "./brand-lockup";
import { Container } from "./container";
import { LocaleSwitcher } from "./locale-switcher";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const locale = await getLocale();
  const [t, tBrand, viewer, extraPages, brandAssets] = await Promise.all([
    getTranslations("Nav"),
    getTranslations("Brand"),
    getViewer(),
    getNavigationPages(locale).catch(() => []),
    getBrandAssets(),
  ]);
  const { user } = viewer;

  // Conversations: instructor queue or member unread guidance replies
  const messages = await (async () => {
    try {
      if (user?.role === "instructor") return { href: "/instructor/inbox", count: await countWaiting() };
      if (user) return { href: "/guidance", count: (await hasGuidanceAccess(viewer)) ? await countUnreadForMember(user.id, "guidance") : 0 };
    } catch {
      // Conversations not migrated yet: no link
    }
    return null;
  })();

  let status: AccountStatus = "none";
  if (user?.role === "instructor") status = "instructor";
  else if (viewer.hasAccess)
    status = viewer.membership?.status === "trialing" ? "trial" : "member";

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/15 bg-surface/80 backdrop-blur-xl transition-all duration-300 shadow-[0_2px_16px_-4px_rgba(47,79,65,0.03)] dark:border-outline-variant/20 dark:bg-surface/85 dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]">
      <Container className="flex h-16 min-w-0 items-center justify-between gap-3 sm:gap-4 lg:h-20">
        <Link
          href="/"
          className="flex min-w-0 items-center lg:shrink-0 transition-opacity hover:opacity-90 active:scale-98"
          aria-label={`${tBrand("name")} ${tBrand("studio")}`}
        >
          <BrandLockup
            name={tBrand("name")}
            studio={tBrand("studio")}
            logoAlt={tBrand("logoAlt")}
            logoUrl={brandAssets.logoUrl}
          />
        </Link>

        <MainNav extraItems={extraPages} />

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          {/* Desktop utility dock capsule */}
          <div className="hidden sm:inline-flex items-center gap-1 rounded-full p-1 bg-surface-container-lowest/70 border border-outline-variant/25 backdrop-blur-md shadow-xs dark:bg-surface-container-high/35">
            <LocaleSwitcher />
            {user && isPushConfigured() && <PushToggle />}
            {messages && <MessagesLink href={messages.href} count={messages.count} />}
          </div>

          {/* On mobile: show Messages icon when there are unread items */}
          {messages && messages.count > 0 && (
            <div className="sm:hidden">
              <MessagesLink href={messages.href} count={messages.count} />
            </div>
          )}

          {!user && (
            <Link
              href="/sign-in"
              className="text-on-surface-variant hover:text-primary font-sans text-xs font-semibold uppercase tracking-wider px-3 py-1.5 transition-colors hidden md:inline-block"
            >
              {t("signIn")}
            </Link>
          )}

          {!viewer.hasAccess && (
            <Link
              href="/membership"
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-xs font-semibold tracking-wide text-on-primary shadow-xs transition-all duration-200 hover:bg-primary/90 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              {t("join")}
            </Link>
          )}

          {user && <AccountMenu user={user} status={status} />}

          <MobileNav
            extraItems={extraPages}
            signedIn={!!user}
            isInstructor={user?.role === "instructor"}
            user={user}
            status={status}
            logoUrl={brandAssets.logoUrl}
          />
        </div>
      </Container>
    </header>
  );
}
