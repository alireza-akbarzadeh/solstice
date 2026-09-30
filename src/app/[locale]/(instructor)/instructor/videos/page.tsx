import { CircleCheckIcon, FilmIcon, Flower2Icon, LockIcon, PencilOffIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { routing } from "@/i18n/routing";
import { PracticeEditor } from "@/modules/instructor/components/practice-editor";
import { PracticeInventory } from "@/modules/instructor/components/practice-inventory";
import { StatCard } from "@/modules/instructor/components/stat-card";
import { StudioFilterPills } from "@/modules/instructor/components/studio-filter-pills";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { getContentInventory, getLibrarySummary, getPracticeRow } from "@/modules/instructor/server/content";
import { requireInstructor } from "@/modules/memberships/server/viewer";

const views = ["all", "published", "draft", "members", "needsVideo"] as const;
type View = (typeof views)[number];

const matches = (view: View) => (item: Awaited<ReturnType<typeof getContentInventory>>[number]) => {
  if (view === "published" || view === "draft") return item.status === view;
  if (view === "members") return item.access === "members";
  if (view === "needsVideo") return !item.videoAssetId;
  return true;
};

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/videos">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.practices" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Stitch: studio-admin-content-video-publisher. The library lives in Postgres, so this edits
// real rows; only creating a practice from nothing is still the seed script's job.
export default async function StudioPracticesPage({ params, searchParams }: PageProps<"/[locale]/instructor/videos">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/videos");
  const query = await searchParams;
  const rawView = Array.isArray(query.view) ? query.view[0] : query.view;
  const view: View = views.includes(rawView as View) ? (rawView as View) : "all";
  const editSlug = Array.isArray(query.edit) ? query.edit[0] : query.edit;

  const [t, format, inventory, library, editRow] = await Promise.all([
    getTranslations("Studio.practices"),
    getFormatter(),
    getContentInventory(locale),
    getLibrarySummary(),
    editSlug ? getPracticeRow(editSlug) : Promise.resolve(null),
  ]);

  const shown = inventory.filter(matches(view));
  const counts: Record<View, number> = {
    all: inventory.length,
    published: inventory.filter(matches("published")).length,
    draft: inventory.filter(matches("draft")).length,
    members: inventory.filter(matches("members")).length,
    needsVideo: inventory.filter(matches("needsVideo")).length,
  };

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede", { total: library.total, minutes: library.minutes })}
      />

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("stats.published")} value={format.number(library.published)} note={t("stats.live")} icon={CircleCheckIcon} />
        <StatCard label={t("stats.drafts")} value={format.number(library.drafts)} note={t("stats.hidden")} icon={PencilOffIcon} />
        <StatCard label={t("stats.membersOnly")} value={format.number(library.membersOnly)} note={t("stats.gated")} icon={LockIcon} />
        <StatCard label={t("stats.missingVideo")} value={format.number(library.missingVideo)} note={t("stats.attachNeeded")} icon={FilmIcon} />
      </div>

      {editRow ? (
        <PracticeEditor
          practice={{
            slug: editRow.slug,
            title: editRow.title,
            summary: editRow.summary,
            series: editRow.series,
            category: editRow.category,
            intensityLevel: editRow.intensityLevel,
            intensityLabel: editRow.intensityLabel,
            props: editRow.props,
            durationMinutes: editRow.durationMinutes,
            access: editRow.access,
            previewSeconds: editRow.previewSeconds,
            videoAssetId: editRow.videoAssetId,
          }}
        />
      ) : (
        <Empty className="rounded-xl bg-surface-container-low">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Flower2Icon />
            </EmptyMedia>
            <EmptyTitle className="font-headline-sm text-headline-sm">{t("pick.title")}</EmptyTitle>
            <EmptyDescription>{t("pick.body")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <section className="flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("inventory")}</h2>
          <Badge variant="outline">{t("showing", { shown: shown.length, total: inventory.length })}</Badge>
        </div>

        <StudioFilterPills
          basePath="/instructor/videos"
          param="view"
          active={view}
          keep={editSlug ? { edit: editSlug } : undefined}
          options={views.map((v) => ({ value: v, label: t(`views.${v}`), count: counts[v] }))}
        />

        {shown.length === 0 ? (
          <Empty className="rounded-xl bg-surface-container-low">
            <EmptyHeader>
              <EmptyTitle className="font-headline-sm text-headline-sm">{t("emptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("emptyBody")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <PracticeInventory items={shown} editing={editRow?.slug ?? null} />
        )}
      </section>
    </div>
  );
}
