import { ArrowRightIcon, LockIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getPlanCatalog } from "@/modules/memberships/server/plans";

// practice-detail-locked-sanctuary-preview: poster behind a members-only invitation.
export async function LockedPracticeStage({
  poster,
  posterAlt,
  durationMinutes,
  primaryHref,
  signInHref,
}: {
  poster: string;
  posterAlt: string;
  durationMinutes: number;
  /** Sign-up (guests) or checkout (signed in), returning to this practice. */
  primaryHref: string;
  /** Only for guests. */
  signInHref?: string;
}) {
  const [t, { trialDays }] = await Promise.all([getTranslations("PracticeDetail.locked"), getPlanCatalog()]);

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-inverse-surface shadow-2xl sm:aspect-video">
      <Image src={poster} alt={posterAlt} fill priority sizes="(min-width: 1024px) 860px, 100vw" className="object-cover opacity-60 blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/50 to-inverse-surface/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-surface/15 text-secondary-fixed backdrop-blur-md">
          <LockIcon className="size-6" />
        </span>
        <span className="font-label-md text-label-md tracking-widest text-secondary-fixed uppercase">{t("badge")}</span>
        <p className="max-w-lg font-body-md text-body-md text-inverse-on-surface">
          {t("body", { minutes: durationMinutes, days: trialDays })}
        </p>
        <Link
          href={primaryHref}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-lg text-label-lg text-on-primary shadow-md transition-colors hover:bg-primary-container"
        >
          {t("cta", { days: trialDays })}
          <ArrowRightIcon className="size-4 rtl:rotate-180" />
        </Link>
        {signInHref && (
          <Link href={signInHref} className="font-label-md text-label-md text-inverse-on-surface/80 underline-offset-4 hover:underline">
            {t("signIn")}
          </Link>
        )}
      </div>
    </div>
  );
}
