"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { categoryFormSchema, categoryKindSchema } from "@/modules/categories/schemas";
import {
  createCategory,
  deleteCategory,
  moveCategory,
  updateCategory,
  type CategoryMutation,
} from "@/modules/categories/server/categories";
import { getViewer } from "@/modules/memberships/server/viewer";

export type CategoryResult = CategoryMutation | { ok: false; error: "forbidden" | "invalid" | "failed" };

const instructorOnly = async () => (await getViewer()).user?.role === "instructor";
// Category names are merged into every page's messages, so refresh the whole site.
const refresh = () => revalidatePath("/[locale]", "layout");
const target = z.object({ kind: categoryKindSchema, slug: z.string().trim().min(1).max(60) });

async function run(work: () => Promise<CategoryMutation>): Promise<CategoryResult> {
  try {
    const result = await work();
    if (result.ok) refresh();
    return result;
  } catch {
    return { ok: false, error: "failed" };
  }
}

export async function newCategory(input: unknown): Promise<CategoryResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = categoryFormSchema.extend({ kind: categoryKindSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { kind, ...fields } = parsed.data;
  return run(() => createCategory(kind, fields));
}

export async function saveCategory(input: unknown): Promise<CategoryResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = target.extend({ name: categoryFormSchema.shape.name, visible: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { kind, slug, ...fields } = parsed.data;
  return run(() => updateCategory(kind, slug, fields));
}

export async function reorderCategory(input: unknown): Promise<CategoryResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = target.extend({ direction: z.union([z.literal(-1), z.literal(1)]) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return run(() => moveCategory(parsed.data.kind, parsed.data.slug, parsed.data.direction));
}

export async function removeCategory(input: unknown): Promise<CategoryResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = target.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return run(() => deleteCategory(parsed.data.kind, parsed.data.slug));
}
