import { count, eq, inArray } from "drizzle-orm";

import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import {
  hasPublishableCurriculum,
  sameCurriculum,
} from "@/modules/programs/schemas";
import type { ProgramFields } from "@/modules/programs/types";
import { db } from "@/server/db";
import { practices, programEnrollments, programs } from "@/server/db/schema";

export type ProgramMutationError =
  "missing" | "practices" | "curriculum" | "enrolled";
export type ProgramMutation =
  { ok: true; slug: string } | { ok: false; error: ProgramMutationError };

export async function getProgramInventory(locale: Locale) {
  const [rows, enrollments] = await Promise.all([
    db.select().from(programs).orderBy(programs.createdAt),
    db
      .select({ slug: programEnrollments.programSlug, count: count() })
      .from(programEnrollments)
      .groupBy(programEnrollments.programSlug),
  ]);
  const counts = new Map(enrollments.map((row) => [row.slug, row.count]));
  return rows.map((row) => ({
    slug: row.slug,
    title: localize(row.title, locale),
    status: row.status,
    featured: row.featured,
    weeks: row.weeks.length,
    days: row.weeks.reduce((sum, week) => sum + week.practices.length, 0),
    enrollments: counts.get(row.slug) ?? 0,
  }));
}

export async function createProgram(
  fields: ProgramFields,
): Promise<ProgramMutation> {
  const wanted = [...new Set(fields.weeks.flatMap((week) => week.practices))];
  const existing = wanted.length
    ? await db
        .select({ slug: practices.slug })
        .from(practices)
        .where(inArray(practices.slug, wanted))
    : [];
  if (existing.length !== wanted.length)
    return { ok: false, error: "practices" };
  const base =
    fields.title.en
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "program";
  for (let attempt = 0; attempt < 100; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const [created] = await db
      .insert(programs)
      .values({ slug, ...fields })
      .onConflictDoNothing()
      .returning({ slug: programs.slug });
    if (created) return { ok: true, slug: created.slug };
  }
  throw new Error("Could not allocate a program slug");
}

/** A transaction keeps the enrollment check and the saved curriculum together. */
export async function updateProgram(
  slug: string,
  fields: ProgramFields,
): Promise<ProgramMutation> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(programs)
      .where(eq(programs.slug, slug))
      .for("update");
    if (!existing) return { ok: false, error: "missing" };
    const [enrollment] = await tx
      .select({ userId: programEnrollments.userId })
      .from(programEnrollments)
      .where(eq(programEnrollments.programSlug, slug))
      .limit(1);
    if (enrollment && !sameCurriculum(existing, fields))
      return { ok: false, error: "enrolled" };
    const wanted = [...new Set(fields.weeks.flatMap((week) => week.practices))];
    const rows = wanted.length
      ? await tx
          .select({ slug: practices.slug, status: practices.status })
          .from(practices)
          .where(inArray(practices.slug, wanted))
      : [];
    if (rows.length !== wanted.length) return { ok: false, error: "practices" };
    if (
      existing.status === "published" &&
      !hasPublishableCurriculum(
        fields.weeks,
        new Set(
          rows
            .filter((row) => row.status === "published")
            .map((row) => row.slug),
        ),
      )
    ) {
      return { ok: false, error: "curriculum" };
    }
    await tx.update(programs).set(fields).where(eq(programs.slug, slug));
    return { ok: true, slug };
  });
}

export async function setProgramStatus(
  slug: string,
  status: "draft" | "published",
): Promise<ProgramMutation> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(programs)
      .where(eq(programs.slug, slug))
      .for("update");
    if (!row) return { ok: false, error: "missing" };
    if (status === "published") {
      const available = await tx
        .select({ slug: practices.slug })
        .from(practices)
        .where(eq(practices.status, "published"));
      if (
        !hasPublishableCurriculum(
          row.weeks,
          new Set(available.map((p) => p.slug)),
        )
      )
        return { ok: false, error: "curriculum" };
    }
    await tx
      .update(programs)
      .set({
        status,
        publishedAt:
          status === "published"
            ? (row.publishedAt ?? new Date())
            : row.publishedAt,
      })
      .where(eq(programs.slug, slug));
    return { ok: true, slug };
  });
}

export async function setProgramFeatured(
  slug: string,
  featured: boolean,
): Promise<ProgramMutation> {
  const [row] = await db
    .update(programs)
    .set({ featured })
    .where(eq(programs.slug, slug))
    .returning({ slug: programs.slug });
  return row ? { ok: true, slug } : { ok: false, error: "missing" };
}

/** Completed practice history stays intact when its program is removed. */
export async function deleteProgram(slug: string): Promise<ProgramMutation> {
  return db.transaction(async (tx) => {
    await tx
      .delete(programEnrollments)
      .where(eq(programEnrollments.programSlug, slug));
    const [row] = await tx
      .delete(programs)
      .where(eq(programs.slug, slug))
      .returning({ slug: programs.slug });
    return row ? { ok: true, slug } : { ok: false, error: "missing" };
  });
}
