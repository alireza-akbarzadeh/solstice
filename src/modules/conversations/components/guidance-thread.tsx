"use client";

import { CheckCircle2Icon, HourglassIcon, LockIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { closeGuidanceThread, markConversationRead, pollConversation, sendGuidanceMessage, startGuidanceThread, type GuidanceResult } from "../actions";
import type { ConversationStatus, GuidanceTopic, MessageView, ThreadView } from "../types";
import { GuidanceComposer, type ComposerValues } from "./guidance-composer";
import { INSTRUCTOR_IMAGE, MessageBubble } from "./message-bubble";
import { mergeMessages, usePoll } from "./use-poll";

type Shared = {
  practices: { slug: string; title: string }[];
  instructorName: string;
  replyHours: number;
};

function useResultToast() {
  const t = useTranslations("Conversations.guidance.errors");
  const tAi = useTranslations("Conversations.widget.notices");
  return (result: GuidanceResult) => {
    if (!result.ok) {
      toast.error(t(result.error));
      return false;
    }
    if (result.failure && result.failure !== "off") toast.message(tAi(result.failure));
    return true;
  };
}

function StatusLine({ status, queuePosition, instructorName, replyHours }: { status: ConversationStatus; queuePosition: number | null } & Omit<Shared, "practices">) {
  const t = useTranslations("Conversations.guidance.status");
  if (status === "waiting")
    return (
      <p role="status" className="flex items-center gap-2 rounded-lg bg-secondary-fixed/50 px-4 py-2.5 font-body-sm text-body-sm text-on-secondary-fixed">
        <HourglassIcon className="size-4 shrink-0" />
        {queuePosition ? t("waitingPosition", { position: queuePosition, name: instructorName, hours: replyHours }) : t("waiting", { name: instructorName, hours: replyHours })}
      </p>
    );
  if (status === "closed")
    return (
      <p className="flex items-center gap-2 rounded-lg bg-surface-container px-4 py-2.5 font-body-sm text-body-sm text-on-surface-variant">
        <LockIcon className="size-4 shrink-0" />
        {t("closed")}
      </p>
    );
  return (
    <p className="flex items-center gap-2 rounded-lg bg-primary-fixed/40 px-4 py-2.5 font-body-sm text-body-sm text-on-primary-fixed">
      <CheckCircle2Icon className="size-4 shrink-0" />
      {t("answered", { name: instructorName })}
    </p>
  );
}

/** One guidance thread: its messages (refreshed while open), where it stands, and the reply box. */
export function GuidanceThread({ thread, memberName, ...shared }: Shared & { thread: ThreadView; memberName: string }) {
  const t = useTranslations("Conversations.guidance");
  const router = useRouter();
  const done = useResultToast();
  const [messages, setMessages] = useState<MessageView[]>(thread.messages);
  const [status, setStatus] = useState(thread.status);
  const [position, setPosition] = useState(thread.queuePosition);
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thread.unread) void markConversationRead(thread.id);
  }, [thread.id, thread.unread]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages.length]);

  usePoll(async () => {
    const result = await pollConversation({ conversationId: thread.id, afterId: messages.at(-1)?.id ?? 0 });
    if (!result.ok) return;
    setStatus(result.status);
    setPosition(result.queuePosition);
    if (result.messages.length) {
      setMessages((current) => mergeMessages(current, result.messages));
      router.refresh();
    }
  }, 10000);

  const send = (values: ComposerValues) =>
    new Promise<boolean>((resolve) =>
      startTransition(async () => {
        const result = await sendGuidanceMessage({ conversationId: thread.id, ...values });
        const ok = done(result);
        if (result.ok) {
          setMessages((current) => mergeMessages(current, result.messages));
          setStatus(result.status);
          setPosition(result.queuePosition);
          router.refresh();
        }
        resolve(ok);
      }),
    );

  const close = () =>
    startTransition(async () => {
      await closeGuidanceThread(thread.id);
      setStatus("closed");
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-space-md">
      <header className="flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-surface-container-lowest px-4 py-3 shadow-sm">
        <Image src={INSTRUCTOR_IMAGE} alt="" width={44} height={44} className="size-11 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-headline-sm text-headline-sm text-on-surface">{thread.subject}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {thread.topic ? t(`topics.${thread.topic}.title`) : null} · {t("threadId", { id: thread.id })}
          </p>
        </div>
        {status !== "closed" && (
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="rounded-md border border-hairline px-3 py-1.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
          >
            {t("close")}
          </button>
        )}
      </header>

      <div className="flex flex-col gap-space-md">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} side="member" instructorName={shared.instructorName} memberName={memberName} />
        ))}
        <div ref={endRef} />
      </div>

      {messages.some((m) => m.author === "ai") && (
        <p className="flex items-center gap-2 font-body-sm text-body-sm text-outline">
          <SparklesIcon className="size-3.5 shrink-0" />
          {t("aiNote", { name: shared.instructorName })}
        </p>
      )}

      <StatusLine status={status} queuePosition={position} instructorName={shared.instructorName} replyHours={shared.replyHours} />

      <GuidanceComposer practices={shared.practices} pending={pending} onSend={send} instructorName={shared.instructorName} />
    </div>
  );
}

