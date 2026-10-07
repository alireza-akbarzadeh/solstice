"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { LocalizedField } from "@/modules/instructor/components/localized-field";

import { testimonialFormSchema, type TestimonialFormValues } from "../schemas";
import { saveTestimonialAction } from "../server/actions";
import { AVATAR_PALETTE, type Testimonial } from "../types";

export function TestimonialDialog({
  open,
  onOpenChange,
  testimonial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testimonial: Testimonial | null;
  onSaved: (updated: Testimonial[]) => void;
}) {
  const t = useTranslations("Studio.testimonials");
  const [isPending, startTransition] = useTransition();

  const isEditing = !!testimonial?.id;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      id: testimonial?.id ?? "",
      name: testimonial?.name ?? { en: "", fa: "" },
      quote: testimonial?.quote ?? { en: "", fa: "" },
      roleOrMeta: testimonial?.roleOrMeta ?? { en: "", fa: "" },
      rating: testimonial?.rating ?? 5,
      avatarColor: testimonial?.avatarColor ?? "bg-secondary-fixed text-on-secondary-fixed",
      hidden: testimonial?.hidden ?? false,
      order: testimonial?.order ?? 0,
      showOn: testimonial?.showOn ?? "all",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        id: testimonial?.id ?? "",
        name: testimonial?.name ?? { en: "", fa: "" },
        quote: testimonial?.quote ?? { en: "", fa: "" },
        roleOrMeta: testimonial?.roleOrMeta ?? { en: "", fa: "" },
        rating: testimonial?.rating ?? 5,
        avatarColor: testimonial?.avatarColor ?? "bg-secondary-fixed text-on-secondary-fixed",
        hidden: testimonial?.hidden ?? false,
        order: testimonial?.order ?? 0,
        showOn: testimonial?.showOn ?? "all",
      });
    }
  }, [open, testimonial, reset]);

  const onSubmit = (data: TestimonialFormValues) => {
    startTransition(async () => {
      const result = await saveTestimonialAction(data);
      if (!result.ok) {
        toast.error(result.message ?? t("errors.saveFailed"));
        return;
      }
      toast.success(t("savedSingle"));
      onSaved(result.testimonials);
      onOpenChange(false);
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {isEditing ? t("editTestimonial") : t("addTestimonial")}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t("dialogDescription")}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="space-y-4">
            {/* Member Name */}
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <LocalizedField
                  label={t("fields.name")}
                  description={t("fields.nameHint")}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.name?.en?.message ?? errors.name?.fa?.message}
                />
              )}
            />

            {/* Quote / Reflection */}
            <Controller
              control={control}
              name="quote"
              render={({ field }) => (
                <LocalizedField
                  label={t("fields.quote")}
                  description={t("fields.quoteHint")}
                  value={field.value}
                  onChange={field.onChange}
                  multiline
                  rows={3}
                  error={errors.quote?.en?.message ?? errors.quote?.fa?.message}
                />
              )}
            />

            {/* Role / Meta */}
            <Controller
              control={control}
              name="roleOrMeta"
              render={({ field }) => (
                <LocalizedField
                  label={t("fields.roleOrMeta")}
                  description={t("fields.roleOrMetaHint")}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.roleOrMeta?.en?.message ?? errors.roleOrMeta?.fa?.message}
                />
              )}
            />

            {/* Rating */}
            <Controller
              control={control}
              name="rating"
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("fields.rating")}</FieldLabel>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => field.onChange(star)}
                        className={`p-1 transition-transform hover:scale-110 focus:outline-none ${
                          star <= field.value ? "text-clay" : "text-outline-variant/40"
                        }`}
                        title={`${star} / 5`}
                      >
                        <StarIcon className="size-6 fill-current" />
                      </button>
                    ))}
                    <span className="ms-2 font-label-md text-label-md text-on-surface-variant">
                      {field.value} / 5
                    </span>
                  </div>
                </Field>
              )}
            />

            {/* Avatar Color */}
            <Controller
              control={control}
              name="avatarColor"
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("fields.avatarColor")}</FieldLabel>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {AVATAR_PALETTE.map((pal) => {
                      const selected = field.value === pal.class;
                      return (
                        <button
                          key={pal.id}
                          type="button"
                          onClick={() => field.onChange(pal.class)}
                          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all ${
                            selected
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-outline-variant/40 hover:border-outline-variant"
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`flex size-5 items-center justify-center rounded-full font-heading font-bold text-[10px] ${pal.class}`}
                          >
                            A
                          </span>
                          <span className="font-label-sm text-on-surface">{pal.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}
            />

            {/* Display Placement */}
            <Controller
              control={control}
              name="showOn"
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("fields.placement")}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("placementOptions.all")}</SelectItem>
                      <SelectItem value="home">{t("placementOptions.home")}</SelectItem>
                      <SelectItem value="membership">{t("placementOptions.membership")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>{t("fields.placementHint")}</FieldDescription>
                </Field>
              )}
            />

            {/* Hidden Toggle */}
            <Controller
              control={control}
              name="hidden"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-4">
                  <div className="space-y-0.5">
                    <FieldLabel className="mb-0">{t("fields.hidden")}</FieldLabel>
                    <FieldDescription>{t("fields.hiddenHint")}</FieldDescription>
                  </div>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </div>

          <ResponsiveDialogFooter className="mt-6 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="size-4" data-icon="inline-start" />}
              {t("actions.save")}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
