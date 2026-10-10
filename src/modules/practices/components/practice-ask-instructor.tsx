import { MessageCircleHeartIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { SocialIcon } from "@/modules/contact/components/social-icon";

export async function PracticeAskInstructor({
  instructorName,
  practiceTitle: _practiceTitle,
  practiceSlug,
  signedIn,
  telegramUrl = "https://t.me/solstice_yoga",
  instagramUrl = "https://instagram.com/solstice_yoga",
  instructorAvatar = "/images/brand/elena-closeup.jpg",
}: {
  instructorName: string;
  practiceTitle: string;
  practiceSlug: string;
  signedIn: boolean;
  telegramUrl?: string;
  instagramUrl?: string;
  instructorAvatar?: string;
}) {
  const t = await getTranslations("PracticeDetail.askInstructor");
  const guidanceHref = signedIn ? `/guidance?practice=${encodeURIComponent(practiceSlug)}` : `/sign-in?next=${encodeURIComponent(`/guidance?practice=${practiceSlug}`)}`;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 md:p-8 shadow-xs">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Image
              src={instructorAvatar}
              alt={instructorName}
              width={64}
              height={64}
              className="size-16 rounded-full object-cover ring-4 ring-surface"
            />
            <span
              className="absolute bottom-0 end-0 size-3.5 rounded-full border-2 border-surface bg-emerald-500"
              title="Online"
            />
          </div>

          <div className="space-y-1">
            <span className="font-label-sm text-label-sm font-semibold tracking-wider text-clay uppercase">
              {t("eyebrow")} · {instructorName}
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {t("title")}
            </h2>
            <p className="max-w-xl font-body-sm text-body-sm text-on-surface-variant">
              {t("subtitle", { name: instructorName })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={guidanceHref}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 font-label-md text-label-md text-on-primary shadow-xs transition-colors hover:bg-primary-container hover:text-on-primary-container"
          >
            <MessageCircleHeartIcon className="size-4 shrink-0" />
            <span>{t("askInSanctuary")}</span>
          </Link>

          {telegramUrl && (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface px-3.5 font-label-md text-label-md text-on-surface transition-colors hover:border-primary/40 hover:bg-surface-container hover:text-primary"
            >
              <SocialIcon network="telegram" className="size-4 text-[#229ED9]" />
              <span>{t("telegram")}</span>
            </a>
          )}

          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface px-3.5 font-label-md text-label-md text-on-surface transition-colors hover:border-primary/40 hover:bg-surface-container hover:text-primary"
            >
              <SocialIcon network="instagram" className="size-4 text-[#E1306C]" />
              <span>{t("instagram")}</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
