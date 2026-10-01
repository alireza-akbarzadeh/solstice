import {
  CircleCheckIcon,
  FilmIcon,
  Flower2Icon,
  LockIcon,
  PencilOffIcon,
  PlusIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  PracticeEditor,
  type EditablePractice,
} from "@/modules/instructor/components/practice-editor";
import { PracticeInventory } from "@/modules/instructor/components/practice-inventory";
import { StatCard } from "@/modules/instructor/components/stat-card";
import { StudioFilterPills } from "@/modules/instructor/components/studio-filter-pills";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import {
  getContentInventory,
  getLibrarySummary,
  getPracticeRow,
} from "@/modules/instructor/server/content";
import { getPracticeUsage } from "@/modules/instructor/server/publish";
import { requireInstructor } from "@/modules/memberships/server/viewer";

const views = ["all", "published", "draft", "members", "needsVideo"] as const;
type View = (typeof views)[number];

const matches =
  (view: View) =>
  (item: Awaited<ReturnType<typeof getContentInventory>>[number]) => {
    if (view === "published" || view === "draft") return item.status === view;
    if (view === "members") return item.access === "members";
    if (view === "needsVideo") return !item.videoAssetId;
    return true;
  };

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/instructor/videos">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.practices" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Stitch: studio-admin-content-video-publisher. The library lives in Postgres, so this edits
// real rows: create, edit, publish and delete from the studio.
export default async function StudioPracticesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/instructor/videos">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/videos");
  const query = await searchParams;
  const rawView = Array.isArray(query.view) ? query.view[0] : query.view;
  const view: View = views.includes(rawView as View)
    ? (rawView as View)
    : "all";
  const editSlug = Array.isArray(query.edit) ? query.edit[0] : query.edit;
  const creating =
    (Array.isArray(query.new) ? query.new[0] : query.new) === "1";

  const [t, format, inventory, library, editRow] = await Promise.all([
    getTranslations("Studio.practices"),
    getFormatter(),
    getContentInventory(locale),
    getLibrarySummary(),
    editSlug ? getPracticeRow(editSlug) : Promise.resolve(null),
  ]);

  // What deleting this practice would take with it, shown before anything is destroyed.
  const usage = editRow ? await getPracticeUsage(editRow.slug) : undefined;

  // A new practice starts from sensible defaults; saving mints its slug from the title.
  const blank: EditablePractice = {
    slug: null,
    status: "draft",
    title: { en: "", fa: "" },
    summary: { en: "", fa: "" },
    series: { en: "Daily practice", fa: "تمرین روزانه" },
    category: "morning",
    intensityLevel: "gentle",
    intensityLabel: { en: "Gentle", fa: "ملایم" },
    props: "none",
    durationMinutes: 30,
    access: "open",
    previewSeconds: null,
    image: "",
    imageAlt: { en: "", fa: "" },
    poster: null,
    videoAssetId: null,
    videoProvider: null,
  };

  const shown = inventory.filter(matches(view));
  const counts: Record<View, number> = {
    all: inventory.length,
    published: inventory.filter(matches("published")).length,
    draft: inventory.filter(matches("draft")).length,
    members: inventory.filter(matches("members")).length,
    needsVideo: inventory.filter(matches("needsVideo")).length,
  };

  return (
    <div className="gap-space-lg flex flex-col">
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede", { total: library.total, minutes: library.minutes })}
        actions={
          <Button asChild size="lg">
            <Link href="/instructor/videos?new=1">
              <PlusIcon data-icon="inline-start" />
              {t("newPractice")}
            </Link>
          </Button>
        }
      />

      <div className="gap-space-md grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.published")}
          value={format.number(library.published)}
          note={t("stats.live")}
          icon={CircleCheckIcon}
        />
        <StatCard
          label={t("stats.drafts")}
          value={format.number(library.drafts)}
          note={t("stats.hidden")}
          icon={PencilOffIcon}
        />
        <StatCard
          label={t("stats.membersOnly")}
          value={format.number(library.membersOnly)}
          note={t("stats.gated")}
          icon={LockIcon}
        />
        <StatCard
          label={t("stats.missingVideo")}
          value={format.number(library.missingVideo)}
          note={t("stats.attachNeeded")}
          icon={FilmIcon}
        />
      </div>

      {editRow || creating ? (
        <PracticeEditor
          key={editRow?.slug ?? "new"}
          usage={usage}
          practice={
            editRow
              ? {
                  slug: editRow.slug,
                  status: editRow.status,
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
                  image: editRow.image,
                  imageAlt: editRow.imageAlt,
                  poster: editRow.poster,
                  videoAssetId: editRow.videoAssetId,
                  videoProvider: editRow.videoProvider,
                }
              : blank
          }
        />
      ) : (
        <Empty className="bg-surface-container-low rounded-xl">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Flower2Icon />
            </EmptyMedia>
            <EmptyTitle className="font-headline-sm text-headline-sm">
              {t("pick.title")}
            </EmptyTitle>
            <EmptyDescription>{t("pick.body")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <section className="gap-space-md flex flex-col">
        <div className="gap-space-sm flex flex-wrap items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {t("inventory")}
          </h2>
          <Badge variant="outline">
            {t("showing", { shown: shown.length, total: inventory.length })}
          </Badge>
        </div>

        <StudioFilterPills
          basePath="/instructor/videos"
          param="view"
          active={view}
          keep={editSlug ? { edit: editSlug } : undefined}
          options={views.map((v) => ({
            value: v,
            label: t(`views.${v}`),
            count: counts[v],
          }))}
        />

        {shown.length === 0 ? (
          <Empty className="bg-surface-container-low rounded-xl">
            <EmptyHeader>
              <EmptyTitle className="font-headline-sm text-headline-sm">
                {t("emptyTitle")}
              </EmptyTitle>
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
