import { and, asc, count, desc, eq, gt, gte, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";

import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { db } from "@/server/db";
import { conversationMessages, conversations, memberships, practices, user } from "@/server/db/schema";

import type {
  ConversationKind,
  ConversationStatus,
  GuidanceTopic,
  InboxRow,
  MessageAuthor,
  MessageView,
  ThreadSummary,
  ThreadView,
} from "../types";

// Reads and writes for conversations. Callers check who may see what (actions.ts,
// studio-actions.ts); these functions trust their arguments.

type Conversation = typeof conversations.$inferSelect;
type Message = typeof conversationMessages.$inferSelect;

/** Who a conversation belongs to: a member, or a visitor known by their cookie. */
export type Owner = { userId: string } | { visitorId: string };

const ownedBy = (owner: Owner): SQL =>
  "userId" in owner ? eq(conversations.userId, owner.userId) : eq(conversations.visitorId, owner.visitorId);

const iso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);
const after = (a: Date | string | null | undefined, b: Date | null) => !!a && (!b || new Date(a) > b);

async function practiceTitles(slugs: (string | null)[], locale: Locale) {
  const wanted = [...new Set(slugs.filter((s): s is string => !!s))];
  if (!wanted.length) return new Map<string, string>();
  const rows = await db.select({ slug: practices.slug, title: practices.title }).from(practices).where(inArray(practices.slug, wanted));
  return new Map(rows.map((row) => [row.slug, localize(row.title, locale) || row.slug]));
}

async function toMessageViews(rows: Message[], locale: Locale): Promise<MessageView[]> {
  const titles = await practiceTitles(
    rows.map((row) => row.practiceSlug),
    locale,
  );
  return rows.map((row) => ({
    id: row.id,
    author: row.author,
    body: row.body,
    practice: row.practiceSlug ? { slug: row.practiceSlug, title: titles.get(row.practiceSlug) ?? row.practiceSlug, at: row.practiceAt } : null,
    createdAt: row.createdAt.toISOString(),
  }));
}

/** Latest message, and the latest from each side, for the given conversations. */
async function activity(ids: number[]) {
  if (!ids.length) return new Map<number, { preview: string; previewAuthor: MessageAuthor; lastStaff: string | null; lastMember: string | null }>();
  const [latest, times] = await Promise.all([
    db
      .selectDistinctOn([conversationMessages.conversationId], {
        id: conversationMessages.conversationId,
        body: conversationMessages.body,
        author: conversationMessages.author,
      })
      .from(conversationMessages)
      .where(inArray(conversationMessages.conversationId, ids))
      .orderBy(conversationMessages.conversationId, desc(conversationMessages.id)),
    db
      .select({
        id: conversationMessages.conversationId,
        lastStaff: sql<string | null>`max(${conversationMessages.createdAt}) filter (where ${conversationMessages.author} <> 'member')`,
        lastMember: sql<string | null>`max(${conversationMessages.createdAt}) filter (where ${conversationMessages.author} = 'member')`,
      })
      .from(conversationMessages)
      .where(inArray(conversationMessages.conversationId, ids))
      .groupBy(conversationMessages.conversationId),
  ]);
  const timesById = new Map(times.map((row) => [row.id, row]));
  return new Map(
    latest.map((row) => [
      row.id,
      {
        preview: row.body.slice(0, 140),
        previewAuthor: row.author,
        lastStaff: timesById.get(row.id)?.lastStaff ?? null,
        lastMember: timesById.get(row.id)?.lastMember ?? null,
      },
    ]),
  );
}

function summarise(row: Conversation, seen: Awaited<ReturnType<typeof activity>>, side: "member" | "staff"): ThreadSummary {
  const a = seen.get(row.id);
  return {
    id: row.id,
    kind: row.kind,
    topic: row.topic,
    subject: row.subject,
    status: row.status,
    lastMessageAt: row.lastMessageAt.toISOString(),
    preview: a?.preview ?? "",
    previewAuthor: a?.previewAuthor ?? null,
    unread: side === "member" ? after(a?.lastStaff, row.memberReadAt) : after(a?.lastMember, row.staffReadAt),
  };
}

export async function getConversation(id: number) {
  const [row] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return row ?? null;
}

/** The conversation, if `owner` owns it. */
export async function getOwnedConversation(id: number, owner: Owner) {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), ownedBy(owner)))
    .limit(1);
  return row ?? null;
}

