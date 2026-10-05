"use server";

import { and, eq, isNull } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { after } from "next/server";

import { env } from "@/env";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { sendEmail } from "@/infrastructure/email";
import { isPushConfigured } from "@/infrastructure/push/web-push";
import { getViewer } from "@/modules/memberships/server/viewer";
import { notifyUser, type Notification } from "@/modules/notifications/server/send";
import { db } from "@/server/db";
import { guidanceWaitlist, user } from "@/server/db/schema";

import { assistantSettingsSchema, staffReplySchema } from "./schemas";
import { previewAssistant } from "./server/assistant";
import { addMessage, getConversation, getThread, markRead, messagesAfter, setStatus } from "./server/conversations";
import { notifyMemberReply } from "./server/notify";
import { getAssistantSettingsView, saveAssistantSettings, type AssistantSettingsView } from "./server/settings";
import type { AiFailure, ConversationStatus, MessageView, ThreadView } from "./types";

// The studio side of conversations: the instructor answers, closes and reopens, and sets up
// the assistant. Every action checks for the instructor.

async function instructor() {
  const viewer = await getViewer();
  return viewer.user?.role === "instructor" ? viewer.user : null;
}

export async function openInboxThread(conversationId: number): Promise<ThreadView | null> {
  if (!(await instructor())) return null;
  const row = await getConversation(conversationId);
  if (!row) return null;
  await markRead(row.id, "staff");
  return getThread(row, (await getLocale()), "staff");
}

export type StaffReplyResult = { ok: true; messages: MessageView[]; status: ConversationStatus } | { ok: false; error: "forbidden" | "invalid" | "notFound" };

export async function replyAsStaff(input: { conversationId: number; body: string }): Promise<StaffReplyResult> {
  const me = await instructor();
  if (!me) return { ok: false, error: "forbidden" };
  const parsed = staffReplySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const row = await getConversation(parsed.data.conversationId);
  if (!row) return { ok: false, error: "notFound" };

  const message = await addMessage({ conversationId: row.id, author: "instructor", authorId: me.id, body: parsed.data.body });
  await setStatus(row, "answered");
  // Signed with the studio's instructor name in the member's language, as MessageBubble shows it.
  after(() => notifyMemberReply(row, parsed.data.body));
  return { ok: true, messages: await messagesAfter(row.id, message.id - 1, (await getLocale())), status: "answered" };
}

export async function setInboxStatus(input: { conversationId: number; status: "closed" | "answered" | "waiting" }) {
  if (!(await instructor())) return { ok: false as const };
  const row = await getConversation(input.conversationId);
  if (!row) return { ok: false as const };
  await setStatus(row, input.status);
  return { ok: true as const, status: input.status };
}

export async function pollInboxThread(input: { conversationId: number; afterId: number }) {
  if (!(await instructor())) return { ok: false as const };
  const row = await getConversation(input.conversationId);
  if (!row) return { ok: false as const };
  const messages = await messagesAfter(row.id, input.afterId, (await getLocale()));
  if (messages.some((m) => m.author === "member")) await markRead(row.id, "staff");
  return { ok: true as const, messages, status: row.status };
}

// ——— Assistant settings ———

export type AssistantSettingsResult = { ok: true; view: AssistantSettingsView } | { ok: false; error: "forbidden" | "invalid" | "failed" };

export async function saveAssistant(input: unknown): Promise<AssistantSettingsResult> {
  if (!(await instructor())) return { ok: false, error: "forbidden" };
  const parsed = assistantSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    await saveAssistantSettings(parsed.data);
  } catch {
    return { ok: false, error: "failed" };
  }
  return { ok: true, view: await getAssistantSettingsView() };
}

export type TryAssistantResult = { ok: true; text: string; model: string } | { ok: false; reason: AiFailure | "forbidden"; detail?: string };

/** "Try it": asks the saved assistant one question, as a visitor would, without storing it. */
export async function tryAssistant(question: string): Promise<TryAssistantResult> {
  if (!(await instructor())) return { ok: false, reason: "forbidden" };
  const text = question.trim().slice(0, 1000);
  if (!text) return { ok: false, reason: "unavailable" };
  return previewAssistant(text, (await getLocale()));
}

// ——— Waitlist ———

/** Tells everyone waiting for a plan that a place is open (push + email), once each. */
export async function notifyWaitlist(planId: string): Promise<{ ok: true; notified: number } | { ok: false }> {
  if (!(await instructor())) return { ok: false };
  const waiting = await db
    .select({ id: guidanceWaitlist.id, userId: user.id, name: user.name, email: user.email })
    .from(guidanceWaitlist)
    .innerJoin(user, eq(user.id, guidanceWaitlist.userId))
    .where(and(eq(guidanceWaitlist.planId, planId), isNull(guidanceWaitlist.notifiedAt)));
  if (!waiting.length) return { ok: true, notified: 0 };

  const href = `/membership?plan=${encodeURIComponent(planId)}`;
  const locale = routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Conversations.notify" });
  const url = new URL(getPathname({ href, locale }), env.BETTER_AUTH_URL).toString();
  const copy = Object.fromEntries(
    await Promise.all(
      routing.locales.map(async (l) => {
        const tl = await getTranslations({ locale: l, namespace: "Conversations.notify" });
        return [l, { title: tl("waitlist.title"), body: tl("waitlist.body"), url: getPathname({ href, locale: l }), tag: `waitlist-${planId}` }] as const;
      }),
    ),
  ) as Notification;

  for (const person of waiting) {
    if (isPushConfigured()) await notifyUser(person.userId, copy).catch(() => undefined);
    await sendEmail({ to: person.email, subject: t("waitlist.title"), text: t("waitlist.email", { name: person.name, url }), actionUrl: url }).catch((error) =>
      console.error("Waitlist email failed.", error),
    );
    await db.update(guidanceWaitlist).set({ notifiedAt: new Date() }).where(eq(guidanceWaitlist.id, person.id));
  }
  return { ok: true, notified: waiting.length };
}
