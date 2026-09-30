import { CircleCheckIcon, CreditCardIcon, Flower2Icon, HourglassIcon, SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { paymentProvider } from "@/infrastructure/payment";
import { cn } from "@/lib/utils";
import { cancelMembership, changePlan, resumeMembership } from "@/modules/memberships/actions";
import { billingPlans } from "@/modules/memberships/plans";
import { requireUser } from "@/modules/memberships/server/viewer";
import { getCompletions } from "@/modules/progress/server/completions";
import { DeleteAccount, PasswordForm, ProfileForm } from "@/modules/users/components/account-forms";
import { type PracticeRhythm, practiceRhythms } from "@/modules/users/types";
import { getSession } from "@/server/better-auth/server";

const tabs = ["membership", "details", "security", "privacy"] as const;
type Tab = (typeof tabs)[number];

export async function generateMetadata({ params }: PageProps<"/[locale]/profile">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Profile" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Stitch: member-sanctuary-account-rhythm-settings.html — the parts that are real today:
// membership, profile & rhythm, password, account deletion.
export default async function ProfilePage({ params, searchParams }: PageProps<"/[locale]/profile">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await requireUser(locale, "/profile");
  const query = await searchParams;
  const tab: Tab = tabs.includes(query.tab as Tab) ? (query.tab as Tab) : "membership";

  const [t, tMembership, tAuth, format, session, completions] = await Promise.all([
    getTranslations("Profile"),
    getTranslations("Membership"),
    getTranslations("Auth.signUp"),
    getFormatter(),
    getSession(),
    getCompletions(viewer.user.id),
  ]);
  const user = session!.user;
  const rhythm: PracticeRhythm = practiceRhythms.includes(user.practiceRhythm as PracticeRhythm) ? (user.practiceRhythm as PracticeRhythm) : "morning";
  const membership = viewer.membership;
  const money = (usd: number) => format.number(usd, { style: "currency", currency: "USD", maximumFractionDigits: usd % 1 ? 2 : 0 });
  const minutes = completions.reduce((sum, c) => sum + c.minutes, 0);

  const stats = [
    { icon: SparklesIcon, label: t("stats.sessions"), value: format.number(completions.length) },
    { icon: HourglassIcon, label: t("stats.hours"), value: format.number(minutes / 60, { maximumFractionDigits: 1 }) },
    { icon: Flower2Icon, label: t("stats.rhythm"), value: tAuth(`rhythms.${rhythm}.title`) },
  ];

  let statusLine = t("status.none");
  if (viewer.user.role === "instructor") statusLine = t("status.instructor");
  else if (membership) {
    const date = format.dateTime(membership.currentPeriodEnd, { dateStyle: "long" });
    if (!viewer.hasAccess) statusLine = membership.status === "past_due" ? t("status.pastDue") : t("status.ended", { date });
    else if (membership.cancelAtPeriodEnd) statusLine = t("status.canceling", { date });
    else if (membership.status === "trialing") statusLine = t("status.trial", { date });
    else statusLine = t("status.renews", { date });
  }

  return (
    <Container className="py-space-lg md:py-space-xl">
      <section className="mb-space-xl">
        <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-space-xs">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm tracking-wider text-primary uppercase">
              <span className={cn("size-1.5 rounded-full", viewer.hasAccess ? "bg-primary motion-safe:animate-pulse" : "bg-outline")} />
              {viewer.hasAccess ? t("active") : t("inactive")}
            </span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
              {t("title", { name: user.name.split(/\s+/)[0] ?? user.name })}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t("memberSince", { date: format.dateTime(user.createdAt, { month: "long", year: "numeric" }) })}
              <span className="mx-1.5 text-outline-variant">•</span>
              {statusLine}
            </p>
          </div>
        </div>
        <dl className="mt-space-md grid grid-cols-1 gap-gutter md:grid-cols-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
              <div className="flex flex-col-reverse gap-1">
                <dt className="font-label-md text-label-md tracking-wider text-outline uppercase">{label}</dt>
                <dd className="font-headline-md text-headline-md text-primary">{value}</dd>
              </div>
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-container text-clay">
                <Icon className="size-5" />
              </span>
            </div>
          ))}
        </dl>
      </section>

      <nav aria-label={t("tabsLabel")} className="mb-space-lg">
        <ul className="flex flex-wrap gap-2 rounded-xl bg-surface-container-low p-1.5">
          {tabs.map((id) => (
            <li key={id}>
              <Link
                href={id === "membership" ? "/profile" : `/profile?tab=${id}`}
                aria-current={tab === id ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-5 py-2.5 font-label-lg text-label-lg transition-colors",
                  tab === id ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-primary",
                )}
              >
                {t(`tabs.${id}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {tab === "membership" && (
        <section className="space-y-space-lg">
          {membership ? (
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
                <div className="space-y-space-md lg:col-span-7">
                  <span className="font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">
                    {t(membership.plan === "annual" ? "plan.billedYearly" : "plan.billedMonthly")}
                  </span>
                  <div>
                    <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">
                      {tMembership(`plans.${membership.plan}.name`)}
                    </h2>
                    <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                      {membership.plan === "annual"
                        ? t("plan.priceAnnual", { perMonth: money(billingPlans.annual.monthlyEquivalentUsd), total: money(billingPlans.annual.priceUsd) })
                        : t("plan.priceMonthly", { price: money(billingPlans.monthly.priceUsd) })}
                    </p>
                  </div>
                  <ul className="grid grid-cols-1 gap-x-4 gap-y-2 pt-2 sm:grid-cols-2">
                    {(["f1", "f2", "f3", "f4"] as const).map((key) => (
                      <li key={key} className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                        <CircleCheckIcon className="size-4 shrink-0 text-primary" />
                        {tMembership(`features.${key}`)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-space-md rounded-xl bg-surface-container-low p-space-md lg:col-span-5">
                  <span className="block font-label-md text-label-md tracking-wider text-clay uppercase">{t("ledger.title")}</span>
                  <dl className="space-y-3 font-body-sm text-body-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-on-surface-variant">{t("ledger.method")}</dt>
                      <dd className="flex items-center gap-1.5 font-medium text-primary">
                        <CreditCardIcon className="size-4" />
                        {paymentProvider.testMode ? t("ledger.testCard") : t("ledger.onFile")}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-on-surface-variant">{membership.cancelAtPeriodEnd ? t("ledger.accessUntil") : t("ledger.nextDate")}</dt>
                      <dd className="font-medium text-primary">{format.dateTime(membership.currentPeriodEnd, { dateStyle: "long" })}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-on-surface-variant">{t("ledger.amount")}</dt>
                      <dd className="font-medium text-primary">{membership.cancelAtPeriodEnd ? "—" : money(billingPlans[membership.plan].priceUsd)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-on-surface-variant">{t("ledger.receipts")}</dt>
                      <dd dir="ltr" className="truncate font-medium text-primary">
                        {user.email}
                      </dd>
                    </div>
                  </dl>
                  {!viewer.hasAccess ? (
                    <Link
                      href="/membership"
                      className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container"
                    >
                      {t("plan.renew")}
                    </Link>
                  ) : (
                    <form action={changePlan}>
                      <input type="hidden" name="plan" value={membership.plan === "annual" ? "monthly" : "annual"} />
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-surface-container-high px-4 py-2.5 font-label-lg text-label-lg text-primary transition-colors hover:bg-surface-container-highest"
                      >
                        {membership.plan === "annual"
                          ? t("plan.switchMonthly", { price: money(billingPlans.monthly.priceUsd) })
                          : t("plan.switchAnnual", { price: money(billingPlans.annual.priceUsd) })}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-space-sm rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <h2 className="font-headline-sm text-headline-sm text-primary">
                {viewer.user.role === "instructor" ? t("status.instructor") : t("plan.noneTitle")}
              </h2>
              {viewer.user.role !== "instructor" && (
                <>
                  <p className="font-body-md text-body-md text-on-surface-variant">{t("plan.noneBody")}</p>
                  <Link href="/membership" className="rounded-lg bg-primary px-5 py-2.5 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container">
                    {t("plan.join")}
                  </Link>
                </>
              )}
            </div>
          )}

          {membership && viewer.hasAccess && (
            <div className="flex flex-col justify-between gap-3 px-2 pt-space-sm sm:flex-row sm:items-center">
              <p className="font-body-sm text-body-sm text-outline">{membership.cancelAtPeriodEnd ? t("plan.resumeNote") : t("plan.cancelNote")}</p>
              <form action={membership.cancelAtPeriodEnd ? resumeMembership : cancelMembership}>
                <input type="hidden" name="back" value="/profile" />
                <button
                  type="submit"
                  className={cn(
                    "font-label-sm text-label-sm tracking-wider uppercase underline-offset-4 hover:underline",
                    membership.cancelAtPeriodEnd ? "text-primary" : "text-on-surface-variant hover:text-tertiary",
                  )}
                >
                  {membership.cancelAtPeriodEnd ? t("plan.resume") : t("plan.cancel")}
                </button>
              </form>
            </div>
          )}
        </section>
      )}

      {tab === "details" && (
        <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
          <h2 className="mb-space-md font-headline-sm text-headline-sm text-primary">{t("details.title")}</h2>
          <ProfileForm initial={{ name: user.name, email: user.email, practiceRhythm: rhythm, marketingOptIn: !!user.marketingOptIn }} />
        </section>
      )}

      {tab === "security" && (
        <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
          <h2 className="mb-1 font-headline-sm text-headline-sm text-primary">{t("security.title")}</h2>
          <p className="mb-space-md font-body-sm text-body-sm text-on-surface-variant">{t("security.body")}</p>
          <PasswordForm />
        </section>
      )}

      {tab === "privacy" && (
        <section className="space-y-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
          <div>
            <h2 className="mb-1 font-headline-sm text-headline-sm text-primary">{t("privacy.title")}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{t("privacy.body")}</p>
          </div>
          <DeleteAccount />
        </section>
      )}
    </Container>
  );
}
