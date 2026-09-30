"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/server/better-auth";
import { getSession } from "@/server/better-auth/server";

import { practiceRhythms } from "./types";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  practiceRhythm: z.enum(practiceRhythms),
  marketingOptIn: z.boolean(),
});

export async function updateProfile(input: unknown): Promise<{ ok: true } | { ok: false; error: "signIn" | "invalid" }> {
  if (!(await getSession())) return { ok: false, error: "signIn" };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  await auth.api.updateUser({ body: parsed.data, headers: await headers() });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
