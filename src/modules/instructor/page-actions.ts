"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/modules/memberships/server/viewer";
import {
  createSitePage,
  deleteSitePage,
  saveSitePage,
  unpublishSitePage,
  type PageResult,
} from "@/modules/pages/server/mutations";

const inputSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  content: z.unknown(),
});
const slugSchema = z.object({ slug: z.string().trim().min(1).max(80) });
const instructorOnly = async () =>
  (await getViewer()).user?.role === "instructor";
const refresh = () => revalidatePath("/[locale]", "layout");

export async function newWebsitePage(input: unknown): Promise<PageResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    return await createSitePage(parsed.data.slug, parsed.data.content);
  } catch {
    return { ok: false, error: "failed" };
  }
}
export async function saveWebsitePage(input: unknown): Promise<PageResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = inputSchema
    .extend({ publish: z.boolean().optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const result = await saveSitePage(
      parsed.data.slug,
      parsed.data.content,
      parsed.data.publish,
    );
    if (result.ok) refresh();
    return result;
  } catch {
    return { ok: false, error: "failed" };
  }
}
export async function unpublishWebsitePage(
  input: unknown,
): Promise<PageResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = slugSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const result = await unpublishSitePage(parsed.data.slug);
    if (result.ok) refresh();
    return result;
  } catch {
    return { ok: false, error: "failed" };
  }
}
export async function removeWebsitePage(input: unknown): Promise<PageResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = slugSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const result = await deleteSitePage(parsed.data.slug);
    if (result.ok) refresh();
    return result;
  } catch {
    return { ok: false, error: "failed" };
  }
}
