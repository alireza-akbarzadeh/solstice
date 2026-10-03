import { BookOpenIcon, CircleCheckIcon, PencilOffIcon, PlusIcon, StarIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StudioCrumb, type StudioCrumbItem } from "@/components/layout/studio-breadcrumb";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { JournalEditor, type EditableArticle } from "@/modules/instructor/components/journal-editor";
import { JournalInventory } from "@/modules/instructor/components/journal-inventory";
import { StatCard } from "@/modules/instructor/components/stat-card";
import { StudioFilterPills } from "@/modules/instructor/components/studio-filter-pills";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import type { JournalInventoryItem } from "@/modules/instructor/server/journal";
import { getArticleRow, getJournalRows } from "@/modules/journal/server/get-articles";
import { localize } from "@/lib/localized";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { getAllPracticeSummaries } from "@/modules/practices/server/get-practice";

const views = ["all", "published", "draft"] as const;
type View = (typeof views)[number];

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/journal">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.journal" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// The journal lives in Postgres now, so this is a real editor: write, publish, feature, delete.
export default async function StudioJournalPage({ params, searchParams }: PageProps<"/[locale]/instructor/journal">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/journal");
  const query = await searchParams;
  const one = (key: string) => (Array.isArray(query[key]) ? query[key][0] : query[key]);
  const rawView = one("view");
  const view: View = views.includes(rawView as View) ? (rawView as View) : "all";
  const editSlug = one("edit");
  const creating = one("new") === "1";

  const [t, format, rows, practices] = await Promise.all([
    getTranslations("Studio.journal"),
    getFormatter(),
    getJournalRows(),
    getAllPracticeSummaries(locale),
  ]);

  const items: JournalInventoryItem[] = rows.map((row) => ({
    slug: row.slug,
    status: row.status,
    featured: row.featured,
    category: row.category,
    issue: row.issue,
    title: localize(row.title, locale),
    excerpt: localize(row.excerpt, locale),
    image: row.image,
    authorName: localize(row.authorName, locale),
    blocks: row.body.length,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
  }));

  const shown = items.filter((i) => (view === "all" ? true : i.status === view));
  const counts: Record<View, number> = {
    all: items.length,
    published: items.filter((i) => i.status === "published").length,
    draft: items.filter((i) => i.status === "draft").length,
  };

  const editRow = editSlug ? await getArticleRow(editSlug) : null;
  const practiceOptions = practices.map((p) => ({ slug: p.slug, title: p.title }));

  // A brand-new essay starts from an empty shape; saving it mints the slug.
  const blank: EditableArticle = {
    slug: null,
    category: "somatic",
    issue: (items[0]?.issue ?? 0) + 1,
    title: { en: "", fa: "" },
    excerpt: { en: "", fa: "" },
    tags: [],
    authorName: { en: "", fa: "" },
    authorRole: { en: "", fa: "" },
    authorImage: null,
    image: "",
    imageAlt: { en: "", fa: "" },
    body: [],
    practices: [],
  };

  const editing: EditableArticle | null = editRow
    ? {
        slug: editRow.slug,
        category: editRow.category,
        issue: editRow.issue,
        title: editRow.title,
        excerpt: editRow.excerpt,
        tags: editRow.tags,
        authorName: editRow.authorName,
        authorRole: editRow.authorRole,
        authorImage: editRow.authorImage,
        image: editRow.image,
        imageAlt: editRow.imageAlt,
        body: editRow.body,
        practices: editRow.practices,
      }
    : creating
      ? blank
      : null;

  const tCrumb = await getTranslations("Studio.breadcrumb");
  const crumbItems: StudioCrumbItem[] = editRow ? [{ label: localize(editRow.title, locale) || editRow.slug }] : creating ? [{ label: tCrumb("new") }] : [];

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioCrumb items={crumbItems} />
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede", { total: items.length, published: counts.published })}
        actions={
          <Button asChild size="lg">
            <Link href="/instructor/journal?new=1">
              <PlusIcon data-icon="inline-start" />
              {t("newEssay")}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("stats.essays")} value={format.number(items.length)} note={t("stats.essaysNote")} icon={BookOpenIcon} />
        <StatCard label={t("stats.published")} value={format.number(counts.published)} note={t("stats.publishedNote")} icon={CircleCheckIcon} />
        <StatCard label={t("stats.drafts")} value={format.number(counts.draft)} note={t("stats.draftsNote")} icon={PencilOffIcon} />
        <StatCard
          label={t("stats.featured")}
          value={items.find((i) => i.featured)?.title ?? "—"}
          note={t("stats.featuredNote")}
          icon={StarIcon}
          className="[&_span:first-of-type+*_span]:text-headline-sm"
        />
      </div>

      {editing ? (
        <JournalEditor key={editing.slug ?? "new"} article={editing} practiceOptions={practiceOptions} />
      ) : (
        <Empty className="rounded-xl bg-surface-container-low">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenIcon />
            </EmptyMedia>
            <EmptyTitle className="font-headline-sm text-headline-sm">{t("pick.title")}</EmptyTitle>
            <EmptyDescription>{t("pick.body")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <section className="flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("shelf")}</h2>
          <Badge variant="outline">{t("showing", { shown: shown.length, total: items.length })}</Badge>
        </div>

        <StudioFilterPills
          basePath="/instructor/journal"
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
          <JournalInventory items={shown} editing={editRow?.slug ?? null} />
        )}
      </section>
    </div>
  );
}