/** 1 = the next question the studio answers; null when not waiting. */
export async function queuePosition(row: Conversation) {
  if (row.kind !== "guidance" || row.status !== "waiting" || !row.waitingSince) return null;
  const [ahead] = await db
    .select({ n: count() })
    .from(conversations)
    .where(and(eq(conversations.kind, "guidance"), eq(conversations.status, "waiting"), lte(conversations.waitingSince, row.waitingSince)));
  return ahead?.n ?? 1;
}

export async function getThread(row: Conversation, locale: Locale, side: "member" | "staff"): Promise<ThreadView> {
  const [messages, seen, position] = await Promise.all([
    db.select().from(conversationMessages).where(eq(conversationMessages.conversationId, row.id)).orderBy(asc(conversationMessages.id)),
    activity([row.id]),
    queuePosition(row),
  ]);
  return { ...summarise(row, seen, side), messages: await toMessageViews(messages, locale), queuePosition: position };
}

export async function messagesAfter(conversationId: number, afterId: number, locale: Locale) {
  const rows = await db
    .select()
    .from(conversationMessages)
    .where(and(eq(conversationMessages.conversationId, conversationId), gt(conversationMessages.id, afterId)))
    .orderBy(asc(conversationMessages.id));
  return toMessageViews(rows, locale);
}

/** A member's conversations of one kind, newest activity first. */
export async function listOwnerThreads(owner: Owner, kind: ConversationKind): Promise<ThreadSummary[]> {
  const rows = await db
    .select()
    .from(conversations)
    .where(and(ownedBy(owner), eq(conversations.kind, kind)))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(50);
  const seen = await activity(rows.map((row) => row.id));
  return rows.map((row) => summarise(row, seen, "member"));
}

/** The visitor's or member's current quick-help chat (the latest one not closed). */
export async function latestAssistantConversation(owner: Owner) {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(ownedBy(owner), eq(conversations.kind, "assistant"), ne(conversations.status, "closed")))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(1);
  return row ?? null;
}

export async function createConversation(input: {
  kind: ConversationKind;
  owner: Owner;
  clientKey?: string | null;
  topic?: GuidanceTopic | null;
  subject?: string;
  status: ConversationStatus;
  locale: Locale;
}) {
  const now = new Date();
  const [row] = await db
    .insert(conversations)
    .values({
      kind: input.kind,
      userId: "userId" in input.owner ? input.owner.userId : null,
      visitorId: "visitorId" in input.owner ? input.owner.visitorId : null,
      clientKey: input.clientKey ?? null,
      topic: input.topic ?? null,
      subject: input.subject ?? "",
      status: input.status,
      waitingSince: input.status === "waiting" ? now : null,
      locale: input.locale,
      lastMessageAt: now,
      memberReadAt: now,
    })
    .returning();
  return row!;
}

export async function addMessage(input: {
  conversationId: number;
  author: MessageAuthor;
  authorId?: string | null;
  body: string;
  practiceSlug?: string | null;
  practiceAt?: number | null;
  model?: string | null;
}) {
  const [message] = await db
    .insert(conversationMessages)
    .values({
      conversationId: input.conversationId,
      author: input.author,
      authorId: input.authorId ?? null,
      body: input.body,
      practiceSlug: input.practiceSlug?.trim() ? input.practiceSlug : null,
      practiceAt: input.practiceSlug ? (input.practiceAt ?? null) : null,
      model: input.model ?? null,
    })
    .returning();
  // The writer has seen their own message.
  const read = input.author === "member" ? { memberReadAt: message!.createdAt } : input.author === "instructor" ? { staffReadAt: message!.createdAt } : {};
  await db
    .update(conversations)
    .set({ lastMessageAt: message!.createdAt, ...read })
    .where(eq(conversations.id, input.conversationId));
  return message!;
}

/**
 * Moves a conversation along. "waiting" keeps its place in the queue if it was already
 * waiting, so a follow-up doesn't send a member to the back.
 */
export async function setStatus(row: Pick<Conversation, "id" | "status">, status: ConversationStatus) {
  const waitingSince = status === "waiting" ? (row.status === "waiting" ? undefined : new Date()) : null;
  await db
    .update(conversations)
    .set({ status, ...(waitingSince === undefined ? {} : { waitingSince }) })
    .where(eq(conversations.id, row.id));
}

