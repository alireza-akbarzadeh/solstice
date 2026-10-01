"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { journalCategories } from "@/modules/journal/types";
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

const localized = (max: number) => z.object({ en: z.string().max(max), fa: z.string().max(max) });
const required = (max: number) => z.object({ en: z.string().min(1).max(max), fa: z.string().min(1).max(max) });

// Mirrors JournalStoredBlock: the shapes the essay page knows how to render.
const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text: localized(4000) }),
  z.object({ type: z.literal("h2"), text: localized(200) }),
  z.object({ type: z.literal("quote"), text: localized(1000), source: localized(200) }),
  z.object({ type: z.literal("figure"), image: z.string().max(2000), alt: localized(300), caption: localized(500) }),
  z.object({
    type: z.literal("steps"),
    title: localized(200),
    intro: localized(1000),
    items: z.array(z.object({ title: localized(200), body: localized(2000) })).max(20),
  }),
]);

const fieldsSchema = z.object({
  category: z.enum(journalCategories),
  issue: z.number().int().min(1).max(9999),
  title: required(200),
  excerpt: required(600),
  tags: z.array(localized(60)).max(8),
  authorName: required(120),
  authorRole: required(160),
  authorImage: z.string().max(2000).nullable(),
  image: z.string().min(1).max(2000),
  imageAlt: required(300),
  body: z.array(blockSchema).max(200),
  practices: z.array(z.string().min(1).max(200)).max(12),
});

const slug = z.string().min(1).max(200);

export async function createJournalArticle(input: unknown): Promise<JournalResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = fieldsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

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
