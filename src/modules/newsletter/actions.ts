"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";

import { db } from "@/server/db";
import { newsletterSubscribers } from "@/server/db/schema";

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.enum(["footer", "journal"]),
});

// Stores the address; sending the epistle waits for an EmailProvider (infrastructure/email).
export async function subscribeToNewsletter(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: "invalid" }> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  // Already subscribed looks the same as a new subscription: no way to probe for addresses.
  await db
    .insert(newsletterSubscribers)
    .values({
      email: parsed.data.email,
      source: parsed.data.source,
      locale: await getLocale(),
    })
    .onConflictDoNothing();
  return { ok: true };
}
