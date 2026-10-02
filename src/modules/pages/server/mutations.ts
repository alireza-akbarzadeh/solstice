import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { sitePages } from "@/server/db/schema";
import { defaultContentFor } from "../defaults";
import { isCustomPageSlug } from "../definitions";
import {
  pageContentSchema,
  validBuiltinContent,
  validCustomContent,
} from "../schemas";
import type { PageContent } from "../types";

export type PageResult =
  | { ok: true; slug: string }
  | {
      ok: false;
      error:
        | "invalid"
        | "copy"
        | "reserved"
        | "duplicate"
        | "missing"
        | "protected"
        | "incomplete"
        | "forbidden"
        | "failed";
    };

function validateContent(
  slug: string,
  builtin: boolean,
  input: unknown,
  publishing: boolean,
):
  | { ok: true; content: PageContent }
  | { ok: false; error: "invalid" | "copy" | "incomplete" } {
  const serialized = JSON.stringify(input);
  if (!serialized || serialized.length > 1000000)
    return { ok: false, error: "invalid" };
  const parsed = pageContentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (builtin) {
    const template = defaultContentFor(slug);
    if (!template || !validBuiltinContent(parsed.data, template))
      return { ok: false, error: "copy" };
  } else if (!validCustomContent(parsed.data, publishing))
    return { ok: false, error: publishing ? "incomplete" : "invalid" };
  return { ok: true, content: parsed.data };
}

export async function createSitePage(
  slug: string,
  input: unknown,
): Promise<PageResult> {
  if (!isCustomPageSlug(slug)) return { ok: false, error: "reserved" };
  const parsed = validateContent(slug, false, input, false);
  if (!parsed.ok) return parsed;
  const [created] = await db
    .insert(sitePages)
    .values({ slug, builtin: false, draftContent: parsed.content })
    .onConflictDoNothing()
    .returning({ slug: sitePages.slug });
  return created ? { ok: true, slug } : { ok: false, error: "duplicate" };
}

/** A save changes the draft; publishing atomically replaces the live snapshot. */
export async function saveSitePage(
  slug: string,
  input: unknown,
  publish = false,
): Promise<PageResult> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(sitePages)
      .where(eq(sitePages.slug, slug))
      .for("update");
    if (!row) return { ok: false, error: "missing" };
    const parsed = validateContent(slug, row.builtin, input, publish);
    if (!parsed.ok) return parsed;
    await tx
      .update(sitePages)
      .set({
        draftContent: parsed.content,
        ...(publish
          ? { publishedContent: parsed.content, publishedAt: new Date() }
          : {}),
      })
      .where(eq(sitePages.slug, slug));
    return { ok: true, slug };
  });
}

export async function unpublishSitePage(slug: string): Promise<PageResult> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ builtin: sitePages.builtin })
      .from(sitePages)
      .where(eq(sitePages.slug, slug))
      .for("update");
    if (!row) return { ok: false, error: "missing" };
    if (row.builtin) return { ok: false, error: "protected" };
    await tx
      .update(sitePages)
      .set({ publishedContent: null })
      .where(eq(sitePages.slug, slug));
    return { ok: true, slug };
  });
}

export async function deleteSitePage(slug: string): Promise<PageResult> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ builtin: sitePages.builtin })
      .from(sitePages)
      .where(eq(sitePages.slug, slug))
      .for("update");
    if (!row) return { ok: false, error: "missing" };
    if (row.builtin) return { ok: false, error: "protected" };
    await tx.delete(sitePages).where(eq(sitePages.slug, slug));
    return { ok: true, slug };
  });
}
