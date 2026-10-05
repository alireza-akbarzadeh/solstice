"use client";

import {
  CalendarCheckIcon,
  CheckIcon,
  CreditCardIcon,
  CircleCheckIcon,
  ClockIcon,
  FlaskConicalIcon,
  InfinityIcon,
  LoaderCircleIcon,
  LockIcon,
  LockOpenIcon,
  MailIcon,
  MessageCircleHeartIcon,
  XCircleIcon,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

import { startCheckout } from "../actions";

/** A plan as the checkout shows it, with every price already formatted on the server. */
export type CheckoutPlan = {
  id: string;
  name: string;
  description: string;
  badge: string;
  features: string[];
  /** Price per billing period, e.g. "$220". */
  price: string;
  /** The period after the price, e.g. "/ year". */
  per: string;
  /** Monthly equivalent for periods longer than a month, e.g. "$18.33 / month". */
  perMonth: string | null;
  /** "Billed yearly after a 14-day free trial". */
  billing: string;
  trialDays: number;
  /** Plans with 1:1 guidance: places left, and whether every place is taken (then it can't be chosen). */
  guidance?: { note: string; full: boolean };
};

/** One way to pay (a gateway), with the plans it can sell priced in its currency. */
export type CheckoutMethod = {
  gateway: string;
  cards: "iranian" | "international";
  /** Zero in this method's currency, for "due today". */
  zero: string;
  /** The plan preselected when switching to this method. */
  featured: string | null;
  plans: CheckoutPlan[];
  testMode: boolean;
  /** Renews by itself (Stripe); otherwise the member pays each period by hand (Zarinpal). */
  recurring: boolean;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-label-lg text-label-lg text-on-primary shadow-md transition-colors hover:bg-primary-container disabled:opacity-80"
    >
      {pending ? <LoaderCircleIcon className="size-4 animate-spin" /> : <LockOpenIcon className="size-4" />}
      {label}
    </button>
  );
}

