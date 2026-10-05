"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getAllPlans } from "@/modules/memberships/server/plans";
import { getViewer } from "@/modules/memberships/server/viewer";

import { assistantMessageSchema, escalateSchema, guidanceMessageSchema, newGuidanceThreadSchema } from "./schemas";
import { replyAsAssistant } from "./server/assistant";
import {
  addMessage,
  countOpenGuidance,
  countRecentMemberMessages,
  createConversation,
  getOwnedConversation,
  getThread,
  latestAssistantConversation,
  markRead,
  messagesAfter,
  queuePosition,
  setGuestContact,
  setStatus,
  type Owner,
} from "./server/conversations";
import { getFullPlanIds, hasGuidanceAccess, joinWaitlist } from "./server/guidance";
import { notifyStaffWaiting } from "./server/notify";
import { getChatSettings } from "./server/settings";
import { chatOwner } from "./server/visitor";
import type { AiFailure, ConversationStatus, MessageView, ThreadView } from "./types";

// Chat actions for members and visitors. Every action re-checks who is asking: guidance needs a
// plan with guidance, and a conversation is only ever read or written by its owner.

/** Messages a person may send per hour, across their chats (spam and quota guard). */
const HOURLY_LIMIT = 30;
/** Guidance threads a member can have open (waiting or answered) at once. */
const OPEN_THREADS = 5;

async function withinRate(owner: Owner, clientKey: string | null) {
  return (await countRecentMemberMessages(owner, clientKey, new Date(Date.now() - 60 * 60 * 1000))) < HOURLY_LIMIT;
}

/** The name the studio sees in its notification. */
async function senderName(name: string | undefined) {
  if (name) return name;
  return (await getTranslations("Conversations.notify"))("visitor");
}

// ——— Quick help (the AI assistant) ———

export type AssistantState = { enabled: boolean; thread: ThreadView | null };

/** What the widget shows when opened: the visitor's current chat, if any. */
export async function loadAssistant(): Promise<AssistantState> {
  const [viewer, locale, settings] = await Promise.all([getViewer(), getLocale(), getChatSettings()]);
  const { owner } = await chatOwner(viewer);
  const row = owner ? await latestAssistantConversation(owner) : null;
  return { enabled: settings.assistantOn, thread: row ? await getThread(row, locale as Locale, "member") : null };
}

export type SendResult =
  | { ok: true; conversationId: number; status: ConversationStatus; messages: MessageView[]; failure: AiFailure | null }
  | { ok: false; error: "invalid" | "rate" | "off" };

export async function sendAssistantMessage(input: { conversationId: number | null; body: string }): Promise<SendResult> {
  const parsed = assistantMessageSchema.safeParse({ body: input.body });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const [viewer, locale, settings] = await Promise.all([getViewer(), getLocale(), getChatSettings()]);
  const { owner, clientKey } = await chatOwner(viewer, { create: true });
  if (!owner) return { ok: false, error: "invalid" };

  let row = input.conversationId ? await getOwnedConversation(input.conversationId, owner) : null;
  if (row && (row.kind !== "assistant" || row.status === "closed")) row = null;
  // A chat a person has taken over keeps working with the assistant switched off.
  if (!settings.assistantOn && (!row || row.status === "open")) return { ok: false, error: "off" };
  if (!(await withinRate(owner, clientKey))) return { ok: false, error: "rate" };

  row ??= await createConversation({ kind: "assistant", owner, clientKey, status: "open", locale: locale as Locale, subject: parsed.data.body.slice(0, 80) });
  const message = await addMessage({ conversationId: row.id, author: "member", authorId: viewer.user?.id, body: parsed.data.body });
  const created: MessageView[] = [];
  let failure: AiFailure | null = null;
  let status = row.status;

  if (row.status === "open") {
    // Only the assistant so far: it answers.
    const reply = await replyAsAssistant(row);
    if (!reply.ok) failure = reply.reason;
  } else if (row.status !== "waiting") {
    // A person is on it: no AI; the studio hears about the follow-up.
    await setStatus(row, "waiting");
    status = "waiting";
    await notifyStaffWaiting(row, parsed.data.body, await senderName(viewer.user?.name ?? row.guestName ?? undefined));
  }
  created.push(...(await messagesAfter(row.id, message.id - 1, locale as Locale)));
  return { ok: true, conversationId: row.id, status, messages: created, failure };
}

export type EscalateResult = { ok: true } | { ok: false; error: "invalid" | "email" | "notFound" };

/** "Talk to a person": the chat joins the studio's queue. Visitors leave an email for the reply. */
export async function escalateAssistant(input: { conversationId: number; name: string; email: string }): Promise<EscalateResult> {
  const parsed = escalateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const viewer = await getViewer();
  const { owner } = await chatOwner(viewer);
  const row = owner ? await getOwnedConversation(input.conversationId, owner) : null;
  if (!row || row.kind !== "assistant") return { ok: false, error: "notFound" };
  if (!viewer.user) {
    if (!parsed.data.email) return { ok: false, error: "email" };
    await setGuestContact(row.id, parsed.data);
  }
  if (row.status === "waiting") return { ok: true };
  await setStatus(row, "waiting");
  const thread = await getThread(row, row.locale as Locale, "member");
  const lastQuestion = [...thread.messages].reverse().find((m) => m.author === "member")?.body ?? "";
  await notifyStaffWaiting(row, lastQuestion, await senderName(viewer.user?.name ?? (parsed.data.name || undefined)));
  return { ok: true };
}

