import { ArrowRightIcon, BadgeCheckIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { cancelMembership, resumeMembership } from "../actions";
import type { Viewer } from "../server/viewer";

// Shown on /membership to people who already have access.
export async function MembershipStatus({ viewer, next }: { viewer: Viewer; next: string }) {
  const [t, format] = await Promise.all([getTranslations("Membership.active"), getFormatter()]);
  const membership = viewer.membership;
  const date = membership ? format.dateTime(membership.currentPeriodEnd, { dateStyle: "long" }) : "";
  const plan = membership ? t(`planNames.${membership.plan}`) : "";

  let detail = t("instructor");
  if (membership?.cancelAtPeriodEnd) detail = t("canceled", { date });
  else if (membership?.status === "trialing") detail = t("trial", { date, plan });
  else if (membership) detail = t("renews", { date, plan });

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-2xl bg-surface-container-lowest p-8 text-center shadow-ambient md:p-12">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
        <BadgeCheckIcon className="size-7" />
      </span>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">{t("title")}</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">{detail}</p>
      <Link
        href={next}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container"
      >
        {t("continue")}
        <ArrowRightIcon className="size-4 rtl:rotate-180" />
      </Link>
      {membership && (
        <form action={membership.cancelAtPeriodEnd ? resumeMembership : cancelMembership}>
          <button type="submit" className="font-label-md text-label-md text-on-surface-variant underline-offset-4 hover:text-primary hover:underline">
            {membership.cancelAtPeriodEnd ? t("resume") : t("cancel")}
          </button>
        </form>
      )}
    </div>
  );
}
