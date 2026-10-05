import { createHash, randomUUID } from "node:crypto";

import { cookies, headers } from "next/headers";

import { env } from "@/env";
import type { Viewer } from "@/modules/memberships/server/viewer";

import type { Owner } from "./conversations";

// Who is chatting: a signed-in member by account, a visitor by a random id in a cookie. The
// address is kept only as a salted hash, so rate limits survive a cleared cookie.

const VISITOR_COOKIE = "solstice-visitor";
const YEAR = 60 * 60 * 24 * 365;

async function clientKey() {
  const list = await headers();
  const address = list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "";
  return address ? createHash("sha256").update(`${env.BETTER_AUTH_SECRET}:${address}`).digest("hex").slice(0, 32) : null;
}

/**
 * The owner for chat actions. With `create`, a visitor without a cookie gets one (only server
 * actions may set cookies); otherwise a new visitor has no owner yet.
 */
export async function chatOwner(viewer: Viewer, { create = false } = {}): Promise<{ owner: Owner | null; clientKey: string | null }> {
  const key = await clientKey();
  if (viewer.user) return { owner: { userId: viewer.user.id }, clientKey: key };
  const jar = await cookies();
  let visitorId = jar.get(VISITOR_COOKIE)?.value;
  if (!visitorId && create) {
    visitorId = randomUUID();
    jar.set(VISITOR_COOKIE, visitorId, { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", maxAge: YEAR, path: "/" });
  }
  return { owner: visitorId ? { visitorId } : null, clientKey: key };
}
