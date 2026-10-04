"use client";

import { Undo2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

import { refundPaymentAction } from "../payment-actions";

/** Refunds the rest of one payment after a confirmation that says exactly what will happen. */
export function RefundButton({ id, amount, email }: { id: number; amount: string; email: string }) {
  const t = useTranslations("Studio.revenue.payments.refund");
  const router = useRouter();
  const [endAccess, setEndAccess] = useState(false);
  const [pending, start] = useTransition();

  const confirm = () =>
    start(async () => {
      const result = await refundPaymentAction({ id, endAccess });
      if (result.ok) {
        toast.success(t("done", { amount }));
        router.refresh();
      } else toast.error(t(`errors.${result.error}`));
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" disabled={pending}>
          <Undo2Icon data-icon="inline-start" />
          {t("action")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title", { amount })}</AlertDialogTitle>
          <AlertDialogDescription>{t("body", { email })}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-start gap-2.5">
          <Checkbox id={`refund-end-${id}`} checked={endAccess} onCheckedChange={(v) => setEndAccess(v === true)} />
          <Label htmlFor={`refund-end-${id}`} className="flex flex-col items-start gap-0.5 font-normal">
            <span>{t("endAccess")}</span>
            <span className="text-on-surface-variant text-sm">{t("endAccessHint")}</span>
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("keep")}</AlertDialogCancel>
          <AlertDialogAction onClick={confirm}>{t("confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
