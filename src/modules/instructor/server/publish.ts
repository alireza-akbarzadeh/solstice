import { count, eq } from "drizzle-orm";

import type { Localized } from "@/lib/localized";
import type {
  IntensityLevel,
  PracticeAccess,
  PracticeCategory,
  PropSetup,
} from "@/modules/practices/types";
import { db } from "@/server/db";
import {
  comments,
  favorites,
  practiceCompletions,
  practices,
  programs,
} from "@/server/db/schema";

/** Each helper reports whether a row actually matched, so an action can reject a stale slug. */
const touched = (rows: { slug: string }[]) => rows.length > 0;

/**
 * Publishing stamps `publishedAt` the first time only, so the library keeps its original
 * order when a practice is pulled back to draft and published again.
 */
export async function setPracticeStatus(
  slug: string,
  status: "draft" | "published",
) {
  const [existing] = await db
    .select({
      publishedAt: practices.publishedAt,
      videoAssetId: practices.videoAssetId,
    })
    .from(practices)
    .where(eq(practices.slug, slug))
    .limit(1);
  if (!existing || (status === "published" && !existing.videoAssetId))
    return false;

  const rows = await db
    .update(practices)
    .set({
      status,
      publishedAt:
        status === "published"
          ? (existing.publishedAt ?? new Date())
          : existing.publishedAt,
    })
    .where(eq(practices.slug, slug))
    .returning({ slug: practices.slug });
  return touched(rows);
}

export async function setPracticeFeatured(slug: string, featured: boolean) {
  const rows = await db
    .update(practices)
    .set({ featured })
    .where(eq(practices.slug, slug))
    .returning({ slug: practices.slug });
  return touched(rows);
}

/**
 * Points a practice at a video. The row records which provider holds it, so a library can mix
 * sources and a later `VIDEO_PROVIDER` change doesn't strand what is already published.
 * `null` detaches it and sends the practice back to needing one.
 */
export async function setPracticeVideo(
  slug: string,
  asset: { providerId: string; assetId: string } | null,
) {
  const rows = await db
    .update(practices)
    .set({
      videoAssetId: asset?.assetId ?? null,
      videoProvider: asset?.providerId ?? null,
      ...(!asset ? { status: "draft" as const } : {}),
    })
    .where(eq(practices.slug, slug))
    .returning({ slug: practices.slug });
  return touched(rows);
}

/** The fields shared by practice creation and editing, in both locales. */
export async function updatePracticeMeta(
  input: NewPracticeFields & {
    slug: string;
    videoAssetId?: string | null;
    videoProvider?: string | null;
  },
) {
  const { slug, ...fields } = input;
  const rows = await db
    .update(practices)
    // A preview length only means anything on a members-only practice.
    .set({
      ...fields,
      ...(fields.videoAssetId === null ? { status: "draft" as const } : {}),
      previewSeconds:
        fields.access === "members" ? fields.previewSeconds : null,
    })
    .where(eq(practices.slug, slug))
    .returning({ slug: practices.slug });
  return touched(rows);
}

/** A slug derived from the English title, kept unique, so nobody has to invent a URL. */
export async function uniquePracticeSlug(title: string) {
  const base =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "practice";

  const taken = new Set(
    (await db.select({ slug: practices.slug }).from(practices)).map(
      (r) => r.slug,
    ),
  );
  if (!taken.has(base)) return base;
  for (let n = 2; n < 500; n++)
    if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  return `${base}-${Date.now().toString(36)}`;
}

export type NewPracticeFields = {
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
  image: string;
  imageAlt: Localized;
  poster: string | null;
  videoAssetId?: string | null;
  videoProvider?: string | null;
};

/** A new practice starts as a draft, optionally with its video already attached. */
export async function createPractice(slug: string, fields: NewPracticeFields) {
  const rows = await db
    .insert(practices)
    .values({
      slug,
      status: "draft",
      featured: false,
      rating: 0,
      reviewCount: 0,
      focus: [],
      implements: [],
      chapters: [],
      ...fields,
      previewSeconds:
        fields.access === "members" ? fields.previewSeconds : null,
    })
    .returning({ slug: practices.slug });
  return touched(rows);
}

/**
 * What a practice would take with it. Members' rows point at it by slug with no foreign key,
 * so the studio shows these counts before anything is destroyed.
 */
export async function getPracticeUsage(slug: string) {
  const [saves] = await db
    .select({ n: count() })
    .from(favorites)
    .where(eq(favorites.practiceSlug, slug));
  const [reflections] = await db
    .select({ n: count() })
    .from(comments)
    .where(eq(comments.practiceSlug, slug));
  const programRows = await db.select({ weeks: programs.weeks }).from(programs);
  const [sessions] = await db
    .select({ n: count() })
    .from(practiceCompletions)
    .where(eq(practiceCompletions.practiceSlug, slug));
  return {
    saves: saves?.n ?? 0,
    reflections: reflections?.n ?? 0,
    sessions: sessions?.n ?? 0,
    programs: programRows.filter((program) =>
      program.weeks.some((week) => week.practices.includes(slug)),
    ).length,
  };
}

/**
 * Removes a practice along with the saves and reflections that only make sense beside it.
 * Completions are deliberately kept: they are a member's own record of minutes practised, and
 * deleting them would quietly rewrite their progress and streaks.
 */
export async function deletePractice(slug: string) {
  if ((await getPracticeUsage(slug)).programs > 0) return false;
  return db.transaction(async (tx) => {
    await tx.delete(favorites).where(eq(favorites.practiceSlug, slug));
    await tx.delete(comments).where(eq(comments.practiceSlug, slug));
    const rows = await tx
      .delete(practices)
      .where(eq(practices.slug, slug))
      .returning({ slug: practices.slug });
    return touched(rows);
  });
}
