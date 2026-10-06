import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { LockIcon } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/modules/memberships/server/viewer";
import { getLiveClassBySlug } from "@/modules/classes/server/classes";
import { VirtualSanctuaryRoom } from "@/modules/classes/components/virtual-sanctuary-room";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const liveClass = await getLiveClassBySlug(slug);
  if (!liveClass) notFound();

  const title = localize(liveClass.title, locale);

  return {
    title: `${title} · Virtual Sanctuary Room · Arte Yoga Studio`,
    description: localize(liveClass.description, locale),
  };
}

export default async function LiveClassRoomPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await getViewer();
  const liveClass = await getLiveClassBySlug(slug, viewer.user?.id);
  if (!liveClass) notFound();

  const t = await getTranslations("LiveClasses");

  // Access control: members_only requires active membership or instructor role
  const isInstructor = viewer.user?.role === "instructor";
  const hasAccess = viewer.hasAccess || isInstructor;

  if (liveClass.access === "members_only" && !hasAccess) {
    if (!viewer.user) {
      redirect(`/sign-in?next=/classes/${slug}/live`);
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-space-lg text-center">
        <div className="max-w-md space-y-space-md rounded-3xl bg-surface-container-low p-space-xl border border-outline-variant/30 shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
            <LockIcon className="size-6 text-secondary" />
          </div>

          <div className="space-y-space-xs">
            <h1 className="font-headline-md text-headline-md text-primary">
              {t("membersOnly")}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {t("membershipRequiredError")}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full">
              <Link href={`/membership?next=/classes/${slug}/live`}>
                Join Sanctuary Membership
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/classes/${slug}`}>Back to Session Details</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <VirtualSanctuaryRoom
      liveClass={liveClass}
      isInstructor={isInstructor}
    />
  );
}
