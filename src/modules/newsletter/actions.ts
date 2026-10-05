"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";

import { emailSchema } from "@/modules/auth/schemas";
import { db } from "@/server/db";
import { newsletterSubscribers } from "@/server/db/schema";

const inputSchema = z.object({
  email: emailSchema.pipe(z.string().max(254)).transform((email) => email.toLowerCase()),
  source: z.enum(["footer", "journal"]),
});

// Stores the address; newsletters are sent from the studio (/instructor/subscribers).
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
