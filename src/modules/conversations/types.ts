// What the chat screens receive: plain, serialisable views shared by the member, visitor and
// studio sides. Dates travel as ISO strings.

export type ConversationKind = "guidance" | "assistant";
export type ConversationStatus = "open" | "waiting" | "answered" | "closed";
export type GuidanceTopic = "path" | "practice";
/** Who wrote a message. AI messages are always shown as AI. */
export type MessageAuthor = "member" | "instructor" | "ai";

export type MessageView = {
  id: number;
  author: MessageAuthor;
  body: string;
  /** A practice moment the message points to. */
  practice: { slug: string; title: string; at: number | null } | null;
  createdAt: string;
};

export type ThreadSummary = {
  id: number;
  kind: ConversationKind;
  topic: GuidanceTopic | null;
  subject: string;
  status: ConversationStatus;
  lastMessageAt: string;
  /** The latest message, shortened, and who wrote it. */
  preview: string;
  previewAuthor: MessageAuthor | null;
  unread: boolean;
};

export type ThreadView = ThreadSummary & {
  messages: MessageView[];
  /** Place in the studio's queue while waiting (1 = next), else null. */
  queuePosition: number | null;
};

/** A conversation as the studio inbox lists it. */
export type InboxRow = ThreadSummary & {
  who: { name: string; email: string | null; member: boolean; plan: string | null };
  /** Quick-help chats the visitor handed to a person. */
  escalated: boolean;
  waitingSince: string | null;
};

/** The places on each plan with guidance, for the inbox header and the plan cards. */
export type GuidancePlaces = { planId: string; name: string; places: number; used: number; waitlist: number };

export type AiFailure = "off" | "quota" | "auth" | "blocked" | "unavailable" | "limit";
