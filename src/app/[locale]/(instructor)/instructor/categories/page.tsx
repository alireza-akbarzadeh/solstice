import { PlusIcon, ShapesIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StudioCrumb, type StudioCrumbItem } from "@/components/layout/studio-breadcrumb";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { getCategories, getCategoryUsage } from "@/modules/categories/server/categories";
import { categoryKinds, type CategoryKind } from "@/modules/categories/types";
import { CategoryEditor, CategoryList, type CategoryItem } from "@/modules/instructor/components/category-manager";
import { StudioFilterPills } from "@/modules/instructor/components/studio-filter-pills";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { requireInstructor } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/categories">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.categories" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen. Practice and journal categories: names in both languages, order, and
// whether they appear in the public filters. The library, journal and editors read these.
export default async function StudioCategoriesPage({ params, searchParams }: PageProps<"/[locale]/instructor/categories">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/categories");
  const query = await searchParams;
  const one = (key: string) => (Array.isArray(query[key]) ? query[key][0] : query[key]);
  const rawKind = one("kind");
  const kind: CategoryKind = categoryKinds.includes(rawKind as CategoryKind) ? (rawKind as CategoryKind) : "practice";
  const editSlug = one("edit");
  const creating = one("new") === "1";

  const [t, rows, usage, counts] = await Promise.all([
    getTranslations("Studio.categories"),
    getCategories(kind),
    getCategoryUsage(kind),
    Promise.all(categoryKinds.map(async (k) => [k, (await getCategories(k)).length] as const)),
  ]);

  const items: CategoryItem[] = rows.map((row) => ({ ...row, label: localize(row.name, locale) || row.slug, uses: usage[row.slug] ?? 0 }));
  const editing = editSlug ? (rows.find((row) => row.slug === editSlug) ?? null) : null;
  const showEditor = !!editing || creating;
  const crumbItems: StudioCrumbItem[] = [
    { label: t(`kinds.${kind}`), href: `/instructor/categories?kind=${kind}` },
    ...(editing ? [{ label: localize(editing.name, locale) || editing.slug }] : creating ? [{ label: t("new") }] : []),
  ];

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioCrumb items={crumbItems} />
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede")}
        actions={
          <Button asChild>
            <Link href={`/instructor/categories?kind=${kind}&new=1`}>
              <PlusIcon data-icon="inline-start" />
              {t("new")}
            </Link>
          </Button>
        }
      />

      <StudioFilterPills
        basePath="/instructor/categories"
        param="kind"
        active={kind}
        options={counts.map(([k, n]) => ({ value: k, label: t(`kinds.${k}`), count: n }))}
      />

      <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
        <div className="xl:col-span-5">
          {items.length === 0 ? (
            <Empty className="rounded-xl bg-surface-container-low">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShapesIcon />
                </EmptyMedia>
                <EmptyTitle className="font-headline-sm text-headline-sm">{t("emptyTitle")}</EmptyTitle>
                <EmptyDescription>{t("emptyBody")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <CategoryList kind={kind} items={items} editing={editing?.slug ?? null} />
          )}
        </div>
        {/* On a phone the open editor comes first rather than below every category. */}
        <div className={cn("xl:col-span-7", showEditor && "order-first xl:order-none")}>
          {showEditor ? (
            <CategoryEditor key={`${kind}:${editing?.slug ?? "new"}`} kind={kind} category={editing} uses={editing ? (usage[editing.slug] ?? 0) : 0} />
          ) : (
            <Empty className="rounded-xl bg-surface-container-low">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShapesIcon />
                </EmptyMedia>
                <EmptyTitle className="font-headline-sm text-headline-sm">{t("pickTitle")}</EmptyTitle>
                <EmptyDescription>{t("pickBody")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}
