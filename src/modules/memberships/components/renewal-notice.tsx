import { CalendarClockIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";

import { renewMembership } from "../actions";
import { renewsByHand } from "../server/memberships";
import type { Viewer } from "../server/viewer";

const DAY = 24 * 60 * 60 * 1000;
/** How early before the period ends the notice appears. */
export const RENEWAL_NOTICE_DAYS = 7;

/**
 * For memberships that don't renew by themselves (Zarinpal): a nudge in the last week with a
 * Renew button. Once the period has ended, the usual "membership ended" notices take over.
 */
export async function RenewalNotice({ viewer, back, className }: { viewer: Viewer; back: string; className?: string }) {
  const membership = viewer.membership;
  if (!membership || !viewer.hasAccess || !renewsByHand(membership) || viewer.user?.role === "instructor") return null;
  const left = Math.ceil((membership.currentPeriodEnd.getTime() - Date.now()) / DAY);
  if (left > RENEWAL_NOTICE_DAYS) return null;

  const [t, format] = await Promise.all([getTranslations("Membership.renewal"), getFormatter()]);
  const date = format.dateTime(membership.currentPeriodEnd, { dateStyle: "long" });
  const trial = membership.status === "trialing";

  return (
    <div
      role="status"
      className={cn("flex flex-col gap-3 rounded-xl bg-secondary-fixed/60 p-space-md text-on-secondary-fixed sm:flex-row sm:items-center sm:justify-between", className)}
    >
      <div className="flex items-start gap-3">
        <CalendarClockIcon aria-hidden className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-label-lg text-label-lg">{t(trial ? "trialTitle" : "title", { days: Math.max(left, 0), date })}</p>
          <p className="font-body-sm text-body-sm opacity-90">{t("body")}</p>
        </div>
      </div>
      <form action={renewMembership} className="shrink-0">
        <input type="hidden" name="back" value={back} />
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-5 py-2.5 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container sm:w-auto"
        >
          {trial ? t("payNow") : t("renew")}
        </button>
      </form>
    </div>
  );
}