export function Checkout({
  methods,
  initialMethod,
  initialPlan,
  suggestedFromIran,
  next,
  signedIn,
  instructorName,
}: {
  /** Never empty; the first is the one preselected for the visitor's country. */
  methods: CheckoutMethod[];
  initialMethod: string;
  initialPlan: string;
  /** The method was preselected because the visitor seems to be in Iran. */
  suggestedFromIran: boolean;
  next: string;
  signedIn: boolean;
  instructorName: string;
}) {
  const t = useTranslations("Membership");
  const [methodId, setMethodId] = useState(initialMethod);
  const [planId, setPlanId] = useState(initialPlan);
  const method = methods.find((m) => m.gateway === methodId) ?? methods[0]!;
  const { plans, zero, testMode, recurring } = method;
  // Switching method keeps the plan when the new method sells it.
  const open = (p: CheckoutPlan) => !p.guidance?.full;
  const selected =
    plans.find((p) => p.id === planId && open(p)) ?? plans.find((p) => p.id === method.featured && open(p)) ?? plans.find(open) ?? plans[0]!;
  const trialDays = selected.trialDays;
  const hasTrial = trialDays > 0;

  const planCard = (plan: CheckoutPlan) => {
    const full = !!plan.guidance?.full;
    const active = selected.id === plan.id && !full;
    return (
      <label
        key={plan.id}
        className={cn(
          "relative block rounded-2xl p-6 transition-all duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
          full ? "cursor-not-allowed bg-surface-container-low opacity-70" : "cursor-pointer",
          active ? "bg-surface-container-lowest shadow-ambient ring-1 ring-primary" : !full && "bg-surface-container-low hover:bg-surface-container",
        )}
      >
        <input type="radio" name="plan" value={plan.id} checked={active} disabled={full} onChange={() => setPlanId(plan.id)} className="sr-only" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-headline-sm text-headline-sm text-on-surface">{plan.name}</span>
              {plan.badge && (
                <span className="rounded bg-secondary-fixed px-2 py-0.5 font-label-sm text-label-sm font-semibold text-on-secondary-fixed">
                  {plan.badge}
                </span>
              )}
            </div>
            {plan.description && <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{plan.description}</p>}
          </div>
          <span
            aria-hidden
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
              active ? "bg-primary text-on-primary" : "bg-surface-container-highest text-transparent",
            )}
          >
            <CheckIcon className="size-3.5" />
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-headline-md text-headline-md text-primary">{plan.price}</span>
          <span className="font-body-sm text-body-sm text-outline">{plan.per}</span>
          {plan.perMonth && <span className="font-body-sm text-body-sm text-on-surface-variant">· {plan.perMonth}</span>}
          <span className="w-full font-body-sm text-body-sm text-on-surface-variant">{plan.billing}</span>
        </div>
        {plan.guidance && (
          <p
            className={cn(
              "mt-4 flex items-center gap-2 font-label-md text-label-md",
              full ? "text-on-surface-variant" : "text-primary",
            )}
          >
            <MessageCircleHeartIcon className="size-4 shrink-0" />
            {plan.guidance.note}
          </p>
        )}
        {plan.features.length > 0 && (
          <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {plan.features.map((text, index) => (
              <li key={index} className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
                <CircleCheckIcon className="size-4 shrink-0 text-clay" />
                {text}
              </li>
            ))}
          </ul>
        )}
      </label>
    );
  };

  // A reminder only makes sense when the trial is long enough to send one before it ends.
  const timeline = [
    { day: 0, icon: CalendarCheckIcon, title: t("timeline.arrivalTitle"), body: t("timeline.arrivalBody", { zero }) },
    ...(trialDays > 2
      ? [{ day: trialDays - 2, icon: MailIcon, title: t("timeline.noticeTitle"), body: recurring ? t("timeline.noticeBody") : t("timeline.noticeBodyByHand") }]
      : []),
    {
      day: trialDays,
      icon: InfinityIcon,
      title: t("timeline.renewTitle"),
      body: recurring ? t("timeline.renew", { price: selected.price, per: selected.per }) : t("timeline.renewByHand", { price: selected.price, per: selected.per }),
    },
  ];

  return (
    <form action={startCheckout} className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="method" value={method.gateway} />

      <div className="flex flex-col gap-space-lg lg:col-span-7">
        <div>
          <p className="mb-2 font-label-md text-label-md tracking-widest text-clay uppercase">{t("eyebrow")}</p>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
            {t("title")}
          </h1>
          <p className="mt-3 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">{t("lede")}</p>
        </div>

        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">{t("title")}</legend>
          {plans.map(planCard)}
        </fieldset>

        {hasTrial && (
          <section className="rounded-2xl bg-surface-container-low p-6">
            <p className="font-label-md text-label-md tracking-widest text-clay uppercase">{t("timeline.eyebrow")}</p>
            <h2 className="mt-1 font-headline-sm text-headline-sm text-on-surface">{t("timeline.title", { days: trialDays })}</h2>
            <ol className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {timeline.map(({ day, icon: Icon, title, body }) => (
                <li key={day} className="flex gap-3 sm:flex-col">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <span className="font-label-sm text-label-sm tracking-wider text-clay uppercase">{t("timeline.day", { day })}</span>
                    <p className="font-label-lg text-label-lg text-on-surface">{title}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <figure className="flex flex-col gap-4 rounded-2xl bg-surface-container p-6 sm:flex-row sm:items-start">
          <Image src="/images/brand/elena-closeup.jpg" alt="" width={64} height={64} className="size-16 shrink-0 rounded-full object-cover" />
          <div>
            <span className="font-label-md text-label-md tracking-widest text-clay uppercase">{t("promise.label")}</span>
            <blockquote className="mt-2 font-body-md text-body-md text-on-surface-variant italic rtl:not-italic">{t("promise.quote")}</blockquote>
            <figcaption className="mt-2 font-label-md text-label-md text-on-surface">{instructorName}</figcaption>
          </div>
        </figure>
      </div>

      <div className="lg:col-span-5">
        <div className="flex flex-col gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-ambient lg:sticky lg:top-28">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm text-on-surface">{t("checkout.title")}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2.5 py-1 font-label-sm text-label-sm text-on-primary-fixed">
              <LockIcon className="size-3" />
              {t("checkout.secure")}
            </span>
          </div>

          {methods.length > 1 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 font-label-md text-label-md tracking-widest text-clay uppercase">{t("methods.title")}</legend>
              <div className="grid grid-cols-2 gap-2">
                {methods.map((m) => {
                  const active = m.gateway === method.gateway;
                  return (
                    <label
                      key={m.gateway}
                      className={cn(
                        "flex cursor-pointer flex-col gap-1 rounded-xl p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
                        active ? "bg-primary-fixed text-on-primary-fixed ring-1 ring-primary" : "bg-surface-container-low hover:bg-surface-container",
                      )}
                    >
                      <input
                        type="radio"
                        name="method-choice"
                        value={m.gateway}
                        checked={active}
                        onChange={() => setMethodId(m.gateway)}
                        className="sr-only"
                      />
                      <span className="flex items-center gap-2 font-label-lg text-label-lg">
                        <CreditCardIcon aria-hidden className="size-4 shrink-0" />
                        {t(`methods.${m.cards}.title`)}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{t(`methods.${m.cards}.body`)}</span>
                    </label>
                  );
                })}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {suggestedFromIran ? t("methods.suggestedIran") : t("methods.hint")}
              </p>
            </fieldset>
          )}

          {testMode && (
            <div role="note" className="flex gap-3 rounded-xl bg-secondary-fixed/50 p-4">
              <FlaskConicalIcon className="mt-0.5 size-5 shrink-0 text-on-secondary-fixed-variant" />
              <div>
                <p className="font-label-lg text-label-lg text-on-secondary-fixed">{t("checkout.testModeTitle")}</p>
                <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant">{t("checkout.testModeBody")}</p>
              </div>
            </div>
          )}

          <dl className="space-y-3 rounded-xl bg-surface-container-low p-4 font-body-sm text-body-sm">
            <dt className="font-label-md text-label-md tracking-widest text-clay uppercase">{t("checkout.ledger")}</dt>
            {hasTrial && (
              <div className="flex justify-between gap-4">
                <dt className="text-on-surface-variant">{t("checkout.trialLine", { days: trialDays })}</dt>
                <dd className="text-on-surface">{zero}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">
                {hasTrial ? (recurring ? t("checkout.renews", { days: trialDays }) : t("checkout.thenByHand", { days: trialDays })) : selected.name}
              </dt>
              <dd className="text-on-surface">
                {selected.price} {selected.per}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">{t("checkout.taxes")}</dt>
              <dd className="text-on-surface">{zero}</dd>
            </div>
            <div className="flex items-end justify-between gap-4 border-t border-hairline pt-3">
              <dt>
                <span className="block font-label-lg text-label-lg text-on-surface">{t("checkout.dueNow")}</span>
                <span className="font-label-sm text-label-sm text-outline">
                  {hasTrial ? (recurring ? t("checkout.firstCharge", { days: trialDays }) : t("checkout.noCardNeeded")) : t("checkout.firstChargeNow")}
                </span>
              </dt>
              <dd className="font-headline-md text-headline-md text-primary">{hasTrial ? zero : selected.price}</dd>
            </div>
          </dl>

          <SubmitButton
            label={
              !signedIn
                ? t("checkout.ctaGuest")
                : hasTrial
                  ? t("checkout.cta", { days: trialDays })
                  : t("checkout.ctaNow", { price: selected.price })
            }
          />
          {!signedIn && <p className="text-center font-body-sm text-body-sm text-on-surface-variant">{t("checkout.guestNote")}</p>}

          <div className="flex flex-wrap items-center justify-center gap-3 font-label-sm text-label-sm text-outline">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="size-3.5" />
              {t("checkout.instant")}
            </span>
            <span aria-hidden>•</span>
            <span className="inline-flex items-center gap-1">
              <XCircleIcon className="size-3.5" />
              {recurring ? t("checkout.cancelAnytime") : t("checkout.noAutoCharge")}
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