/** "New chat": an AI-only or answered chat is put away; a waiting one stays in the studio's queue. */
export async function startAssistantOver(conversationId: number) {
  const viewer = await getViewer();
  const { owner } = await chatOwner(viewer);
  const row = owner ? await getOwnedConversation(conversationId, owner) : null;
  if (row && row.kind === "assistant" && row.status !== "waiting") await setStatus(row, "closed");
}

// ——— Shared: polling and read marks ———

export type PollResult = { ok: true; messages: MessageView[]; status: ConversationStatus; queuePosition: number | null } | { ok: false };

/** New messages since `afterId` in the owner's conversation; reading them marks it read. */
export async function pollConversation(input: { conversationId: number; afterId: number }): Promise<PollResult> {
  const [viewer, locale] = await Promise.all([getViewer(), getLocale()]);
  const { owner } = await chatOwner(viewer);
  const row = owner ? await getOwnedConversation(input.conversationId, owner) : null;
  if (!row) return { ok: false };
  const messages = await messagesAfter(row.id, input.afterId, locale as Locale);
  if (messages.length) await markRead(row.id, "member");
  return { ok: true, messages, status: row.status, queuePosition: await queuePosition(row) };
}

export async function markConversationRead(conversationId: number) {
  const viewer = await getViewer();
  const { owner } = await chatOwner(viewer);
  const row = owner ? await getOwnedConversation(conversationId, owner) : null;
  if (row) await markRead(row.id, "member");
}

// ——— 1:1 guidance ———

export type GuidanceResult =
  | { ok: true; conversationId: number; messages: MessageView[]; status: ConversationStatus; queuePosition: number | null; failure: AiFailure | null }
  | { ok: false; error: "forbidden" | "invalid" | "rate" | "tooMany" | "notFound" };

async function guidanceAccess() {
  const viewer = await getViewer();
  if (!viewer.user || !(await hasGuidanceAccess(viewer))) return null;
  return viewer as typeof viewer & { user: NonNullable<typeof viewer.user> };
}

/** After a member's message: AI answers first if the studio turned that on; the thread waits for the instructor. */
async function afterMemberMessage(row: NonNullable<Awaited<ReturnType<typeof getOwnedConversation>>>, firstMessageId: number, locale: Locale) {
  const settings = await getChatSettings();
  let failure: AiFailure | null = null;
  if (settings.guidanceAi) {
    const reply = await replyAsAssistant(row);
    if (!reply.ok && reply.reason !== "off") failure = reply.reason;
  }
  const fresh = (await getOwnedConversation(row.id, { userId: row.userId! }))!;
  return {
    ok: true as const,
    conversationId: row.id,
    messages: await messagesAfter(row.id, firstMessageId - 1, locale),
    status: fresh.status,
    queuePosition: await queuePosition(fresh),
    failure,
  };
}

export async function startGuidanceThread(input: unknown): Promise<GuidanceResult> {
  const parsed = newGuidanceThreadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const viewer = await guidanceAccess();
  if (!viewer) return { ok: false, error: "forbidden" };
  const locale = (await getLocale()) as Locale;
  const owner = { userId: viewer.user.id };
  if (!(await withinRate(owner, null))) return { ok: false, error: "rate" };
  if ((await countOpenGuidance(viewer.user.id)) >= OPEN_THREADS) return { ok: false, error: "tooMany" };

  const { topic, subject, body, practiceSlug, practiceAt } = parsed.data;
  const row = await createConversation({ kind: "guidance", owner, topic, subject, status: "waiting", locale });
  const message = await addMessage({ conversationId: row.id, author: "member", authorId: viewer.user.id, body, practiceSlug, practiceAt });
  await notifyStaffWaiting(row, body, viewer.user.name);
  return afterMemberMessage(row, message.id, locale);
}

export async function sendGuidanceMessage(input: { conversationId: number } & Record<string, unknown>): Promise<GuidanceResult> {
  const parsed = guidanceMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const viewer = await guidanceAccess();
  if (!viewer) return { ok: false, error: "forbidden" };
  const locale = (await getLocale()) as Locale;
  const owner = { userId: viewer.user.id };
  const row = await getOwnedConversation(Number(input.conversationId), owner);
  if (!row || row.kind !== "guidance") return { ok: false, error: "notFound" };
  if (!(await withinRate(owner, null))) return { ok: false, error: "rate" };

  const message = await addMessage({ conversationId: row.id, author: "member", authorId: viewer.user.id, ...parsed.data });
  if (row.status !== "waiting") {
    // A follow-up after a reply (or on a closed thread) puts it back in the queue.
    await setStatus(row, "waiting");
    await notifyStaffWaiting(row, parsed.data.body, viewer.user.name);
  }
  return afterMemberMessage(row, message.id, locale);
}

/** The member closes their own thread when they have what they needed. */
export async function closeGuidanceThread(conversationId: number) {
  const viewer = await getViewer();
  if (!viewer.user) return;
  const row = await getOwnedConversation(conversationId, { userId: viewer.user.id });
  if (row?.kind === "guidance" && row.status !== "closed") await setStatus(row, "closed");
  revalidatePath("/[locale]/guidance", "page");
}

/** Waitlist for a full guidance plan (a form on the guidance page and the membership page). */
export async function joinGuidanceWaitlist(formData: FormData) {
  const locale = await getLocale();
  const viewer = await getViewer();
  const planId = String(formData.get("plan") ?? "");
  if (!viewer.user) return redirect({ href: `/sign-in?next=${encodeURIComponent("/guidance")}`, locale });
  const plan = (await getAllPlans()).find((p) => p.id === planId && p.guidance && p.status === "active");
  if (plan && (await getFullPlanIds()).has(plan.id)) await joinWaitlist(plan.id, viewer.user.id);
  revalidatePath("/[locale]/guidance", "page");
}
