"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { isPushConfigured } from "@/infrastructure/push/web-push";
import { getSession } from "@/server/better-auth/server";

import { pushSubscriptionSchema, subscribeInputSchema } from "./schemas";
import { notifyUser } from "./server/send";
import { removeSubscription, saveSubscription } from "./server/subscriptions";

type ActionResult = { ok: true } | { ok: false; error: "unauthenticated" | "invalid" | "unavailable" };

export async function subscribeToPush(input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };
  if (!isPushConfigured()) return { ok: false, error: "unavailable" };

  const parsed = subscribeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const userAgent = (await headers()).get("user-agent");
  await saveSubscription(session.user.id, parsed.data.subscription, parsed.data.locale, userAgent);
  return { ok: true };
}

export async function unsubscribeFromPush(endpoint: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const parsed = pushSubscriptionSchema.shape.endpoint.safeParse(endpoint);
  if (!parsed.success) return { ok: false, error: "invalid" };

  await removeSubscription(session.user.id, parsed.data);
  return { ok: true };
}

// Lets a member confirm notifications reach their device.
export async function sendTestNotification(): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };
  if (!isPushConfigured()) return { ok: false, error: "unavailable" };

  const copy = await Promise.all(
    routing.locales.map(async (locale) => {
      const t = await getTranslations({ locale, namespace: "Notifications.test" });
      return [locale, { title: t("title"), body: t("body"), url: "/", tag: "test" }] as const;
    }),
  );
  await notifyUser(session.user.id, Object.fromEntries(copy) as Parameters<typeof notifyUser>[1]);
  return { ok: true };
}
