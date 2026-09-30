import { cache } from "react";

import { getSession } from "@/server/better-auth/server";

import { getMembership, isMembershipActive, type Membership } from "./memberships";

export type Viewer = {
  user: { id: string; name: string; email: string; image?: string | null; role: "member" | "instructor" } | null;
  membership: Membership | null;
  /** Entitled to members-only content: an active membership, or the instructor. */
  hasAccess: boolean;
};

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
