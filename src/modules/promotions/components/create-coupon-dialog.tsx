"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";
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
import { couponFormSchema, type CouponFormValues } from "../schemas";
import { createCouponAction } from "../actions";
import type { MembershipPlan } from "@/modules/memberships/plans";

export function CreateCouponDialog({ plans }: { plans: MembershipPlan[] }) {
  const t = useTranslations("Promotions");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      discountType: "percent",
      discountValue: 20,
      duration: "once",
      planId: "",
      maxUses: null,
      expiresAt: "",
      active: true,
      description: "",
    },
  });

  const onSubmit = async (values: CouponFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await createCouponAction(values);
      if (res.ok) {
        toast.success(t("couponCreatedSuccess"));
        form.reset();
        setOpen(false);
      } else {
        toast.error(t("couponCreatedError"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("couponCreatedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary/90"
        >
          <PlusIcon className="size-4" />
          {t("createCoupon")}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("createCouponTitle")}</DialogTitle>
            <DialogDescription>{t("createCouponDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label htmlFor="code" className="block font-label-sm text-label-sm text-on-surface-variant">
                {t("couponCodeLabel")}
              </label>
              <input
                id="code"
                {...form.register("code")}
                placeholder="WELCOME20"
                className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-label-md text-label-md uppercase tracking-wider text-on-surface focus:border-primary focus:outline-hidden"
              />
              {form.formState.errors.code && (
                <p className="mt-1 font-body-sm text-body-sm text-error">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="discountType" className="block font-label-sm text-label-sm text-on-surface-variant">
                  {t("discountType")}
                </label>
                <select
                  id="discountType"
                  {...form.register("discountType")}
                  className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
                >
                  <option value="percent">{t("percentDiscount")}</option>
                  <option value="fixed">{t("fixedDiscount")}</option>
                </select>
              </div>

              <div>
                <label htmlFor="discountValue" className="block font-label-sm text-label-sm text-on-surface-variant">
                  {t("discountValue")}
                </label>
                <input
                  id="discountValue"
                  type="number"
                  step="any"
                  {...form.register("discountValue")}
                  className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
                />
                {form.formState.errors.discountValue && (
                  <p className="mt-1 font-body-sm text-body-sm text-error">
                    {form.formState.errors.discountValue.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="duration" className="block font-label-sm text-label-sm text-on-surface-variant">
                  {t("duration")}
                </label>
                <select
                  id="duration"
                  {...form.register("duration")}
                  className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
                >
                  <option value="once">{t("durationOnce")}</option>
                  <option value="repeating">{t("durationRepeating")}</option>
                </select>
              </div>

              <div>
                <label htmlFor="planId" className="block font-label-sm text-label-sm text-on-surface-variant">
                  {t("planRestriction")}
                </label>
                <select
                  id="planId"
                  {...form.register("planId")}
                  className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
                >
                  <option value="">{t("allPlans")}</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="maxUses" className="block font-label-sm text-label-sm text-on-surface-variant">
                  {t("maxUses")}
                </label>
                <input
                  id="maxUses"
                  type="number"
                  placeholder={t("unlimited")}
                  {...form.register("maxUses")}
                  className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="expiresAt" className="block font-label-sm text-label-sm text-on-surface-variant">
                  {t("expiresAt")}
                </label>
                <input
                  id="expiresAt"
                  type="date"
                  {...form.register("expiresAt")}
                  className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block font-label-sm text-label-sm text-on-surface-variant">
                {t("notes")}
              </label>
              <input
                id="description"
                {...form.register("description")}
                placeholder={t("notesPlaceholder")}
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
              {t("saveCoupon")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
