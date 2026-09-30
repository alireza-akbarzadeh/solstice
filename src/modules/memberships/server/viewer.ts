import { notFound } from "next/navigation";
import { cache } from "react";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { withNext } from "@/lib/safe-next";
import { getSession } from "@/server/better-auth/server";

import { getMembership, isMembershipActive, type Membership } from "./memberships";

export type Viewer = {
  user: { id: string; name: string; email: string; image?: string | null; role: "member" | "instructor" } | null;
  membership: Membership | null;
  /** Entitled to members-only content: an active membership, or the instructor. */
  hasAccess: boolean;
};

export type SignedInViewer = Viewer & { user: NonNullable<Viewer["user"]> };

/** Member pages: signed-out visitors go to sign-in and come back to `here`. */
export async function requireUser(locale: Locale, here: string): Promise<SignedInViewer> {
  const viewer = await getViewer();
  if (!viewer.user) return redirect({ href: withNext("/sign-in", here), locale });
  return viewer as SignedInViewer;
}

/** Instructor pages: sign-in first; anyone else gets a 404 (the studio isn't advertised). */
export async function requireInstructor(locale: Locale, here: string): Promise<SignedInViewer> {
  const viewer = await requireUser(locale, here);
  if (viewer.user.role !== "instructor") notFound();
  return viewer;
}

// Authentication (session) + membership (entitlement), resolved once per request.
export const getViewer = cache(async (): Promise<Viewer> => {
  const session = await getSession();
  if (!session) return { user: null, membership: null, hasAccess: false };

  const role = session.user.role === "instructor" ? "instructor" : "member";
  const membership = await getMembership(session.user.id);
  return {
    user: { id: session.user.id, name: session.user.name, email: session.user.email, image: session.user.image, role },
    membership,
    hasAccess: role === "instructor" || isMembershipActive(membership),
  };
});
