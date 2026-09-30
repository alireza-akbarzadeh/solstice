import webpush, { WebPushError } from "web-push";

import { env } from "@/env";

// Self-hosted Web Push: we sign each message with our own VAPID key and hand it to the
// browser vendor's push service (FCM, Mozilla, Apple). No third-party account involved.

export type PushTarget = { endpoint: string; keys: { p256dh: string; auth: string } };

export type PushPayload = {
  title: string;
  body: string;
  /** Path to open on click, e.g. "/practices/golden-hour-prana-flow". */
  url: string;
  /** Notifications with the same tag replace each other instead of stacking. */
  tag?: string;
  lang?: string;
  dir?: "ltr" | "rtl";
};

export type PushResult = "sent" | "expired" | "failed";

export function isPushConfigured() {
  return !!(env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
}

let configured = false;
function configure() {
  if (configured) return;
  if (!isPushConfigured()) throw new Error("Web Push is not configured: set the VAPID_* variables");
  webpush.setVapidDetails(env.VAPID_SUBJECT!, env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
  configured = true;
}

export async function sendWebPush(target: PushTarget, payload: PushPayload): Promise<PushResult> {
  configure();
  try {
    await webpush.sendNotification(target, JSON.stringify(payload), { TTL: 60 * 60 * 24, urgency: "normal" });
    return "sent";
  } catch (error) {
    // 404/410: the browser dropped this subscription; the caller should delete it.
    if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) return "expired";
    console.error("[push] send failed", error instanceof WebPushError ? error.statusCode : error);
    return "failed";
  }
}
