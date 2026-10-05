"use client";

import { ArrowUpIcon, ClapperboardIcon, LoaderCircleIcon, PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { cn } from "@/lib/utils";

import { MESSAGE_MAX } from "../schemas";

export type ComposerValues = { body: string; practiceSlug: string; practiceAt: string };

const tags = ["joints", "props", "breath", "recovery"] as const;
const NONE = "none";

/**
 * Writing to the instructor: free text, a few quick tags from the Stitch composer, and an
 * optional practice moment ("Solar Flow at 14:22") so the instructor can watch what you mean.
 */
export function GuidanceComposer({
  practices,
  pending,
  onSend,
  instructorName,
  autoFocus = false,
}: {
  practices: { slug: string; title: string }[];
  pending: boolean;
  onSend: (values: ComposerValues) => Promise<boolean>;
  instructorName: string;
  autoFocus?: boolean;
}) {
  const t = useTranslations("Conversations.guidance.composer");
  const [body, setBody] = useState("");
  const [linking, setLinking] = useState(false);
  const [practiceSlug, setPracticeSlug] = useState(NONE);
  const [practiceAt, setPracticeAt] = useState("");
  const [momentError, setMomentError] = useState(false);

  const addTag = (tag: string) => setBody((current) => (current.trim() ? `${current.trimEnd()}\n${tag}: ` : `${tag}: `));

  const submit = async () => {
    if (!body.trim() || pending) return;
    if (practiceAt.trim() && !/^\d{1,2}(:\d{1,2}){1,2}$/.test(practiceAt.trim())) {
      setMomentError(true);
      return;
    }
    const linked = linking && practiceSlug !== NONE;
    const sent = await onSend({ body, practiceSlug: linked ? practiceSlug : "", practiceAt: linked ? practiceAt : "" });
    if (sent) {
      setBody("");
      setLinking(false);
      setPracticeSlug(NONE);
      setPracticeAt("");
    }
  };

  return (
    <div className="flex flex-col gap-space-sm rounded-xl border border-hairline bg-surface-container-lowest p-space-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-label-md text-label-md text-on-surface-variant">{t("heading", { name: instructorName })}</p>
        <p className="font-label-sm text-label-sm text-outline">{t("personal", { name: instructorName })}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => addTag(t(`tags.${key}`))}
            className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
          >
            <PlusIcon className="size-3" />
            {t(`tags.${key}`)}
          </button>
        ))}
      </div>
      <label htmlFor="guidance-body" className="sr-only">
        {t("label")}
      </label>
      <textarea
        id="guidance-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void submit();
          }
        }}
        autoFocus={autoFocus}
        rows={4}
        maxLength={MESSAGE_MAX}
        placeholder={t("placeholder")}
        className="min-h-28 w-full resize-y rounded-lg bg-surface-container-low px-4 py-3 font-body-md text-body-md outline-none placeholder:text-outline focus:bg-surface focus:ring-1 focus:ring-primary"
      />

      {linking ? (
        <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-3 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">{t("practice")}</span>
            <ResponsiveSelect
              id="guidance-practice"
              label={t("practice")}
              value={practiceSlug}
              onValueChange={setPracticeSlug}
              className="w-full"
              options={[{ value: NONE, label: t("choosePractice") }, ...practices.map((p) => ({ value: p.slug, label: p.title }))]}
            />
          </div>
          <div className="flex flex-col gap-1 sm:w-28">
            <label htmlFor="guidance-moment" className="font-label-sm text-label-sm text-on-surface-variant">
              {t("moment")}
            </label>
            <input
              id="guidance-moment"
              value={practiceAt}
              onChange={(event) => {
                setPracticeAt(event.target.value);
                setMomentError(false);
              }}
              dir="ltr"
              inputMode="numeric"
              placeholder="14:22"
              aria-invalid={momentError || undefined}
              className="h-10 rounded-md bg-surface px-3 font-body-sm text-body-sm tabular-nums outline-none focus:ring-1 focus:ring-primary aria-invalid:ring-1 aria-invalid:ring-error"
            />
          </div>
          <button
            type="button"
            onClick={() => setLinking(false)}
            aria-label={t("removePractice")}
            className="self-end rounded-md p-2 text-on-surface-variant hover:bg-surface hover:text-primary"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ) : null}
      {momentError && <p className="font-body-sm text-body-sm text-error">{t("momentError")}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {!linking && practices.length > 0 ? (
          <button
            type="button"
            onClick={() => setLinking(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ClapperboardIcon className="size-3.5" />
            {t("linkPractice")}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={pending || !body.trim()}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:opacity-60",
          )}
        >
          {pending ? <LoaderCircleIcon className="size-4 animate-spin" /> : <ArrowUpIcon className="size-4" />}
          {t("send")}
        </button>
      </div>
    </div>
  );
}
