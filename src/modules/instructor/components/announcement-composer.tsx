"use client";

import { BellIcon, LoaderCircleIcon, PinIcon, SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { REFLECTION_MAX_LENGTH } from "@/modules/community/schemas";
import { publishAnnouncement } from "@/modules/instructor/actions";

/**
 * Writes a circle post as the studio. Pinning it makes it the week's intention on
 * /community; the push switch only appears when Web Push is configured.
 */
export function AnnouncementComposer({ canPush }: { canPush: boolean }) {
  const t = useTranslations("Studio.posts.composer");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(true);
  const [notify, setNotify] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const result = await publishAnnouncement({ body, pinned, notify: notify && canPush });
      if (!result.ok) {
        toast.error(t("error"));
        return;
      }
      const sent = Number(result.message ?? "0");
      toast.success(notify && canPush ? t("postedAndSent", { count: sent }) : t("posted"));
      setBody("");
      setNotify(false);
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
      <div>
        <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("eyebrow")}</span>
        <h2 className="mt-1 font-headline-sm text-headline-sm text-on-surface">{t("title")}</h2>
      </div>

      <Field>
        <FieldLabel htmlFor="announcement">{t("label")}</FieldLabel>
        <Textarea
          id="announcement"
          dir="auto"
          rows={5}
          value={body}
          maxLength={REFLECTION_MAX_LENGTH}
          placeholder={t("placeholder")}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        <FieldDescription>{t("remaining", { count: REFLECTION_MAX_LENGTH - body.length })}</FieldDescription>
      </Field>

      <div className="flex flex-col gap-space-sm">
        <label className="flex items-start justify-between gap-3 rounded-lg bg-surface p-space-sm shadow-sm">
          <span className="flex min-w-0 items-start gap-2.5">
            <PinIcon className="mt-0.5 size-4 shrink-0 text-clay" />
            <span className="min-w-0">
              <span className="block font-label-md text-label-md text-on-surface">{t("pin")}</span>
              <span className="block font-body-sm text-body-sm text-on-surface-variant">{t("pinHint")}</span>
            </span>
          </span>
          <Switch checked={pinned} onCheckedChange={setPinned} aria-label={t("pin")} />
        </label>

        <label className="flex items-start justify-between gap-3 rounded-lg bg-surface p-space-sm shadow-sm has-disabled:opacity-60">
          <span className="flex min-w-0 items-start gap-2.5">
            <BellIcon className="mt-0.5 size-4 shrink-0 text-clay" />
            <span className="min-w-0">
              <span className="block font-label-md text-label-md text-on-surface">{t("notify")}</span>
              <span className="block font-body-sm text-body-sm text-on-surface-variant">{canPush ? t("notifyHint") : t("notifyOff")}</span>
            </span>
          </span>
          <Switch checked={notify && canPush} onCheckedChange={setNotify} disabled={!canPush} aria-label={t("notify")} />
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending || body.trim().length === 0}>
          {pending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SendIcon data-icon="inline-start" />}
          {t("publish")}
        </Button>
      </div>
    </form>
  );
}
