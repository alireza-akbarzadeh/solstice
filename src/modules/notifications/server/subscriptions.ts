import { and, count, eq } from "drizzle-orm";

import type { Locale } from "@/i18n/routing";
import { db } from "@/server/db";
import { pushSubscriptions } from "@/server/db/schema";

import type { PushSubscriptionInput } from "../schemas";

// An endpoint belongs to one browser profile; re-subscribing moves it to the current user.
export async function saveSubscription(
  userId: string,
  subscription: PushSubscriptionInput,
  locale: Locale,
  userAgent: string | null,
) {
  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      locale,
      userAgent: userAgent?.slice(0, 512) ?? null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, locale },
    });
}

export async function removeSubscription(userId: string, endpoint: string) {
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
}

export async function removeSubscriptionById(id: number) {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
}

export async function getUserSubscriptions(userId: string) {
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}

export async function getAllSubscriptions() {
  return db.select().from(pushSubscriptions);
}

/** How many devices a studio announcement would reach. */
export async function getSubscriptionCount() {
  const [row] = await db.select({ n: count() }).from(pushSubscriptions);
  return row?.n ?? 0;
}