export async function setGuestContact(id: number, contact: { name: string; email: string }) {
  await db
    .update(conversations)
    .set({ guestName: contact.name || null, guestEmail: contact.email || null })
    .where(eq(conversations.id, id));
}

export async function markRead(id: number, side: "member" | "staff") {
  await db
    .update(conversations)
    .set(side === "member" ? { memberReadAt: new Date() } : { staffReadAt: new Date() })
    .where(eq(conversations.id, id));
}

/** Conversations with a studio or AI reply the member hasn't opened. */
export async function countUnreadForMember(userId: string, kind?: ConversationKind) {
  const [row] = await db
    .select({ n: count() })
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, userId),
        kind ? eq(conversations.kind, kind) : undefined,
        sql`exists (select 1 from ${conversationMessages} m where m."conversationId" = ${conversations.id}
          and m.author <> 'member' and m."createdAt" > coalesce(${conversations.memberReadAt}, 'epoch'::timestamptz))`,
      ),
    );
  return row?.n ?? 0;
}

/** The studio's queue: conversations waiting for a person (the sidebar badge). */
export async function countWaiting(kind?: ConversationKind) {
  try {
    const [row] = await db
      .select({ n: count() })
      .from(conversations)
      .where(and(eq(conversations.status, "waiting"), kind ? eq(conversations.kind, kind) : undefined));
    return row?.n ?? 0;
  } catch {
    return 0;
  }
}

export async function countOpenGuidance(userId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.kind, "guidance"), inArray(conversations.status, ["waiting", "answered"])));
  return row?.n ?? 0;
}

/** Member messages from this owner (or this address) since `since`, for rate limits. */
export async function countRecentMemberMessages(owner: Owner, clientKey: string | null, since: Date) {
  const [row] = await db
    .select({ n: count() })
    .from(conversationMessages)
    .innerJoin(conversations, eq(conversations.id, conversationMessages.conversationId))
    .where(
      and(
        eq(conversationMessages.author, "member"),
        gte(conversationMessages.createdAt, since),
        clientKey ? or(ownedBy(owner), eq(conversations.clientKey, clientKey)) : ownedBy(owner),
      ),
    );
  return row?.n ?? 0;
}

export async function countAiRepliesSince(since: Date) {
  const [row] = await db
    .select({ n: count() })
    .from(conversationMessages)
    .where(and(eq(conversationMessages.author, "ai"), gte(conversationMessages.createdAt, since)));
  return row?.n ?? 0;
}

export type InboxFilter = "guidance" | "assistant" | "closed";

/**
 * The studio inbox. Guidance: open threads, waiting first (oldest wait on top). Quick help:
 * chats handed to a person first, then the rest. Closed: everything closed, newest first.
 */
export async function listInbox(filter: InboxFilter, limit = 100): Promise<InboxRow[]> {
  const where =
    filter === "closed"
      ? eq(conversations.status, "closed")
      : and(eq(conversations.kind, filter), ne(conversations.status, "closed"));
  const rows = await db
    .select({ c: conversations, name: user.name, email: user.email, plan: memberships.plan })
    .from(conversations)
    .leftJoin(user, eq(user.id, conversations.userId))
    .leftJoin(memberships, eq(memberships.userId, conversations.userId))
    .where(where)
    .orderBy(
      sql`case when ${conversations.status} = 'waiting' then 0 else 1 end`,
      sql`case when ${conversations.status} = 'waiting' then ${conversations.waitingSince} end asc`,
      desc(conversations.lastMessageAt),
    )
    .limit(limit);
  const seen = await activity(rows.map((row) => row.c.id));
  return rows.map(({ c, name, email, plan }) => ({
    ...summarise(c, seen, "staff"),
    who: { name: name ?? c.guestName ?? "", email: email ?? c.guestEmail, member: !!c.userId, plan: plan ?? null },
    // A quick-help chat leaves "open" (AI only) when the visitor asks for a person.
    escalated: c.kind === "assistant" && (c.status === "waiting" || c.status === "answered"),
    waitingSince: iso(c.waitingSince),
  }));
}

/** Everyone who should hear about new questions: the studio's instructor accounts. */
export async function getStaff() {
  return db.select({ id: user.id, name: user.name, email: user.email }).from(user).where(eq(user.role, "instructor"));
}

export async function getUserContact(userId: string) {
  const [row] = await db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1);
  return row ?? null;
}
