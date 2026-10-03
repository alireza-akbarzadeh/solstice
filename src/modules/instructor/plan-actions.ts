"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { planFieldsSchema } from "@/modules/memberships/plan-schemas";
import { currencies } from "@/modules/memberships/plans";
import {
  createPlan,
  deletePlan,
  movePlan,
  setCurrency,
  setPlanFeatured,
  setPlanStatus,
  updatePlan,
  type PlanMutation,
} from "@/modules/memberships/server/plans";
import { getViewer } from "@/modules/memberships/server/viewer";

export type PlanResult =
  PlanMutation | { ok: false; error: "forbidden" | "invalid" | "failed" };

const instructorOnly = async () =>
  (await getViewer()).user?.role === "instructor";
// Prices show across the public site (home, membership, sign-up), so refresh every page.
const refresh = () => revalidatePath("/[locale]", "layout");
const idSchema = z.string().trim().min(1).max(100);

async function run(work: () => Promise<PlanMutation>): Promise<PlanResult> {
  try {
    const result = await work();
    if (result.ok) refresh();
    return result;
  } catch {
    return { ok: false, error: "failed" };
  }
}

export async function newPlan(input: unknown): Promise<PlanResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = planFieldsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return run(() => createPlan(parsed.data));
}

export async function savePlan(input: unknown): Promise<PlanResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z
    .object({ id: idSchema, fields: planFieldsSchema })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return run(() => updatePlan(parsed.data.id, parsed.data.fields));
}

export async function changePlanStatus(input: unknown): Promise<PlanResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z
    .object({ id: idSchema, status: z.enum(["active", "hidden"]) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return run(() => setPlanStatus(parsed.data.id, parsed.data.status));
}

export async function recommendPlan(input: unknown): Promise<PlanResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return run(() => setPlanFeatured(parsed.data.id));
}

export async function reorderPlan(input: unknown): Promise<PlanResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z
    .object({ id: idSchema, direction: z.union([z.literal(-1), z.literal(1)]) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return run(() => movePlan(parsed.data.id, parsed.data.direction));
}

export async function removePlan(input: unknown): Promise<PlanResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return run(() => deletePlan(parsed.data.id));
}

export async function saveCurrency(input: unknown): Promise<PlanResult> {
  if (!(await instructorOnly())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ currency: z.enum(currencies) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return run(async () => {
    await setCurrency(parsed.data.currency);
    return { ok: true, id: parsed.data.currency };
  });
}
