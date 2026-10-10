"use client";

import { CheckIcon, HeartIcon, SendIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { sendManualNudgeAction } from "@/modules/reminders/actions";

export function SendNudgeButton({
  memberId,
  memberName,
  lastReminderAt,
  canRemind: _canRemind,
}: {
  memberId: string;
  memberName: string;
  lastReminderAt?: Date | string | null;
  canRemind?: boolean;
}) {
  const t = useTranslations("Reminders.studio");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    startTransition(async () => {
      try {
        const res = await sendManualNudgeAction({
          userId: memberId,
          customMessage: message.trim() || undefined,
        });

        if (res.ok) {
          setIsSent(true);
          toast.success(t("sentSuccess", { name: memberName }));
          setOpen(false);
        } else if (res.error === "cooldown") {
          toast.error(t("errors.cooldown"));
        } else if (res.error === "notFound") {
          toast.error(t("errors.notFound"));
        } else {
          toast.error(t("errors.generic"));
        }
      } catch {
        toast.error(t("errors.generic"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-full border-outline-variant/30 text-xs text-on-surface hover:bg-surface-container-high"
        >
          {isSent ? (
            <>
              <CheckIcon className="size-3.5 text-primary" />
              <span>{t("nudged")}</span>
            </>
          ) : (
            <>
              <HeartIcon className="size-3.5 text-clay" />
              <span>{t("sendNudge")}</span>
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            <span>{t("dialogTitle", { name: memberName })}</span>
          </DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {lastReminderAt && (
            <p className="rounded-lg bg-surface-container px-3 py-2 text-xs text-on-surface-variant">
              {t("lastReminded", {
                date: new Date(lastReminderAt).toLocaleDateString(),
              })}
            </p>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="custom-nudge-note"
              className="text-xs font-medium text-on-surface"
            >
              {t("optionalNoteLabel")}
            </label>
            <Textarea
              id="custom-nudge-note"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("optionalNotePlaceholder")}
              rows={3}
              maxLength={300}
            />
            <p className="text-[11px] text-on-surface-variant">
              {t("leaveEmptyForDefault")}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Spinner className="size-4" />
            ) : (
              <SendIcon className="size-3.5" />
            )}
            <span>{t("confirmSend")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
