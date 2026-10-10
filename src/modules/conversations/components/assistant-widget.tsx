"use client";

import { ArrowUpIcon, LoaderCircleIcon, MessageCircleQuestionIcon, RotateCcwIcon, SparklesIcon, UserRoundIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { SocialIcon } from "@/modules/contact/components/social-icon";

import { escalateAssistant, loadAssistant, markConversationRead, pollConversation, sendAssistantMessage, startAssistantOver } from "../actions";
import { ASSISTANT_MESSAGE_MAX } from "../schemas";
import type { AiFailure, ConversationStatus, MessageView } from "../types";
import { MessageBubble } from "./message-bubble";
import { mergeMessages, usePoll } from "./use-poll";

type Notice = AiFailure | "rate" | "invalid" | null;

const suggestions = ["plans", "trial", "payment", "guidance"] as const;

/**
 * Quick help: a small chat in the corner of public and member pages, answered by the AI
 * assistant (labeled as such on every reply). "Talk to a person" hands the chat to the studio's
 * inbox; their reply shows up here and by email or push.
 */
export function AssistantWidget({
  instructorName,
  signedIn,
  unread,
  raised,
  telegramUrl = "https://t.me/solstice_yoga",
  instagramUrl = "https://instagram.com/solstice_yoga",
}: {
  instructorName: string;
  signedIn: boolean;
  unread: boolean;
  /** Sit above the test-mode panel, which takes the same corner. */
  raised: boolean;
  telegramUrl?: string;
  instagramUrl?: string;
}) {
  const t = useTranslations("Conversations.widget");
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [status, setStatus] = useState<ConversationStatus>("open");
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [handing, setHanding] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "" });
  const [contactError, setContactError] = useState(false);
  const [dot, setDot] = useState(unread);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // A reply email links here with ?chat=open.
  useEffect(() => {
    if (params.get("chat") === "open") setOpen(true);
  }, [params]);

  useEffect(() => {
    if (!open || loaded) return;
    startTransition(async () => {
      const state = await loadAssistant();
      setLoaded(true);
      if (!state.enabled && !state.thread) setNotice("off");
      if (state.thread) {
        setConversationId(state.thread.id);
        setStatus(state.thread.status);
        setMessages(state.thread.messages);
        if (state.thread.unread) await markConversationRead(state.thread.id);
      }
      setDot(false);
    });
  }, [open, loaded]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, notice, handing, pending]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Once a person is involved, replies can arrive at any time.
  const withPerson = status === "waiting" || status === "answered";
  usePoll(
    async () => {
      if (!conversationId) return;
      const last = messages.at(-1)?.id ?? 0;
      const result = await pollConversation({ conversationId, afterId: last });
      if (!result.ok) return;
      setStatus(result.status);
      if (result.messages.length) {
        setMessages((current) => mergeMessages(current, result.messages));
        if (!open) setDot(true);
      }
    },
    open ? 8000 : 30000,
    withPerson && !!conversationId,
  );

  const send = (text: string) => {
    const body = text.trim();
    if (!body || pending) return;
    setNotice(null);
    setDraft("");
    const temp: MessageView = { id: Number.MAX_SAFE_INTEGER, author: "member", body, practice: null, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, temp]);
    startTransition(async () => {
      const result = await sendAssistantMessage({ conversationId, body });
      setMessages((current) => current.filter((m) => m !== temp));
      if (!result.ok) {
        setNotice(result.error);
        setDraft(body);
        return;
      }
      setConversationId(result.conversationId);
      setStatus(result.status);
      setMessages((current) => mergeMessages(current, result.messages));
      setNotice(result.failure);
    });
  };

  const handOff = () => {
    if (!conversationId) return;
    if (!signedIn && !contact.email.trim()) {
      setContactError(true);
      return;
    }
    startTransition(async () => {
      const result = await escalateAssistant({ conversationId, name: contact.name, email: contact.email });
      if (!result.ok) {
        setContactError(result.error === "email" || result.error === "invalid");
        return;
      }
      setHanding(false);
      setNotice(null);
      setStatus("waiting");
    });
  };

  const startOver = () => {
    const id = conversationId;
    setConversationId(null);
    setMessages([]);
    setStatus("open");
    setNotice(null);
    setHanding(false);
    if (id) startTransition(() => startAssistantOver(id));
  };

  const canHandOff = !!conversationId && status === "open" && messages.some((m) => m.author === "member");

  const lift = { "--dock-lift": raised ? "3.25rem" : "0rem" } as React.CSSProperties;

  return (
    <>
      <button
        style={lift}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="assistant-panel"
        className={cn(
          "fixed end-4 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px)+0.75rem+var(--dock-lift))] z-40 flex items-center gap-2 rounded-full border border-hairline bg-surface-container-lowest/95 py-2.5 ps-3 pe-4 font-label-lg text-label-lg text-on-surface shadow-ambient backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97] lg:end-6 lg:bottom-[calc(1.5rem+var(--dock-lift))]",
          open && "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <span className="relative flex size-7 items-center justify-center rounded-full bg-primary text-on-primary">
          <MessageCircleQuestionIcon className="size-4" />
          {dot && <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-clay ring-2 ring-surface-container-lowest" />}
        </span>
        {t("launcher")}
      </button>

      <section
        style={lift}
        id="assistant-panel"
        role="dialog"
        aria-label={t("title")}
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "fixed end-4 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px)+0.75rem+var(--dock-lift))] z-50 flex h-[min(38rem,calc(100svh-9rem))] w-[min(24rem,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-ambient transition-[opacity,transform] duration-200 ease-out rtl:origin-bottom-left lg:end-6 lg:bottom-[calc(1.5rem+var(--dock-lift))]",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
        )}
      >
        <header className="flex items-start gap-3 border-b border-hairline bg-surface-container-low px-4 py-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary ring-1 ring-primary/30">
            <SparklesIcon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-label-lg text-label-lg text-on-surface">{t("title")}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{withPerson ? t("subtitlePerson", { name: instructorName }) : t("subtitle")}</p>
          </div>
          {conversationId && status !== "waiting" && (
            <button type="button" onClick={startOver} aria-label={t("newChat")} title={t("newChat")} className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-primary">
              <RotateCcwIcon className="size-4" />
            </button>
          )}
          <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-primary">
            <XIcon className="size-4" />
          </button>
        </header>

        <div ref={listRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4" aria-live="polite">
          {!messages.length && (
            <div className="flex flex-col gap-3">
              <p className="rounded-xl bg-surface-container-low px-4 py-3 font-body-sm text-body-sm text-on-surface-variant">{t("intro")}</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((key) => (
                  <button
                    key={key}
                    type="button"
                    disabled={pending || notice === "off"}
                    onClick={() => send(t(`suggestions.${key}`))}
                    className="rounded-md border border-hairline bg-surface-container-lowest px-3 py-1.5 text-start font-body-sm text-body-sm text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                  >
                    {t(`suggestions.${key}`)}
                  </button>
                ))}
              </div>

              {(telegramUrl || instagramUrl) && (
                <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface-container-low/70 p-3">
                  <span className="font-label-sm text-label-sm font-medium text-clay">
                    {t("directChannels")}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {telegramUrl && (
                      <a
                        href={telegramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-container-lowest px-2.5 py-1.5 font-label-sm text-label-sm text-on-surface transition-colors hover:border-[#229ED9]/50 hover:text-[#229ED9]"
                      >
                        <SocialIcon network="telegram" className="size-3.5 text-[#229ED9]" />
                        <span>{t("telegram")}</span>
                      </a>
                    )}
                    {instagramUrl && (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-container-lowest px-2.5 py-1.5 font-label-sm text-label-sm text-on-surface transition-colors hover:border-[#E1306C]/50 hover:text-[#E1306C]"
                      >
                        <SocialIcon network="instagram" className="size-3.5 text-[#E1306C]" />
                        <span>{t("instagram")}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} side="member" instructorName={instructorName} compact />
          ))}

          {pending && status === "open" && messages.at(-1)?.author === "member" && (
            <p className="flex items-center gap-2 font-body-sm text-body-sm text-outline">
              <LoaderCircleIcon className="size-4 animate-spin" />
              {t("thinking")}
            </p>
          )}

          {notice && (
            <div role="status" className="rounded-xl bg-secondary-fixed/60 px-4 py-3 font-body-sm text-body-sm text-on-secondary-fixed">
              {t(`notices.${notice}`)}
            </div>
          )}

          {status === "waiting" && (
            <div role="status" className="flex gap-2 rounded-xl bg-primary-fixed/40 px-4 py-3 font-body-sm text-body-sm text-on-primary-fixed">
              <UserRoundIcon className="mt-0.5 size-4 shrink-0" />
              {t(signedIn ? "handedOffMember" : "handedOffVisitor", { name: instructorName })}
            </div>
          )}

          {handing && (
            <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface-container-lowest p-3">
              <p className="font-body-sm text-body-sm text-on-surface">{t(signedIn ? "handOffConfirm" : "handOffAsk", { name: instructorName })}</p>
              {!signedIn && (
                <>
                  <input
                    value={contact.name}
                    onChange={(event) => setContact((c) => ({ ...c, name: event.target.value }))}
                    placeholder={t("namePlaceholder")}
                    autoComplete="name"
                    className="h-10 rounded-md bg-surface-container-high px-3 font-body-sm text-body-sm outline-none focus:bg-surface focus:ring-1 focus:ring-primary"
                  />
                  <input
                    value={contact.email}
                    onChange={(event) => {
                      setContact((c) => ({ ...c, email: event.target.value }));
                      setContactError(false);
                    }}
                    type="email"
                    dir="ltr"
                    placeholder={t("emailPlaceholder")}
                    autoComplete="email"
                    aria-invalid={contactError || undefined}
                    className="h-10 rounded-md bg-surface-container-high px-3 font-body-sm text-body-sm outline-none focus:bg-surface focus:ring-1 focus:ring-primary aria-invalid:ring-1 aria-invalid:ring-error"
                  />
                  {contactError && <p className="font-body-sm text-body-sm text-error">{t("emailRequired")}</p>}
                </>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handOff}
                  disabled={pending}
                  className="rounded-md bg-primary px-4 py-2 font-label-md text-label-md text-on-primary hover:bg-primary-container disabled:opacity-70"
                >
                  {t("handOffSend")}
                </button>
                <button type="button" onClick={() => setHanding(false)} className="rounded-md px-3 py-2 font-label-md text-label-md text-on-surface-variant hover:text-primary">
                  {t("cancel")}
                </button>
              </div>
              {(telegramUrl || instagramUrl) && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-hairline/60">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{t("directChannels")}</span>
                  {telegramUrl && (
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-label-sm text-label-sm text-[#229ED9] hover:underline"
                    >
                      <SocialIcon network="telegram" className="size-3" />
                      <span>{t("telegram")}</span>
                    </a>
                  )}
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-label-sm text-label-sm text-[#E1306C] hover:underline"
                    >
                      <SocialIcon network="instagram" className="size-3" />
                      <span>{t("instagram")}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="border-t border-hairline bg-surface-container-low px-3 pt-2 pb-3">
          {canHandOff && !handing && (
            <button type="button" onClick={() => setHanding(true)} className="mb-2 flex items-center gap-1.5 px-1 font-label-md text-label-md text-primary underline-offset-4 hover:underline">
              <UserRoundIcon className="size-3.5" />
              {t("handOff")}
            </button>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
            className="flex items-end gap-2"
          >
            <label htmlFor="assistant-input" className="sr-only">
              {t("inputLabel")}
            </label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send(draft);
                }
              }}
              rows={1}
              maxLength={ASSISTANT_MESSAGE_MAX}
              disabled={notice === "off" && status === "open"}
              placeholder={withPerson ? t("placeholderPerson") : t("placeholder")}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-lg bg-surface-container-highest px-3 py-2.5 font-body-sm text-body-sm outline-none [field-sizing:content] placeholder:text-outline focus:bg-surface focus:ring-1 focus:ring-primary disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={pending || !draft.trim()}
              aria-label={t("send")}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50"
            >
              {pending ? <LoaderCircleIcon className="size-4 animate-spin" /> : <ArrowUpIcon className="size-4" />}
            </button>
          </form>
          <p className="mt-2 px-1 font-label-sm text-label-sm text-outline">{t("disclaimer")}</p>
        </footer>
      </section>
    </>
  );
}
