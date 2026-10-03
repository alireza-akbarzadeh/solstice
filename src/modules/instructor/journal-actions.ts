"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { categoryExists } from "@/modules/categories/server/categories";
import { journalFieldsSchema } from "@/modules/journal/schemas";
import { getViewer } from "@/modules/memberships/server/viewer";

import {
  createArticle,
  deleteArticle,
  type JournalFields,
  nextIssue,
  setArticleFeatured,
  setArticleStatus,
  uniqueSlug,
  updateArticle,
} from "./server/journal";

export type JournalResult = { ok: true; slug?: string } | { ok: false; error: "forbidden" | "invalid" | "failed" };

async function instructorOnly() {
  const viewer = await getViewer();
  return viewer.user?.role === "instructor" ? viewer.user : null;
}

const refresh = () => revalidatePath("/[locale]", "layout");

const fieldsSchema = journalFieldsSchema;

const slug = z.string().min(1).max(200);

export async function createJournalArticle(input: unknown): Promise<JournalResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = fieldsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!(await categoryExists("journal", parsed.data.category))) return { ok: false, error: "invalid" };

  // The slug and issue are derived, so nobody has to invent a URL or count issues.
  const newSlug = await uniqueSlug(parsed.data.title.en);
  const issue = parsed.data.issue || (await nextIssue());
  const created = await createArticle(newSlug, { ...parsed.data, issue } satisfies JournalFields);
  if (!created) return { ok: false, error: "failed" };
  // Deliberately no refresh() here: revalidating the layout re-renders this page and remounts
  // the editor with an empty form, throwing away the slug the client needs to move onto the
  // saved essay. The navigation that follows loads fresh data anyway.
  return { ok: true, slug: newSlug };
}

export async function saveJournalArticle(input: unknown): Promise<JournalResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ slug, fields: fieldsSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!(await categoryExists("journal", parsed.data.fields.category))) return { ok: false, error: "invalid" };

  const changed = await updateArticle(parsed.data.slug, parsed.data.fields);
  if (!changed) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true, slug: parsed.data.slug };
}

export async function publishJournalArticle(input: unknown): Promise<JournalResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ slug, status: z.enum(["draft", "published"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const changed = await setArticleStatus(parsed.data.slug, parsed.data.status);
  if (!changed) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true };
}

export async function featureJournalArticle(input: unknown): Promise<JournalResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ slug, featured: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const changed = await setArticleFeatured(parsed.data.slug, parsed.data.featured);
  if (!changed) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true };
}

export async function removeJournalArticle(input: unknown): Promise<JournalResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ slug }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const removed = await deleteArticle(parsed.data.slug);
  if (!removed) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true };
}
