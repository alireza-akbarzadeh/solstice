import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BellRingIcon,
  ClockIcon,
  Flower2Icon,
  MailIcon,
  MessageCircleIcon,
  UserPlusIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StudioCrumb } from "@/components/layout/studio-breadcrumb";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { getCategoryName } from "@/modules/categories/server/names";
import { ColumnChart, PracticeHeatmap, type ColumnPoint } from "@/modules/instructor/components/insight-charts";
import { StudioFilterPills } from "@/modules/instructor/components/studio-filter-pills";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { getStudioInsights, insightRanges, type InsightRange, type Totals } from "@/modules/instructor/server/insights";
import { requireInstructor } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/insights">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.insights" });
  return { title: t("metaTitle"), robots: { index: false } };
}

const card = "rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg";

function SectionTitle({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return (
    <div className="mb-space-md">
      <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{eyebrow}</span>
      <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
      {note && <p className="font-body-sm text-body-sm text-on-surface-variant">{note}</p>}
    </div>
  );
}

// No Stitch screen. How the studio is doing over a chosen period: growth, practice, content,
// programs and the members worth a personal message. Every number comes from real rows.
export default async function StudioInsightsPage({ params, searchParams }: PageProps<"/[locale]/instructor/insights">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/insights");
  const query = await searchParams;
  const raw = Number(Array.isArray(query.weeks) ? query.weeks[0] : query.weeks);
  const weeks: InsightRange = insightRanges.includes(raw as InsightRange) ? (raw as InsightRange) : insightRanges[0];

  const [t, format, categoryName, data] = await Promise.all([
    getTranslations("Studio.insights"),
    getFormatter(),
    getCategoryName("practice"),
    getStudioInsights(weeks),
  ]);
  const n = (value: number) => format.number(value);
  const week = (iso: string) => format.dateTime(new Date(iso), { month: "short", day: "numeric", timeZone: "UTC" });
  const date = (value: Date | string) => format.dateTime(new Date(value), { dateStyle: "medium" });

  const kpis: { key: keyof Totals; icon: LucideIcon }[] = [
    { key: "signups", icon: UserPlusIcon },
    { key: "active", icon: UsersIcon },
    { key: "sessions", icon: Flower2Icon },
    { key: "minutes", icon: ClockIcon },
    { key: "reflections", icon: MessageCircleIcon },
    { key: "subscribers", icon: MailIcon },
  ];
  const change = (key: keyof Totals) => {
    const now = data.current[key];
    const before = data.before[key];
    if (before === 0) return now > 0 ? { text: t("change.new"), up: true } : null;
    const pct = Math.round(((now - before) / before) * 100);
    if (pct === 0) return { text: t("change.same"), up: null };
    return { text: t("change.percent", { value: Math.abs(pct) }), up: pct > 0 };
  };

  const sessions: ColumnPoint[] = data.series.map((p) => ({
    label: week(p.week),
    value: p.sessions,
    display: t("units.sessions", { count: p.sessions }),
    detail: t("units.minutes", { count: p.minutes }),
  }));
  const signups: ColumnPoint[] = data.series.map((p) => ({ label: week(p.week), value: p.signups, display: t("units.accounts", { count: p.signups }) }));
  const active: ColumnPoint[] = data.series.map((p) => ({ label: week(p.week), value: p.active, display: t("units.members", { count: p.active }) }));

  const topMax = Math.max(1, ...data.topPractices.map((p) => p.sessions));
  const categoryMax = Math.max(1, ...data.categories.map((c) => c.minutes));
  const { membership, quiet } = data;

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioCrumb items={[]} />
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede", { weeks })}
        actions={
          <StudioFilterPills
            basePath="/instructor/insights"
            param="weeks"
            active={String(weeks)}
            options={insightRanges.map((w) => ({ value: String(w), label: t("range", { weeks: w }) }))}
          />
        }
      />

      {/* KPI row: this period, and its change against the period before */}
      <section aria-label={t("kpiLabel")} className="grid grid-cols-2 gap-gutter md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ key, icon: Icon }) => {
          const delta = change(key);
          return (
            <div key={key} className="flex flex-col justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="font-label-sm text-label-sm tracking-wider text-clay uppercase">{t(`kpi.${key}`)}</span>
                <Icon aria-hidden className="size-4 shrink-0 text-primary-container" />
              </div>
              <div>
                <p className="font-headline-md text-headline-md text-on-surface">{n(data.current[key])}</p>
                <p className="mt-1 flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                  {delta?.up === true && <ArrowUpRightIcon aria-hidden className="size-3.5 text-primary" />}
                  {delta?.up === false && <ArrowDownRightIcon aria-hidden className="size-3.5 text-tertiary" />}
                  <span>{delta ? t("change.vs", { change: delta.text, weeks }) : t("change.none")}</span>
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Practice — the main chart */}
      <div className="grid grid-cols-1 gap-gutter xl:grid-cols-3">
        <section className={cn(card, "xl:col-span-2")}>
          <SectionTitle eyebrow={t("sessions.eyebrow")} title={t("sessions.title")} note={t("sessions.note")} />
          <ColumnChart points={sessions} label={t("sessions.title")} maxLabels={7} />
        </section>
        <section className={card}>
          <SectionTitle eyebrow={t("membership.eyebrow")} title={t("membership.title")} />
          <dl className="grid grid-cols-2 gap-3">
            {(
              [
                ["paying", membership.paying],
                ["trialing", membership.trialing],
                ["canceling", membership.canceling],
                ["pastDue", membership.pastDue],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-surface p-space-sm">
                <dt className="font-label-sm text-label-sm text-on-surface-variant">{t(`membership.${key}`)}</dt>
                <dd className="font-headline-sm text-headline-sm text-on-surface">{n(value)}</dd>
              </div>
            ))}
          </dl>
          {membership.trialsEnding > 0 && (
            <p className="mt-space-sm flex items-start gap-2 rounded-lg bg-secondary-container/60 p-space-sm font-body-sm text-body-sm text-on-surface">
              <BellRingIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-clay" />
              {t("membership.trialsEnding", { count: membership.trialsEnding })}
            </p>
          )}
          <Link href="/instructor/revenue" className="mt-space-sm inline-block font-label-md text-label-md text-primary underline-offset-4 hover:underline">
            {t("membership.revenue")}
          </Link>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <section className={card}>
          <SectionTitle eyebrow={t("signups.eyebrow")} title={t("signups.title")} />
          <ColumnChart points={signups} label={t("signups.title")} />
        </section>
        <section className={card}>
          <SectionTitle eyebrow={t("active.eyebrow")} title={t("active.title")} note={t("active.note")} />
          <ColumnChart points={active} label={t("active.title")} />
        </section>
      </div>

      {/* When members practise */}
      <section className={card}>
        <SectionTitle eyebrow={t("heatmap.eyebrow")} title={t("heatmap.title")} note={t("heatmap.note")} />
        {data.current.sessions === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("empty")}</p>
        ) : (
          <PracticeHeatmap slots={data.heat} weekStartsOn={locale === "fa" ? 6 : 1} />
        )}
      </section>

      <div className="grid grid-cols-1 gap-gutter xl:grid-cols-5">
        {/* Top practices */}
        <section className={cn(card, "xl:col-span-3")}>
          <SectionTitle eyebrow={t("top.eyebrow")} title={t("top.title")} />
          {data.topPractices.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-start">
                <thead>
                  <tr className="border-b border-outline-variant/40 font-label-sm text-label-sm text-on-surface-variant">
                    <th scope="col" className="py-2 pe-3 text-start font-normal">{t("top.practice")}</th>
                    <th scope="col" className="w-2/5 py-2 pe-3 text-start font-normal">{t("top.sessions")}</th>
                    <th scope="col" className="py-2 pe-3 text-end font-normal">{t("top.members")}</th>
                    <th scope="col" className="py-2 pe-3 text-end font-normal">{t("top.minutes")}</th>
                    <th scope="col" className="py-2 text-end font-normal">{t("top.saves")}</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm tabular-nums">
                  {data.topPractices.map((p) => (
                    <tr key={p.slug} className="border-b border-outline-variant/20 last:border-0">
                      <td className="py-2.5 pe-3">
                        <Link href={`/instructor/videos?edit=${encodeURIComponent(p.slug)}`} className="text-on-surface hover:text-primary hover:underline">
                          {p.title ? localize(p.title, locale) : p.slug}
                        </Link>
                      </td>
                      <td className="py-2.5 pe-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 rounded-e bg-primary-container" style={{ width: `${(p.sessions / topMax) * 100}%` }} />
                          <span className="shrink-0 text-on-surface">{n(p.sessions)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pe-3 text-end text-on-surface-variant">{n(p.members)}</td>
                      <td className="py-2.5 pe-3 text-end text-on-surface-variant">{n(p.minutes)}</td>
                      <td className="py-2.5 text-end text-on-surface-variant">{n(p.saves)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Minutes by category */}
        <section className={cn(card, "xl:col-span-2")}>
          <SectionTitle eyebrow={t("categories.eyebrow")} title={t("categories.title")} />
          {data.categories.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t("empty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.categories.map((c) => (
                <li key={c.category}>
                  <div className="mb-1 flex justify-between gap-2 font-body-sm text-body-sm">
                    <span className="text-on-surface">{categoryName(c.category)}</span>
                    <span className="text-on-surface-variant tabular-nums">{t("units.minutes", { count: c.minutes })}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container">
                    <div className="h-full rounded-full bg-primary-container" style={{ width: `${Math.max(2, (c.minutes / categoryMax) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Programs */}
      <section className={card}>
        <SectionTitle eyebrow={t("programs.eyebrow")} title={t("programs.title")} note={t("programs.note")} />
        {data.programs.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("empty")}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            {data.programs.map((p) => {
              const steps = [
                ["enrolled", p.enrolled],
                ["started", p.started],
                ["halfway", p.halfway],
                ["finished", p.finished],
              ] as const;
              const top = Math.max(1, p.enrolled);
              return (
                <li key={p.slug} className="rounded-lg bg-surface p-space-md">
                  <div className="mb-space-sm flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/instructor/programs?edit=${encodeURIComponent(p.slug)}`} className="font-label-lg text-label-lg text-on-surface hover:text-primary hover:underline">
                      {localize(p.title, locale) || p.slug}
                    </Link>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {t("programs.joined", { count: p.joined, weeks })} · {t("programs.days", { count: p.totalDays })}
                    </span>
                  </div>
                  <ol className="flex flex-col gap-1.5">
                    {steps.map(([key, value]) => (
                      <li key={key} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2 font-body-sm text-body-sm">
                        <span className="text-on-surface-variant">{t(`programs.${key}`)}</span>
                        <span className="h-2 rounded-full bg-surface-container">
                          <span className="block h-full rounded-full bg-primary-container" style={{ width: `${value ? Math.max(2, (value / top) * 100) : 0}%` }} />
                        </span>
                        <span className="w-8 text-end text-on-surface tabular-nums">{n(value)}</span>
                      </li>
                    ))}
                  </ol>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Members to check in with */}
      <section className={card}>
        <SectionTitle
          eyebrow={t("quiet.eyebrow")}
          title={t("quiet.title")}
          note={quiet.total >= 50 ? t("quiet.noteMany") : t("quiet.note", { count: quiet.total })}
        />
        {quiet.members.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("quiet.none")}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quiet.members.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/instructor/members?member=${encodeURIComponent(m.id)}`}
                  className="flex h-full flex-col gap-1 rounded-lg bg-surface p-space-sm transition-colors hover:bg-surface-container"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-label-lg text-label-lg text-on-surface">{m.name}</span>
                    <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                      {t(m.status === "trialing" ? "quiet.trial" : "quiet.member")}
                    </span>
                  </span>
                  <span className="truncate font-body-sm text-body-sm text-on-surface-variant" dir="ltr">
                    {m.email}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {m.lastPracticeAt ? t("quiet.last", { date: date(m.lastPracticeAt) }) : t("quiet.never", { date: date(m.joinedAt) })}
                    {m.status === "trialing" && m.trialEndsAt && <> · {t("quiet.trialEnds", { date: date(m.trialEndsAt) })}</>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
