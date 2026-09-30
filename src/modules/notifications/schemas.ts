import { z } from "zod";

import { routing } from "@/i18n/routing";

// The JSON a browser's PushSubscription serialises to (subscription.toJSON()).
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

export const subscribeInputSchema = z.object({
  subscription: pushSubscriptionSchema,
  locale: z.enum(routing.locales),
});
