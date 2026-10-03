"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BellIcon, PinIcon, SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { REFLECTION_MAX_LENGTH } from "@/modules/community/schemas";
import { publishAnnouncement } from "@/modules/instructor/actions";
import { announcementSchema, type AnnouncementValues } from "@/modules/instructor/schemas";

/**
 * Writes a circle post as the studio. Pinning it makes it the week's intention on
 * /community; the push switch only appears when Web Push is configured.
 */
export function AnnouncementComposer({ canPush }: { canPush: boolean }) {
  const t = useTranslations("Studio.posts.composer");
  const form = useForm<AnnouncementValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { body: "", pinned: true, notify: false },
  });
  const body = form.watch("body");
  const saving = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    const notify = values.notify && canPush;
    const result = await publishAnnouncement({ ...values, notify });
    if (!result.ok) {
      toast.error(t("error"));
      return;
    }
    const sent = Number(result.message ?? "0");
    toast.success(notify ? t("postedAndSent", { count: sent }) : t("posted"));
    form.reset({ body: "", pinned: values.pinned, notify: false });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
      <div>
        <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("eyebrow")}</span>
        <h2 className="mt-1 font-headline-sm text-headline-sm text-on-surface">{t("title")}</h2>
      </div>

      <FieldGroup>
        <Controller
          control={form.control}
          name="body"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="announcement">{t("label")}</FieldLabel>
              <Textarea
                {...field}
                id="announcement"
                dir="auto"
                rows={5}
                maxLength={REFLECTION_MAX_LENGTH}
                placeholder={t("placeholder")}
                aria-invalid={fieldState.invalid || undefined}
              />
              <FieldDescription>{t("remaining", { count: REFLECTION_MAX_LENGTH - field.value.length })}</FieldDescription>
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="pinned"
          render={({ field }) => (
            <Field orientation="horizontal" className="rounded-lg bg-surface p-space-sm shadow-sm">
              <PinIcon className="mt-0.5 size-4 shrink-0 self-start text-clay" />
              <FieldContent>
                <FieldLabel htmlFor="announcement-pin">{t("pin")}</FieldLabel>
                <FieldDescription>{t("pinHint")}</FieldDescription>
              </FieldContent>
              <Switch id="announcement-pin" checked={field.value} onCheckedChange={field.onChange} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="notify"
          render={({ field }) => (
            <Field orientation="horizontal" data-disabled={!canPush || undefined} className="rounded-lg bg-surface p-space-sm shadow-sm">
              <BellIcon className="mt-0.5 size-4 shrink-0 self-start text-clay" />
              <FieldContent>
                <FieldLabel htmlFor="announcement-notify">{t("notify")}</FieldLabel>
                <FieldDescription>{canPush ? t("notifyHint") : t("notifyOff")}</FieldDescription>
              </FieldContent>
              <Switch id="announcement-notify" checked={field.value && canPush} onCheckedChange={field.onChange} disabled={!canPush} />
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving || body.trim().length === 0}>
          {saving ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
          {t("publish")}
        </Button>
      </div>
    </form>
  );
}
