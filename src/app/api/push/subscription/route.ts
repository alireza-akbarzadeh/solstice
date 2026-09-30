import { NextResponse } from "next/server";
import { z } from "zod";

import { routing } from "@/i18n/routing";
import { pushSubscriptionSchema } from "@/modules/notifications/schemas";
import { removeSubscription, saveSubscription } from "@/modules/notifications/server/subscriptions";
import { getSession } from "@/server/better-auth/server";

// Called by the service worker on `pushsubscriptionchange`, when the browser rotates a
// subscription in the background. The UI uses server actions instead.
const bodySchema = z.object({
  oldEndpoint: z.string().url().optional(),
  subscription: pushSubscriptionSchema,
  locale: z.enum(routing.locales).default(routing.defaultLocale),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { oldEndpoint, subscription, locale } = parsed.data;
  if (oldEndpoint && oldEndpoint !== subscription.endpoint) await removeSubscription(session.user.id, oldEndpoint);
  await saveSubscription(session.user.id, subscription, locale, request.headers.get("user-agent"));
  return NextResponse.json({ ok: true });
}
