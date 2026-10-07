import { desc, eq, sql } from "drizzle-orm";

import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import type { PracticeRow } from "@/modules/practices/server/to-summary";
import { db } from "@/server/db";
import {
  comments,
  favorites,
  practiceCompletions,
  practices,
  programs,
} from "@/server/db/schema";

export type InventoryItem = {
  slug: string;
  title: string;
  series: string;
  status: "draft" | "published";
  featured: boolean;
  category: PracticeRow["category"];
  access: PracticeRow["access"];
  durationMinutes: number;
  previewSeconds: number | null;
  /** Null until a video is attached; with the mock provider this is a URL. */
  videoAssetId: string | null;
  chapters: number;
  updatedAt: Date;
  publishedAt: Date | null;
  sessions: number;
  saves: number;
  reflections: number;
  programs: number;
};

/**
 * Every practice with the engagement it has earned, newest change first. The library is
 * small (tens of rows), so the three counts ride along as subqueries.
 */
export async function getContentInventory(
  locale: Locale,
): Promise<InventoryItem[]> {
  const rows = await db
    .select({
      slug: practices.slug,
      title: practices.title,
      series: practices.series,
      status: practices.status,
      featured: practices.featured,
      category: practices.category,
      access: practices.access,
      durationMinutes: practices.durationMinutes,
      previewSeconds: practices.previewSeconds,
      videoAssetId: practices.videoAssetId,
      chapters: sql<number>`coalesce(jsonb_array_length(${practices.chapters}), 0)::int`,
      updatedAt: practices.updatedAt,
      publishedAt: practices.publishedAt,
      sessions: sql<number>`(select count(*)::int from ${practiceCompletions} where ${practiceCompletions.practiceSlug} = ${practices.slug})`,
      saves: sql<number>`(select count(*)::int from ${favorites} where ${favorites.practiceSlug} = ${practices.slug})`,
      reflections: sql<number>`(select count(*)::int from ${comments} where ${comments.practiceSlug} = ${practices.slug})`,
    })
    .from(practices)
    .orderBy(desc(practices.updatedAt));

  const programRows = await db.select({ weeks: programs.weeks }).from(programs);
  return rows.map((r) => ({
    ...r,
    programs: programRows.filter((program) =>
      program.weeks.some((week) => week.practices.includes(r.slug)),
    ).length,
    title: localize(r.title, locale),
    series: localize(r.series, locale),
  }));
}

/** One practice, raw, for the editor form. */
export async function getPracticeRow(
  slug: string,
): Promise<PracticeRow | null> {
  const [row] = await db
    .select()
    .from(practices)
    .where(eq(practices.slug, slug))
    .limit(1);
  return row ?? null;
}

/** What the library looks like as a whole, for the publisher's header. */
export async function getLibrarySummary() {
  const rows = await db
    .select({
      status: practices.status,
      access: practices.access,
      hasVideo: sql<boolean>`${practices.videoAssetId} is not null`,
      minutes: practices.durationMinutes,
    })
    .from(practices);

  return {
    total: rows.length,
    published: rows.filter((r) => r.status === "published").length,
    drafts: rows.filter((r) => r.status === "draft").length,
    membersOnly: rows.filter((r) => r.access === "members").length,
    missingVideo: rows.filter((r) => !r.hasVideo).length,
    minutes: rows.reduce((n, r) => n + r.minutes, 0),
  };
}
