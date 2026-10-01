"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getViewer } from "@/modules/memberships/server/viewer";
import { programFieldsSchema } from "@/modules/programs/schemas";
import {
  createProgram,
  deleteProgram,
  setProgramFeatured,
  setProgramStatus,
  updateProgram,
  type ProgramMutation,
} from "./server/programs";

export type ProgramResult =
  ProgramMutation | { ok: false; error: "forbidden" | "invalid" | "failed" };
const slugSchema = z.string().min(1).max(200);
const instructorOnly = async () =>
  (await getViewer()).user?.role === "instructor";
const refresh = () => revalidatePath("/[locale]", "layout");

export async function newProgram(input: unknown): Promise<ProgramResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = programFieldsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    // Creation navigates to the saved editor; avoid remounting a blank form before its slug arrives.
    return await createProgram(parsed.data);
  } catch {
    return { ok: false, error: "failed" };
  }
}

export async function saveProgram(input: unknown): Promise<ProgramResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z
    .object({ slug: slugSchema, fields: programFieldsSchema })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const result = await updateProgram(parsed.data.slug, parsed.data.fields);
    if (result.ok) refresh();
    return result;
  } catch {
    return { ok: false, error: "failed" };
  }
}

export async function publishProgram(input: unknown): Promise<ProgramResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z
    .object({ slug: slugSchema, status: z.enum(["draft", "published"]) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const result = await setProgramStatus(parsed.data.slug, parsed.data.status);
    if (result.ok) refresh();
    return result;
  } catch {
    return { ok: false, error: "failed" };
  }
}

export async function featureProgram(input: unknown): Promise<ProgramResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z
    .object({ slug: slugSchema, featured: z.boolean() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const result = await setProgramFeatured(
      parsed.data.slug,
      parsed.data.featured,
    );
    if (result.ok) refresh();
    return result;
  } catch {
    return { ok: false, error: "failed" };
  }
}

export async function removeProgram(input: unknown): Promise<ProgramResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ slug: slugSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const result = await deleteProgram(parsed.data.slug);
    if (result.ok) refresh();
    return result;
  } catch {
    return { ok: false, error: "failed" };
  }
}
