"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
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
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary/90"
        >
          <PlusIcon className="size-4" />
          {t("createCoupon")}
        </button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t("createCouponTitle")}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{t("createCouponDesc")}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="discountType" className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  {t("discountType")}
                </label>
                <ResponsiveSelect
                  label={t("discountType")}
                  value={form.watch("discountType")}
                  onValueChange={(val) => form.setValue("discountType", val as "percent" | "fixed")}
                  options={[
                    { value: "percent", label: t("percentDiscount") },
                    { value: "fixed", label: t("fixedDiscount") },
                  ]}
                />
              </div>

              <div>
                <label htmlFor="discountValue" className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  {t("discountValue")}
                </label>
                <input
                  id="discountValue"
                  type="number"
                  step="any"
                  {...form.register("discountValue")}
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-hidden"
                />
                {form.formState.errors.discountValue && (
                  <p className="mt-1 font-body-sm text-body-sm text-error">
                    {form.formState.errors.discountValue.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="duration" className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  {t("duration")}
                </label>
                <ResponsiveSelect
                  label={t("duration")}
                  value={form.watch("duration")}
                  onValueChange={(val) => form.setValue("duration", val as "once" | "repeating")}
                  options={[
                    { value: "once", label: t("durationOnce") },
                    { value: "repeating", label: t("durationRepeating") },
                  ]}
                />
              </div>

              <div>
                <label htmlFor="planId" className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  {t("planRestriction")}
                </label>
                <ResponsiveSelect
                  label={t("planRestriction")}
                  value={form.watch("planId") ?? ""}
                  onValueChange={(val) => form.setValue("planId", val)}
                  options={[
                    { value: "", label: t("allPlans") },
                    ...plans.map((p) => ({
                      value: p.id,
                      label: p.id,
                    })),
                  ]}
                />
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

          <ResponsiveDialogFooter className="mt-4">
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
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
