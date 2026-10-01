import { CircleDollarSignIcon, HeartHandshakeIcon, TimerResetIcon, UserRoundIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { MemberDirectory } from "@/modules/instructor/components/member-directory";
import { MemberDossierPanel } from "@/modules/instructor/components/member-dossier";
import { StatCard } from "@/modules/instructor/components/stat-card";
import { StudioFilterPills } from "@/modules/instructor/components/studio-filter-pills";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { StudioSearch } from "@/modules/instructor/components/studio-search";
import { getMemberDossier } from "@/modules/instructor/server/members";
import { getMembershipCounts, listMembers, projectRevenue, type MemberRow } from "@/modules/instructor/server/studio";
import { requireInstructor } from "@/modules/memberships/server/viewer";

const views = ["all", "paying", "trial", "attention", "lapsed", "instructors"] as const;
type View = (typeof views)[number];

const matches = (view: View) => (m: MemberRow) => {
  const grantsAccess = (m.status === "active" || m.status === "trialing") && !!m.currentPeriodEnd && m.currentPeriodEnd > new Date();
  switch (view) {
    case "paying":
      return m.status === "active" && grantsAccess;
    case "trial":
      return m.status === "trialing" && grantsAccess;
    case "attention":
      return m.status === "past_due" || (grantsAccess && m.cancelAtPeriodEnd === true);
    case "lapsed":
      return !!m.status && !grantsAccess;
    case "instructors":
      return m.role === "instructor";
    default:
      return true;
  }
};

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/members">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.members" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Stitch: studio-admin-members-access — directory on the start side, dossier on the end side.
export default async function StudioMembersPage({ params, searchParams }: PageProps<"/[locale]/instructor/members">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await requireInstructor(locale, "/instructor/members");
  const query = await searchParams;
  const one = (key: string) => (Array.isArray(query[key]) ? query[key][0] : query[key]);
  const q = one("q")?.slice(0, 100);
  const rawView = one("view");
  const view: View = views.includes(rawView as View) ? (rawView as View) : "all";
  const selectedId = one("member");

  const [t, format, members, counts] = await Promise.all([
    getTranslations("Studio.members"),
    getFormatter(),
    listMembers(q),
    getMembershipCounts(),
  ]);

  const shown = members.filter(matches(view));
  // A member reached by URL who is filtered out still opens; the panel is about that person.
  const dossier = selectedId ? await getMemberDossier(locale, selectedId) : null;
  const revenue = projectRevenue(counts);
  const paying = counts.monthly + counts.annual;
  const keep = { ...(q ? { q } : {}), ...(selectedId ? { member: selectedId } : {}) };

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioPageHeader eyebrow={t("eyebrow")} title={t("title")} lede={t("lede", { total: members.length, paying })} />

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("stats.accounts")} value={format.number(members.length)} note={t("stats.accountsNote")} icon={UsersIcon} />
        <StatCard
          label={t("stats.paying")}
          value={format.number(paying)}
          note={t("stats.split", { monthly: counts.monthly, annual: counts.annual })}
          icon={CircleDollarSignIcon}
        />
        <StatCard label={t("stats.trialing")} value={format.number(counts.trialing)} note={t("stats.trialingNote")} icon={HeartHandshakeIcon} />
        <StatCard
          label={t("stats.attention")}
          value={format.number(counts.pastDue + counts.canceling)}
          note={t("stats.attentionNote", { pastDue: counts.pastDue, leaving: counts.canceling })}
          hint={format.number(revenue.mrr, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
          icon={TimerResetIcon}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
        <div className="flex flex-col gap-space-md xl:col-span-8">
          <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <StudioSearch basePath="/instructor/members" value={q} placeholder={t("searchPlaceholder")} keep={selectedId ? { member: selectedId } : undefined} />
            <StudioFilterPills
              basePath="/instructor/members"
              param="view"
              active={view}
              keep={keep}
              options={views.map((v) => ({ value: v, label: t(`views.${v}`), count: members.filter(matches(v)).length }))}
            />
          </div>

          {shown.length === 0 ? (
            <Empty className="rounded-xl bg-surface-container-low">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserRoundIcon />
                </EmptyMedia>
                <EmptyTitle className="font-headline-sm text-headline-sm">{t("emptyTitle")}</EmptyTitle>
                <EmptyDescription>{q ? t("emptySearch", { q }) : t("emptyBody")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <MemberDirectory members={shown} selected={dossier?.account.id ?? null} />
              <Badge variant="outline" className="self-start">
                {t("showing", { shown: shown.length, total: members.length })}
              </Badge>
            </>
          )}
        </div>

        {/* Selecting someone on a phone should not mean scrolling past the whole directory. */}
        <div className={cn("xl:col-span-4 xl:order-none", dossier && "order-first")}>
          {dossier ? (
            <MemberDossierPanel dossier={dossier} isSelf={dossier.account.id === viewer.user.id} />
          ) : (
            <Empty className="rounded-xl bg-surface-container-low">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserRoundIcon />
                </EmptyMedia>
                <EmptyTitle className="font-headline-sm text-headline-sm">{t("dossier.pickTitle")}</EmptyTitle>
                <EmptyDescription>{t("dossier.pickBody")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}
