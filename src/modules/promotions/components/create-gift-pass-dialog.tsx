"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { GiftIcon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { purchaseGiftSchema, type PurchaseGiftValues } from "../schemas";
import { createStudioGiftPassAction } from "../actions";
import type { MembershipPlan } from "@/modules/memberships/plans";

export function CreateGiftPassDialog({ plans }: { plans: MembershipPlan[] }) {
  const t = useTranslations("Promotions");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PurchaseGiftValues>({
    resolver: zodResolver(purchaseGiftSchema),
    defaultValues: {
      months: 1,
      planId: plans[0]?.id ?? "monthly",
      purchaserEmail: "studio@arteyoga.com",
      purchaserName: "Arte Yoga Studio",
      recipientEmail: "",
      recipientName: "",
      personalMessage: "",
    },
  });

  const onSubmit = async (values: PurchaseGiftValues) => {
    setIsSubmitting(true);
    try {
      const res = await createStudioGiftPassAction(values);
      if (res.ok) {
        toast.success(t("giftCreatedSuccess"));
        form.reset();
        setOpen(false);
      } else {
        toast.error(t("giftCreatedError"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("giftCreatedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-secondary-fixed px-4 py-2 font-label-md text-label-md text-on-secondary-fixed transition-colors hover:bg-secondary-fixed/80"
        >
          <GiftIcon className="size-4" />
          {t("issueGiftPass")}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("issueGiftPassTitle")}</DialogTitle>
            <DialogDescription>{t("issueGiftPassDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="months" className="block font-label-sm text-label-sm text-on-surface-variant">
                  {t("duration")}
                </label>
                <select
                  id="months"
                  {...form.register("months", { valueAsNumber: true })}
                  className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
                >
                  <option value={1}>{t("months1")}</option>
                  <option value={3}>{t("months3")}</option>
                  <option value={6}>{t("months6")}</option>
                  <option value={12}>{t("months12")}</option>
                </select>
              </div>

              <div>
                <label htmlFor="planId" className="block font-label-sm text-label-sm text-on-surface-variant">
                  {t("plan")}
                </label>
                <select
                  id="planId"
                  {...form.register("planId")}
                  className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="recipientName" className="block font-label-sm text-label-sm text-on-surface-variant">
                {t("recipientName")}
              </label>
              <input
                id="recipientName"
                {...form.register("recipientName")}
                placeholder="Sarah"
                className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="recipientEmail" className="block font-label-sm text-label-sm text-on-surface-variant">
                {t("recipientEmail")} ({t("optional")})
              </label>
              <input
                id="recipientEmail"
                type="email"
                {...form.register("recipientEmail")}
                placeholder="sarah@example.com"
                className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="personalMessage" className="block font-label-sm text-label-sm text-on-surface-variant">
                {t("personalMessage")}
              </label>
              <textarea
                id="personalMessage"
                rows={3}
                {...form.register("personalMessage")}
                placeholder={t("personalMessagePlaceholder")}
                className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-on-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting && <LoaderCircleIcon className="size-4 animate-spin" />}
              {t("createGiftCard")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
