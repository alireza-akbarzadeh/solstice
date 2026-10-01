import { eq } from "drizzle-orm";

import type { Localized } from "@/lib/localized";
import type { IntensityLevel, PracticeAccess, PracticeCategory, PropSetup } from "@/modules/practices/types";
import { db } from "@/server/db";
import { practices } from "@/server/db/schema";

/** Each helper reports whether a row actually matched, so an action can reject a stale slug. */
const touched = (rows: { slug: string }[]) => rows.length > 0;

/**
 * Publishing stamps `publishedAt` the first time only, so the library keeps its original
 * order when a practice is pulled back to draft and published again.
 */
export async function setPracticeStatus(slug: string, status: "draft" | "published") {
  const [existing] = await db.select({ publishedAt: practices.publishedAt }).from(practices).where(eq(practices.slug, slug)).limit(1);
  if (!existing) return false;

  const rows = await db
    .update(practices)
    .set({ status, publishedAt: status === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt })
    .where(eq(practices.slug, slug))
    .returning({ slug: practices.slug });
  return touched(rows);
}

export async function setPracticeFeatured(slug: string, featured: boolean) {
  const rows = await db.update(practices).set({ featured }).where(eq(practices.slug, slug)).returning({ slug: practices.slug });
  return touched(rows);
}

/**
 * Points a practice at a video. The row records which provider holds it, so a library can mix
 * sources and a later `VIDEO_PROVIDER` change doesn't strand what is already published.
 * `null` detaches it and sends the practice back to needing one.
 */
export async function setPracticeVideo(slug: string, asset: { providerId: string; assetId: string } | null) {
  const rows = await db
    .update(practices)
    .set({ videoAssetId: asset?.assetId ?? null, videoProvider: asset?.providerId ?? null })
    .where(eq(practices.slug, slug))
    .returning({ slug: practices.slug });
  return touched(rows);
}

/** The editor form: the fields an instructor edits after seeding, in both locales. */
export async function updatePracticeMeta(input: {
  slug: string;
  title: Localized;
  summary: Localized;
  series: Localized;
  category: PracticeCategory;
  intensityLevel: IntensityLevel;
  intensityLabel: Localized;
  props: PropSetup;
  durationMinutes: number;
  access: PracticeAccess;
  previewSeconds: number | null;
}) {
  const { slug, ...fields } = input;
  const rows = await db
    .update(practices)
    // A preview length only means anything on a members-only practice.
    .set({ ...fields, previewSeconds: fields.access === "members" ? fields.previewSeconds : null })
    .where(eq(practices.slug, slug))
    .returning({ slug: practices.slug });
  return touched(rows);
}
