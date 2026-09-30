import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/server/better-auth/server";

import { Container } from "./container";
import { LocaleSwitcher } from "./locale-switcher";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const [t, tBrand, session] = await Promise.all([
    getTranslations("Nav"),
    getTranslations("Brand"),
    getSession(),
  ]);
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 bg-surface/85 shadow-[0_1px_8px_rgba(0,0,0,0.03)] backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-space-md lg:h-20">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/images/brand/logo.png" alt={tBrand("logoAlt")} width={32} height={32} className="size-8" priority />
          <span className="flex flex-col">
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary">{tBrand("name")}</span>
            <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{tBrand("studio")}</span>
          </span>
        </Link>

        <MainNav />

        <div className="flex items-center gap-space-xs md:gap-space-md">
          <LocaleSwitcher />
          {user ? (
            <Link href="/profile" aria-label={t("account")} className="rounded-full">
              <Avatar>
                {user.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback className="bg-primary-fixed font-heading text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden font-label-lg text-label-lg tracking-wide text-on-surface-variant transition-colors hover:text-primary sm:inline-block"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/membership"
                className="hidden items-center justify-center rounded-full bg-primary px-6 py-2.5 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors duration-300 hover:bg-primary-container md:inline-flex"
              >
                {t("join")}
              </Link>
            </>
          )}
          <MobileNav signedIn={!!user} />
        </div>
      </Container>
    </header>
  );
}
