import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StudioCrumb } from "@/components/layout/studio-breadcrumb";
import { routing } from "@/i18n/routing";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { ClassInventory } from "@/modules/classes/components/instructor/class-inventory";
import { getClassRsvps, getLiveClasses } from "@/modules/classes/server/classes";
import { db } from "@/server/db";
import { practices } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Studio.classes" });
  return {
    title: `${t("title")} · Arte Yoga Studio`,
  };
}

export default async function InstructorClassesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/classes");
  const t = await getTranslations("Studio.classes");

  const [classes, practiceRows] = await Promise.all([
    getLiveClasses(),
    db
      .select({ slug: practices.slug, title: practices.title })
      .from(practices)
      .where(eq(practices.status, "published")),
  ]);

  const fetchRsvpsAction = async (classId: number) => {
    "use server";
    return getClassRsvps(classId);
  };

  return (
    <div className="space-y-space-md p-margin-mobile md:p-margin">
      <StudioCrumb items={[{ label: t("title") }]} />

      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("description")}
      />

      <ClassInventory
        classes={classes}
        availablePractices={practiceRows}
        fetchRsvpsAction={fetchRsvpsAction}
      />
    </div>
  );
}