/** Starting a thread: choose the topic (the Stitch tabs), name it, write. */
export function NewGuidanceThread({ initialTopic, initialSubject, ...shared }: Shared & { initialTopic: GuidanceTopic; initialSubject: string }) {
  const t = useTranslations("Conversations.guidance");
  const router = useRouter();
  const done = useResultToast();
  const [topic, setTopic] = useState<GuidanceTopic>(initialTopic);
  const [subject, setSubject] = useState(initialSubject);
  const [subjectError, setSubjectError] = useState(false);
  const [pending, startTransition] = useTransition();

  const send = (values: ComposerValues) => {
    if (!subject.trim()) {
      setSubjectError(true);
      return Promise.resolve(false);
    }
    return new Promise<boolean>((resolve) =>
      startTransition(async () => {
        const result = await startGuidanceThread({ topic, subject, ...values });
        const ok = done(result);
        if (result.ok) router.push(`/guidance?c=${result.conversationId}`);
        resolve(ok);
      }),
    );
  };

  return (
    <div className="flex flex-col gap-space-md">
      <div role="radiogroup" aria-label={t("topicLabel")} className="grid grid-cols-1 gap-2 rounded-xl bg-surface-container-low p-1.5 sm:grid-cols-2">
        {(["path", "practice"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={topic === key}
            onClick={() => setTopic(key)}
            className={cn(
              "flex flex-col items-start rounded-lg px-4 py-3 text-start transition-colors",
              topic === key ? "bg-surface-container-lowest shadow-sm" : "hover:bg-surface-container",
            )}
          >
            <span className={cn("font-label-lg text-label-lg", topic === key ? "text-primary" : "text-on-surface")}>{t(`topics.${key}.title`)}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">{t(`topics.${key}.hint`)}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="guidance-subject" className="font-label-md text-label-md text-on-surface-variant">
          {t("subject")}
        </label>
        <input
          id="guidance-subject"
          value={subject}
          onChange={(event) => {
            setSubject(event.target.value);
            setSubjectError(false);
          }}
          maxLength={120}
          placeholder={t("subjectPlaceholder")}
          aria-invalid={subjectError || undefined}
          className="h-12 rounded-lg bg-surface-container-high px-4 font-body-md text-body-md outline-none placeholder:text-outline focus:bg-surface focus:ring-1 focus:ring-primary aria-invalid:ring-1 aria-invalid:ring-error"
        />
        {subjectError && <p className="font-body-sm text-body-sm text-error">{t("subjectRequired")}</p>}
      </div>

      <GuidanceComposer practices={shared.practices} pending={pending} onSend={send} instructorName={shared.instructorName} autoFocus={!!initialSubject} />
    </div>
  );
}
