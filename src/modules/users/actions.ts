"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/server/better-auth";
import { getSession } from "@/server/better-auth/server";

import { profileSchema } from "./schemas";

export async function updateProfile(input: unknown): Promise<{ ok: true } | { ok: false; error: "signIn" | "invalid" }> {
  if (!(await getSession())) return { ok: false, error: "signIn" };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  await auth.api.updateUser({ body: parsed.data, headers: await headers() });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
