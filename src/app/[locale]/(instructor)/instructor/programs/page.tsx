import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  StudioCrumb,
  type StudioCrumbItem,
} from "@/components/layout/studio-breadcrumb";
import { localize } from "@/lib/localized";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  ProgramEditor,
  type EditableProgram,
} from "@/modules/instructor/components/program-editor";
import { ProgramInventory } from "@/modules/instructor/components/program-inventory";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { getContentInventory } from "@/modules/instructor/server/content";
import { getProgramInventory } from "@/modules/instructor/server/programs";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { getProgramRow } from "@/modules/programs/server/library";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return {
    title: (await getTranslations({ locale, namespace: "Studio.programs" }))(
      "title",
    ),
    robots: { index: false },
  };
}

export default async function StudioProgramsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireInstructor(locale, "/instructor/programs");
  const query = await searchParams;
  const creating = query.new === "1";
  const editSlug = typeof query.edit === "string" ? query.edit : undefined;
  const [t, inventory, practices, row] = await Promise.all([
    getTranslations("Studio.programs"),
    getProgramInventory(locale),
    getContentInventory(locale),
    editSlug ? getProgramRow(editSlug) : Promise.resolve(null),
  ]);
  if (editSlug && !row && !creating) notFound();
  const empty = { en: "", fa: "" };
  const blank: EditableProgram = {
    slug: null,
    status: "draft",
    title: empty,
    description: empty,
    heroTitle: empty,
    lede: empty,
    badge: empty,
    cta: { en: "Explore the program", fa: "دیدن برنامه" },
    note: empty,
    image: "",
    imageAlt: empty,
    tone: "primary",
    icon: "sunrise",
    pacing: "self",
    weeks: [],
  };
  const enrollments =
    inventory.find((p) => p.slug === row?.slug)?.enrollments ?? 0;
  const tCrumb = await getTranslations("Studio.breadcrumb");
  const crumbItems: StudioCrumbItem[] = row
    ? [{ label: localize(row.title, locale) || row.slug }]
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
            <Link href="/instructor/programs?new=1">
              <PlusIcon data-icon="inline-start" />
              {t("newProgram")}
            </Link>
          </Button>
        }
      />
      {(row !== null || creating) && (
        <ProgramEditor
          key={row?.slug ?? "new"}
          program={row ?? blank}
          enrollments={enrollments}
          practiceOptions={practices.map((p) => ({
            slug: p.slug,
            title: p.title,
            status: p.status,
          }))}
        />
      )}
      <section className="gap-space-md flex flex-col">
        <h2 className="font-headline-sm text-headline-sm">{t("inventory")}</h2>
        {inventory.length ? (
          <ProgramInventory items={inventory} />
        ) : (
          <p className="bg-surface-container-low p-space-lg text-on-surface-variant rounded-xl">
            {t("empty")}
          </p>
        )}
      </section>
    </div>
  );
}
