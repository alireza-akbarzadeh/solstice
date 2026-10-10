import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  StudioCrumb,
  type StudioCrumbItem,
} from "@/components/layout/studio-breadcrumb";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { PageEditor } from "@/modules/instructor/components/page-editor";
import { PageInventory } from "@/modules/instructor/components/page-inventory";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import {
  blankPageContent,
  pageDefinition,
  pageDefinitions,
} from "@/modules/pages/definitions";
import {
  defaultContentFor,
  editableContentFor,
} from "@/modules/pages/defaults";
import { getPageInventory, getSitePage } from "@/modules/pages/server/library";
import { getHomeSections } from "@/modules/home/server/sections";
import { HomeSectionsEditor } from "@/modules/instructor/components/home-sections-editor";
import { TestimonialsManager } from "@/modules/testimonials/components/testimonials-manager";
import { getTestimonials } from "@/modules/testimonials/server/testimonials";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return {
    title: (await getTranslations({ locale, namespace: "Studio.pages" }))(
      "title",
    ),
    robots: { index: false },
  };
}
export default async function StudioPages({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireInstructor(locale, "/instructor/pages");
  const query = await searchParams;
  const creating = query.new === "1";
  const slug = typeof query.edit === "string" ? query.edit : undefined;
  const [t, rows, row, homeSections, testimonials] = await Promise.all([
    getTranslations("Studio.pages"),
    getPageInventory(),
    slug ? getSitePage(slug) : Promise.resolve(null),
    getHomeSections(),
    getTestimonials(),
  ]);
  if (slug && !row && !creating) notFound();
  const inventory = rows.map((page) => ({
    slug: page.slug,
    title: localize(page.draftContent.title, locale),
    builtin: page.builtin,
    path: pageDefinition(page.slug)?.path ?? `/${page.slug}`,
    live: !!page.publishedContent,
    changed:
      !!page.publishedContent &&
      JSON.stringify(page.draftContent) !==
        JSON.stringify(page.publishedContent),
    navigation: !!page.publishedContent?.showInNavigation,
    footer: !!page.publishedContent?.showInFooter,
    isEvent:
      !!page.publishedContent?.event?.enabled ||
      !!page.draftContent?.event?.enabled,
  }));
  const builtins = inventory
    .filter((page) => page.builtin)
    .sort(
      (a, b) =>
        pageDefinitions.findIndex((d) => d.slug === a.slug) -
        pageDefinitions.findIndex((d) => d.slug === b.slug),
    );
  const custom = inventory.filter((page) => !page.builtin);
  const tCrumb = await getTranslations("Studio.breadcrumb");
  const crumbItems: StudioCrumbItem[] = row
    ? [{ label: localize(row.draftContent.title, locale) || row.slug }]
    : creating
      ? [{ label: tCrumb("new") }]
      : [];

  return (
    <div className="gap-space-lg flex flex-col">
      <StudioCrumb items={crumbItems} />
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede")}
        actions={
          <Button asChild size="lg">
            <Link href="/instructor/pages?new=1">
              <PlusIcon data-icon="inline-start" />
              {t("newPage")}
            </Link>
          </Button>
        }
      />
      {(row !== null || creating) && (
        <PageEditor
          key={row?.slug ?? "new"}
          initial={
            row
              ? row.builtin
                ? editableContentFor(row.slug, row.draftContent)
                : row.draftContent
              : blankPageContent()
          }
          initialSlug={row?.slug ?? null}
          definition={row?.builtin ? (pageDefinition(row.slug) ?? null) : null}
          template={row?.builtin ? defaultContentFor(row.slug) : null}
          live={!!row?.publishedContent}
          homeSections={homeSections}
        />
      )}
      {!slug && !creating && (
        <>
          <section className="flex flex-col gap-3">
            <HomeSectionsEditor initialSections={homeSections} />
          </section>
          <section className="flex flex-col gap-3">
            <TestimonialsManager initialItems={testimonials} />
          </section>
        </>
      )}
      <section className="flex flex-col gap-4">
        <h2 className="font-headline-sm text-headline-sm">
          {t("websitePages")}
        </h2>
        <p className="text-on-surface-variant text-sm">{t("websiteHint")}</p>
        <PageInventory items={builtins} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-headline-sm text-headline-sm">
          {t("customPages")}
        </h2>
        {custom.length ? (
          <PageInventory items={custom} />
        ) : (
          <p className="bg-surface-container-low p-space-lg text-on-surface-variant rounded-xl">
            {t("empty")}
          </p>
        )}
      </section>
    </div>
  );
}
