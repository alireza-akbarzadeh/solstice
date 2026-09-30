import { getDirection, type Locale } from "@/i18n/routing";
import { sendWebPush, type PushPayload } from "@/infrastructure/push/web-push";
import type { pushSubscriptions } from "@/server/db/schema";

import { getAllSubscriptions, getUserSubscriptions, removeSubscriptionById } from "./subscriptions";

type Subscription = typeof pushSubscriptions.$inferSelect;

/** Copy per locale; each device gets the version matching the locale it subscribed in. */
export type Notification = Record<Locale, Omit<PushPayload, "lang" | "dir">>;

async function deliver(subscriptions: Subscription[], notification: Notification) {
  const results = await Promise.all(
    subscriptions.map(async (s) => {
      const locale = s.locale as Locale;
      const content = notification[locale] ?? notification.en;
      const result = await sendWebPush(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        { ...content, lang: locale, dir: getDirection(locale) },
      );
      if (result === "expired") await removeSubscriptionById(s.id);
      return result;
    }),
  );
  return {
    sent: results.filter((r) => r === "sent").length,
    expired: results.filter((r) => r === "expired").length,
    failed: results.filter((r) => r === "failed").length,
  };
}

export async function notifyUser(userId: string, notification: Notification) {
  return deliver(await getUserSubscriptions(userId), notification);
}

// TODO(instructor): call from the announcements UI (/instructor/posts); batch if the audience grows large.
export async function notifyEveryone(notification: Notification) {
  return deliver(await getAllSubscriptions(), notification);
}
