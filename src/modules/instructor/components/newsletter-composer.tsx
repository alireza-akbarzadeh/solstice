"use client";

import { SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Link, useRouter } from "@/i18n/navigation";
import type { Localized } from "@/lib/localized";
import { sendNewsletter } from "@/modules/instructor/newsletter-actions";
import { newsletterIssueSchema } from "@/modules/newsletter/schemas";

import { LocalizedField } from "./localized-field";

const empty = (): Localized => ({ en: "", fa: "" });

/**
 * Writes and sends a newsletter. Each subscriber gets the version in their language (or the
 * other one when theirs is empty), with their own unsubscribe link. Sending asks first.
 */
export function NewsletterComposer({ subscribers, mailbox }: { subscribers: number; mailbox: boolean }) {
  const t = useTranslations("Studio.subscribers.compose");
  const router = useRouter();
  const [subject, setSubject] = useState(empty);
  const [body, setBody] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, start] = useTransition();

  const ask = () => {
    const parsed = newsletterIssueSchema.safeParse({ subject, body });
    if (!parsed.success) {
      setError(t(`validation.${parsed.error.issues[0]?.message === "empty" ? "empty" : "incomplete"}`));
      return;
    }
    setError(null);
    setConfirming(true);
  };

  const send = () =>
    start(async () => {
      const result = await sendNewsletter({ subject, body });
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setConfirming(false);
      setSubject(empty());
      setBody(empty());
      const counts = { sent: result.recipients, failed: result.failed };
      toast.success(result.failed ? t("sentWithFailures", counts) : result.mailbox ? t("sentToMailbox", counts) : t("sent", counts));
      router.refresh();
    });

  return (
    <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
      <div>
        <h2 className="font-headline-sm text-headline-sm">{t("title")}</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{t("lede")}</p>
      </div>
      {mailbox && (
        <p role="note" className="rounded-lg bg-secondary-fixed/50 p-3 font-body-sm text-body-sm text-on-secondary-fixed">
          {t("mailboxNote")}{" "}
          <Link href="/instructor/email" className="font-semibold underline-offset-4 hover:underline">
            {t("setUpEmail")}
          </Link>
        </p>
      )}
      <LocalizedField label={t("subject")} value={subject} onChange={setSubject} maxLength={200} />
      <LocalizedField label={t("body")} description={t("bodyHint")} value={body} onChange={setBody} multiline rows={10} maxLength={20_000} />
      {error && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="button" onClick={ask} disabled={subscribers === 0 || sending}>
          <SendIcon data-icon="inline-start" />
          {t("send", { count: subscribers })}
        </Button>
      </div>

      <ResponsiveDialog open={confirming} onOpenChange={(open) => !sending && setConfirming(open)}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t("confirmTitle", { count: subscribers })}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{mailbox ? t("confirmMailbox") : t("confirmBody")}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button type="button" variant="outline" disabled={sending} onClick={() => setConfirming(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" disabled={sending} onClick={send}>
              {sending ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
              {t("confirm")}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </section>
  );
}
