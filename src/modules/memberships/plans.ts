import type { Localized } from "@/lib/localized";

// Membership plans are rows the instructor manages at /instructor/plans
// (solstice_membership_plan). This file holds what both server and client need: the shape,
// the currencies the studio offers, and price formatting.

/** One currency for the whole site; "IRT" is the Iranian toman, which Intl has no code for. */
export const currencies = ["USD", "EUR", "GBP", "IRT"] as const;
export type Currency = (typeof currencies)[number];
export const DEFAULT_CURRENCY: Currency = "USD";
export const isCurrency = (value: unknown): value is Currency =>
  currencies.includes(value as Currency);

/** Billing periods the studio offers, in months. */
export const billingIntervals = [1, 3, 6, 12] as const;

export type PlanStatus = "active" | "hidden";

export type MembershipPlan = {
  id: string;
  status: PlanStatus;
  featured: boolean;
  sortOrder: number;
  name: Localized;
  description: Localized;
  badge: Localized;
  features: Localized[];
  /** Price per billing period in the site currency. */
  price: number;
  /** Price per period in each currency it is sold in, the site currency included. */
  prices: PlanPrices;
  intervalMonths: number;
  trialDays: number;
  /** Members on this plan can ask the instructor 1:1 (/guidance). */
  guidance: boolean;
  /** Members the plan takes while guidance is on; 0 = no limit. */
  guidancePlaces: number;
};

export type PlanPrices = Partial<Record<Currency, number>>;

/** The plan's price in a currency, or null when it isn't sold in that currency. */
export const priceIn = (plan: Pick<MembershipPlan, "prices">, currency: Currency) =>
  plan.prices[currency] ?? null;

/** What a plan costs per month, used to compare plans and to project revenue. */
export const monthlyEquivalent = (
  plan: Pick<MembershipPlan, "price" | "intervalMonths">,
) => plan.price / plan.intervalMonths;

type NumberFormatter = {
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
};

/**
 * Formats an amount in the site currency. Whole amounts drop the decimals ($24, not $24.00);
 * tomans are always whole and written after the number, as Iranian shops do.
 */
export function formatMoney(
  format: NumberFormatter,
  amount: number,
  currency: Currency,
  locale: string,
) {
  if (currency === "IRT") {
    return `${format.number(Math.round(amount), { maximumFractionDigits: 0 })} ${locale === "fa" ? "تومان" : "Toman"}`;
  }
  const digits = Number.isInteger(Math.round(amount * 100) / 100) ? 0 : 2;
  return format.number(amount, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const DAY = 24 * 60 * 60 * 1000;

/** The end of one billing period from `from`, in calendar months. */
export function addBillingPeriod(from: Date, months: number) {
  const end = new Date(from);
  end.setUTCMonth(end.getUTCMonth() + months);
  return end;
}

export const addDays = (from: Date, days: number) =>
  new Date(from.getTime() + days * DAY);
