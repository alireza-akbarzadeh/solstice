import { ReceiptTextIcon } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";

import { DEFAULT_CURRENCY, formatMoney, isCurrency, type MembershipPlan } from "../plans";
import type { Payment } from "../server/billing";

/** The money side of a payment, refunds included, in its own currency. */
export function paymentMoney(format: Awaited<ReturnType<typeof getFormatter>>, payment: Pick<Payment, "currency">, amount: number, locale: string) {
  return formatMoney(format, amount, isCurrency(payment.currency) ? payment.currency : DEFAULT_CURRENCY, locale);
}

/** The member's own charges with a receipt link each (profile → membership). */
export async function BillingHistory({ payments, plans }: { payments: Payment[]; plans: MembershipPlan[] }) {
  if (payments.length === 0) return null;
  const [t, format, locale] = await Promise.all([getTranslations("Profile.billing"), getFormatter(), getLocale()]);
  const planName = (id: string) => {
    const plan = plans.find((p) => p.id === id);
    return plan ? localize(plan.name, locale) : id;
  };

  return (
    <section className="mt-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm md:p-space-lg">
      <h2 className="mb-space-sm font-label-md text-label-md tracking-wider text-clay uppercase">{t("title")}</h2>
      <ul className="divide-y divide-outline-variant/30">
        {payments.map((payment) => (
          <li key={payment.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
            <div className="min-w-0">
              <p className="font-label-lg text-label-lg text-on-surface">{planName(payment.planId)}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {format.dateTime(payment.createdAt, { dateStyle: "medium" })} · {t(`kind.${payment.kind}`)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-label-sm text-label-sm",
                  payment.status === "paid" ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container-high text-on-surface-variant",
                )}
              >
                {t(`status.${payment.status}`)}
              </span>
              <span className="font-label-lg text-label-lg text-on-surface tabular-nums">{paymentMoney(format, payment, payment.amount, locale)}</span>
              <Link
                href={`/profile/receipts/${payment.id}`}
                className="inline-flex items-center gap-1 font-label-md text-label-md text-primary underline-offset-4 hover:underline"
              >
                <ReceiptTextIcon aria-hidden className="size-4" />
                {t("receipt")}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
