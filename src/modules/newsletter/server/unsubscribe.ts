import { createHmac, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";

import { env } from "@/env";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { db } from "@/server/db";
import { newsletterSubscribers } from "@/server/db/schema";

// Unsubscribe links carry the address and an HMAC of it (key derived from the server secret),
// so nobody can unsubscribe someone else by guessing, and no token table is needed.

const key = () => createHmac("sha256", env.BETTER_AUTH_SECRET ?? "development").update("solstice-newsletter-unsubscribe").digest();
const sign = (email: string) => createHmac("sha256", key()).update(email.toLowerCase()).digest("base64url");

export function unsubscribeToken(email: string) {
  return { e: Buffer.from(email.toLowerCase()).toString("base64url"), t: sign(email) };
}

/** The address a link was made for, or null when the link was altered. */
export function verifyUnsubscribe(e: unknown, t: unknown): string | null {
  if (typeof e !== "string" || typeof t !== "string") return null;
  const email = Buffer.from(e, "base64url").toString("utf8");
  const expected = sign(email);
  if (t.length !== expected.length || !timingSafeEqual(Buffer.from(t), Buffer.from(expected))) return null;
  return email;
}

/** The page a reader confirms on (a link scanner opening it unsubscribes nobody). */
export function unsubscribePageUrl(email: string, locale: Locale) {
  const path = getPathname({ href: { pathname: "/unsubscribe", query: unsubscribeToken(email) }, locale });
  return new URL(path, env.BETTER_AUTH_URL).toString();
}

/** One-click unsubscribe for mail clients (RFC 8058: POST to the List-Unsubscribe URL). */
export function oneClickUrl(email: string) {
  const { e, t } = unsubscribeToken(email);
  return new URL(`/api/newsletter/unsubscribe?e=${e}&t=${t}`, env.BETTER_AUTH_URL).toString();
}

export async function unsubscribe(email: string) {
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.email, email.toLowerCase()));
}
