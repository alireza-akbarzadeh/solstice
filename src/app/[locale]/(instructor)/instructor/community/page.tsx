import { EyeOffIcon, HourglassIcon, MessageSquareDashedIcon, MessagesSquareIcon, ReplyIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { routing } from "@/i18n/routing";
import { ReflectionsPanel } from "@/modules/community/components/reflections-panel";
import { reflectAccess } from "@/modules/community/server/access";
import {
  countPendingReflections,
  getCircleFeed,
  getPendingThreadIds,
  getRejectedThreadIds,
  getThreadsByIds,
} from "@/modules/community/server/reflections";
import { toReflectionViews } from "@/modules/community/server/views";
import { ApproveAllButton } from "@/modules/instructor/components/approve-all-button";
import { StatCard } from "@/modules/instructor/components/stat-card";
import { StudioFilterPills } from "@/modules/instructor/components/studio-filter-pills";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { getAwaitingReplyIds } from "@/modules/instructor/server/studio";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { PracticeStage } from "@/modules/practices/components/practice-stage";

// "review" (approve or reject members' reflections) comes first: nothing reaches the circle
// until it is approved.
const views = ["review", "awaiting", "all", "private", "pinned", "circle", "rejected"] as const;
type View = (typeof views)[number];

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/community">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.community" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen. Moderation reuses the member-facing ReflectionsPanel, so replying,
// pinning, removing and approving behave exactly as they do under a practice.
export default async function StudioCommunityPage({ params, searchParams }: PageProps<"/[locale]/instructor/community">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await requireInstructor(locale, "/instructor/community");
  const query = await searchParams;
  const rawView = Array.isArray(query.view) ? query.view[0] : query.view;
  const view: View = views.includes(rawView as View) ? (rawView as View) : "review";

  const reader = { id: viewer.user.id, isInstructor: true };
  const [t, format, awaitingIds, reviewIds, rejectedIds, pendingCount, feed] = await Promise.all([
    getTranslations("Studio.community"),
    getFormatter(),
    getAwaitingReplyIds(),
    getPendingThreadIds(),
    getRejectedThreadIds(),
    countPendingReflections(),
    getCircleFeed(reader, 80),
  ]);

  const byIds = { review: reviewIds, awaiting: awaitingIds, rejected: rejectedIds } as const;
  const listed = view === "review" || view === "awaiting" || view === "rejected" ? await getThreadsByIds(reader, byIds[view]) : [];
  const threads =
    view === "review" || view === "awaiting" || view === "rejected"
      ? listed
      : view === "private"
        ? feed.filter((r) => r.visibility === "private")
        : view === "pinned"
          ? feed.filter((r) => r.pinned)
          : view === "circle"
            ? feed.filter((r) => r.practiceSlug === null)
            : feed;

  const views_ = await toReflectionViews(threads, { locale, reader });
  const counts: Record<View, number> = {
    review: reviewIds.length,
    rejected: rejectedIds.length,
    awaiting: awaitingIds.length,
    all: feed.length,
    private: feed.filter((r) => r.visibility === "private").length,
    pinned: feed.filter((r) => r.pinned).length,
    circle: feed.filter((r) => r.practiceSlug === null).length,
  };
  const replies = feed.reduce((n, r) => n + r.replies.length, 0);

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede", { review: pendingCount, awaiting: counts.awaiting, total: counts.all })}
        actions={view === "review" && pendingCount > 0 ? <ApproveAllButton count={pendingCount} /> : undefined}
      />

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("stats.review")} value={format.number(pendingCount)} note={t("stats.reviewNote")} icon={HourglassIcon} />
        <StatCard label={t("stats.awaiting")} value={format.number(counts.awaiting)} note={t("stats.awaitingNote")} icon={ReplyIcon} />
        <StatCard label={t("stats.threads")} value={format.number(counts.all)} note={t("stats.threadsNote", { replies })} icon={MessagesSquareIcon} />
        <StatCard label={t("stats.private")} value={format.number(counts.private)} note={t("stats.privateNote")} icon={EyeOffIcon} />
      </div>

      <StudioFilterPills
        basePath="/instructor/community"
        param="view"
        active={view}
        options={views.map((v) => ({ value: v, label: t(`views.${v}`), count: counts[v] }))}
      />

      {views_.length === 0 ? (
        <Empty className="rounded-xl bg-surface-container-low">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareDashedIcon />
            </EmptyMedia>
            <EmptyTitle className="font-headline-sm text-headline-sm">{t(view === "review" ? "reviewClearTitle" : view === "awaiting" ? "clearTitle" : "emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t(view === "review" ? "reviewClearBody" : view === "awaiting" ? "clearBody" : "emptyBody")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        // No video here: the stage only tells the composer there is no moment to attach.
        <PracticeStage hasVideo={false}>
          <ReflectionsPanel
            variant="circle"
            practiceSlug={null}
            reflections={views_}
            total={views_.reduce((n, r) => n + 1 + r.replies.length, 0)}
            access={reflectAccess({ access: "members" }, viewer)}
            isInstructor
            signInHref="/sign-in"
            membershipHref="/membership"
          />
        </PracticeStage>
      )}
    </div>
  );
}
