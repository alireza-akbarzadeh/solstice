import { hasLocale } from "next-intl";
import { headers } from "next/headers";
import { notFound, redirect as redirectExternal } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Button } from "@/components/ui/button";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { auth } from "@/server/better-auth";
import { getSession } from "@/server/better-auth/server";

// Placeholder until the Stitch home design is implemented (see PROGRESS.md).
export default async function HomePage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const session = await getSession();

  async function signInWithGoogle() {
    "use server";
    const res = await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL: locale === "en" ? "/" : `/${locale}`,
      },
    });
    if (!res.url) throw new Error("No URL returned from signInSocial");
    redirectExternal(res.url);
  }

  async function signOut() {
    "use server";
    await auth.api.signOut({ headers: await headers() });
    redirect({ href: "/", locale });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="absolute end-4 top-4">
        <LocaleSwitcher />
      </div>
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-5xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      {session ? (
        <form action={signOut} className="flex flex-col items-center gap-3">
          <p>{t("signedInAs", { name: session.user.name })}</p>
          <Button variant="outline">{t("signOut")}</Button>
        </form>
      ) : (
        <form action={signInWithGoogle}>
          <Button>{t("signInWithGoogle")}</Button>
        </form>
      )}
    </main>
  );
}
