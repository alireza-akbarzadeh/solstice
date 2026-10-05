"use client";

import { ArrowUpIcon, LoaderCircleIcon, LockIcon, LockOpenIcon, MailIcon, SparklesIcon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { MESSAGE_MAX } from "../schemas";
import { pollInboxThread, replyAsStaff, setInboxStatus } from "../studio-actions";
import type { InboxRow, MessageView, ThreadView } from "../types";
import { MessageBubble } from "./message-bubble";
import { mergeMessages, usePoll } from "./use-poll";

/** The studio's view of one conversation: who it is, everything said (AI marked), and the reply box. */
export function InboxThread({ thread, who, userId, instructorName }: { thread: ThreadView; who: InboxRow["who"]; userId: string | null; instructorName: string }) {
  const t = useTranslations("Studio.inbox.thread");
  const router = useRouter();
  const [messages, setMessages] = useState<MessageView[]>(thread.messages);
  const [status, setStatus] = useState(thread.status);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  usePoll(async () => {
    const result = await pollInboxThread({ conversationId: thread.id, afterId: messages.at(-1)?.id ?? 0 });
    if (!result.ok) return;
    setStatus(result.status);
    if (result.messages.length) {
      setMessages((current) => mergeMessages(current, result.messages));
      router.refresh();
    }
  }, 10000);

  const reply = () => {
    const body = draft.trim();
    if (!body || pending) return;
    startTransition(async () => {
      const result = await replyAsStaff({ conversationId: thread.id, body });
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setDraft("");
      setMessages((current) => mergeMessages(current, result.messages));
      setStatus(result.status);
      toast.success(t(who.email ? "sentNotified" : "sent"));
      router.refresh();
    });
  };

  const move = (next: "closed" | "answered") =>
    startTransition(async () => {
      const result = await setInboxStatus({ conversationId: thread.id, status: next });
      if (result.ok) {
        setStatus(next);
        router.refresh();
      }
    });

  const closed = status === "closed";

  return (
    <div className="flex flex-col gap-space-md">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline pb-space-sm">
        <div className="min-w-0">
          <p className="font-label-sm text-label-sm tracking-wider text-clay uppercase">
            {thread.kind === "guidance" ? t("guidance") : t("assistant")}
            {thread.topic && ` · ${t(`topics.${thread.topic}`)}`}
          </p>
          <h2 className="truncate font-headline-sm text-headline-sm text-on-surface">{thread.subject || t("untitled")}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <UserRoundIcon className="size-3.5" />
              {userId ? (
                <Link href={`/instructor/members?member=${userId}`} className="underline-offset-4 hover:text-primary hover:underline">
                  {who.name || t("member")}
                </Link>
              ) : (
                who.name || t("visitor")
              )}
            </span>
            {who.email && (
              <a href={`mailto:${who.email}`} dir="ltr" className="flex items-center gap-1 hover:text-primary">
                <MailIcon className="size-3.5" />
                {who.email}
              </a>
            )}
            {who.plan && <span className="rounded bg-surface-container px-1.5 py-0.5 font-label-sm text-label-sm">{who.plan}</span>}
            {!userId && !who.email && <span className="text-error">{t("noContact")}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => move(closed ? "answered" : "closed")}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
        >
          {closed ? <LockOpenIcon className="size-3.5" /> : <LockIcon className="size-3.5" />}
          {closed ? t("reopen") : t("close")}
        </button>
      </header>

      <div className="flex max-h-[60svh] flex-col gap-space-md overflow-y-auto pe-1">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} side="staff" instructorName={instructorName} memberName={who.name} />
        ))}
        <div ref={endRef} />
      </div>

      {thread.kind === "assistant" && (
        <p className="flex items-center gap-2 font-body-sm text-body-sm text-outline">
          <SparklesIcon className="size-3.5 shrink-0" />
          {t("assistantNote")}
        </p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          reply();
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor="inbox-reply" className="font-label-md text-label-md text-on-surface-variant">
          {t("replyLabel")}
        </label>
        <textarea
          id="inbox-reply"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              reply();
            }
          }}
          rows={4}
          maxLength={MESSAGE_MAX}
          placeholder={t("replyPlaceholder")}
          className="min-h-28 w-full resize-y rounded-lg bg-surface px-4 py-3 font-body-md text-body-md outline-none placeholder:text-outline focus:ring-1 focus:ring-primary"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-body-sm text-body-sm text-outline">{t("replyHint")}</p>
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className={cn("inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-label-lg text-label-lg text-on-primary hover:bg-primary-container disabled:opacity-60")}
          >
            {pending ? <LoaderCircleIcon className="size-4 animate-spin" /> : <ArrowUpIcon className="size-4" />}
            {t("send")}
          </button>
        </div>
      </form>
    </div>
  );
}
