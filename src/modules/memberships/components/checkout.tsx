"use client";

import {
  BookOpenIcon,
  CalendarCheckIcon,
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  FlaskConicalIcon,
  Flower2Icon,
  InfinityIcon,
  LoaderCircleIcon,
  LockIcon,
  LockOpenIcon,
  MailIcon,
  RadioIcon,
  XCircleIcon,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import type { BillingPlan } from "@/infrastructure/payment";
import { cn } from "@/lib/utils";

import { startCheckout } from "../actions";

type Prices = { annual: string; annualPerMonth: string; monthly: string; zero: string };

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
  initialPlan,
  next,
  prices,
  trialDays,
  signedIn,
  testMode,
  instructorName,
}: {
  initialPlan: BillingPlan;
  next: string;
  prices: Prices;
  trialDays: number;
  signedIn: boolean;
  testMode: boolean;
  instructorName: string;
}) {
  const t = useTranslations("Membership");
  const [plan, setPlan] = useState<BillingPlan>(initialPlan);

  const planCard = (id: BillingPlan) => {
    const active = plan === id;
    return (
      <label
        className={cn(
          "relative block cursor-pointer rounded-2xl p-6 transition-all duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
          active ? "bg-surface-container-lowest shadow-ambient ring-1 ring-primary" : "bg-surface-container-low hover:bg-surface-container",
        )}
      >
        <input type="radio" name="plan" value={id} checked={active} onChange={() => setPlan(id)} className="sr-only" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-headline-sm text-headline-sm text-on-surface">{t(`plans.${id}.name`)}</span>
              {id === "annual" && (
                <span className="rounded bg-secondary-fixed px-2 py-0.5 font-label-sm text-label-sm font-semibold text-on-secondary-fixed">
                  {t("plans.annual.badge")}
                </span>
              )}
            </div>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{t(`plans.${id}.body`)}</p>
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
          <span className="font-headline-md text-headline-md text-primary">{id === "annual" ? prices.annualPerMonth : prices.monthly}</span>
          <span className="font-body-sm text-body-sm text-outline">{t("perMonth")}</span>
          <span className="w-full font-body-sm text-body-sm text-on-surface-variant">
            {t(`plans.${id}.billing`, { price: prices.annual, days: trialDays })}
          </span>
        </div>
        {id === "annual" && (
          <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { icon: Flower2Icon, text: t("features.f1") },
              { icon: DownloadIcon, text: t("features.f2") },
              { icon: RadioIcon, text: t("features.f3") },
              { icon: BookOpenIcon, text: t("features.f4") },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
                <Icon className="size-4 shrink-0 text-clay" />
                {text}
              </li>
            ))}
          </ul>
        )}
      </label>
    );
  };

  const renewPrice = plan === "annual" ? prices.annual : prices.monthly;
  const timeline = [
    { day: 0, icon: CalendarCheckIcon, title: t("timeline.arrivalTitle"), body: t("timeline.arrivalBody", { zero: prices.zero }) },
    { day: trialDays - 2, icon: MailIcon, title: t("timeline.noticeTitle"), body: t("timeline.noticeBody") },
    {
      day: trialDays,
      icon: InfinityIcon,
      title: t("timeline.renewTitle"),
      body: plan === "annual" ? t("timeline.renewAnnual", { price: renewPrice }) : t("timeline.renewMonthly", { price: renewPrice }),
    },
  ];

  return (
    <form action={startCheckout} className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      <input type="hidden" name="next" value={next} />

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
          {planCard("annual")}
          {planCard("monthly")}
        </fieldset>

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
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">{t("checkout.trialLine", { days: trialDays })}</dt>
              <dd className="text-on-surface">{prices.zero}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">
                {plan === "annual" ? t("checkout.renewsAnnual", { days: trialDays }) : t("checkout.renewsMonthly", { days: trialDays })}
              </dt>
              <dd className="text-on-surface">
                {renewPrice}
                {plan === "annual" ? t("checkout.perYear") : t("checkout.perMonth")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">{t("checkout.taxes")}</dt>
              <dd className="text-on-surface">{prices.zero}</dd>
            </div>
            <div className="flex items-end justify-between gap-4 border-t border-hairline pt-3">
              <dt>
                <span className="block font-label-lg text-label-lg text-on-surface">{t("checkout.dueNow")}</span>
                <span className="font-label-sm text-label-sm text-outline">{t("checkout.firstCharge", { days: trialDays })}</span>
              </dt>
              <dd className="font-headline-md text-headline-md text-primary">{prices.zero}</dd>
            </div>
          </dl>

          <SubmitButton label={signedIn ? t("checkout.cta", { days: trialDays }) : t("checkout.ctaGuest")} />
          {!signedIn && <p className="text-center font-body-sm text-body-sm text-on-surface-variant">{t("checkout.guestNote")}</p>}

          <div className="flex flex-wrap items-center justify-center gap-3 font-label-sm text-label-sm text-outline">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="size-3.5" />
              {t("checkout.instant")}
            </span>
            <span aria-hidden>•</span>
            <span className="inline-flex items-center gap-1">
              <XCircleIcon className="size-3.5" />
              {t("checkout.cancelAnytime")}
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
