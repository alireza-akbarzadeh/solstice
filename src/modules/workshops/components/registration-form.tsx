"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import {
  workshopRegistrationSchema,
  type WorkshopRegistrationFormValues,
} from "../schemas";
import { registerWorkshopAction } from "../actions";
import type { WorkshopRegistrationStatus } from "../types";

export function WorkshopRegistrationForm({
  pageSlug,
  isFull,
  isOpen,
  defaultName = "",
  defaultEmail = "",
}: {
  pageSlug: string;
  isFull: boolean;
  isOpen: boolean;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const t = useTranslations("Workshops");
  const locale = useLocale();
  const [submittedStatus, setSubmittedStatus] =
    useState<WorkshopRegistrationStatus | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WorkshopRegistrationFormValues>({
    resolver: zodResolver(workshopRegistrationSchema),
    defaultValues: {
      pageSlug,
      name: defaultName,
      email: defaultEmail,
      phone: "",
      notes: "",
    },
  });

  if (!isOpen) {
    return (
      <div className="bg-surface-container-low border-outline-variant/30 text-on-surface-variant rounded-2xl border p-6 text-center">
        <p className="font-body-md text-body-md">{t("registrationClosed")}</p>
      </div>
    );
  }

  if (submittedStatus) {
    const isWaitlist = submittedStatus === "waitlist";
    const calendarUrl = `/api/workshops/${pageSlug}/calendar?locale=${locale}`;

    return (
      <div className="bg-surface-container-low border-primary/20 space-y-5 rounded-3xl border p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
            {isWaitlist ? (
              <ClockIcon className="size-6" />
            ) : (
              <CheckCircle2Icon className="size-6" />
            )}
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {alreadyRegistered
                ? t("alreadyRegisteredNotice")
                : isWaitlist
                  ? t("waitlistSuccessTitle")
                  : t("registerSuccessTitle")}
            </h3>
            <p className="font-label-md text-label-md text-primary font-medium">
              {t(`status.${submittedStatus}`)}
            </p>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          {isWaitlist ? t("waitlistSuccessDesc") : t("registerSuccessDesc")}
        </p>

        {!isWaitlist && (
          <div className="pt-2">
            <a
              href={calendarUrl}
              download={`${pageSlug}-workshop.ics`}
              className="inline-flex"
            >
              <Button
                variant="outline"
                className="gap-2 rounded-full border-primary/30 hover:bg-primary/10"
              >
                <CalendarIcon className="size-4 text-primary" />
                <span>{t("addToCalendar")}</span>
              </Button>
            </a>
          </div>
        )}
      </div>
    );
  }

  const onSubmit = async (data: WorkshopRegistrationFormValues) => {
    setServerError(null);
    try {
      const res = await registerWorkshopAction(data);
      if (res.ok) {
        setSubmittedStatus(res.status);
        if (res.alreadyRegistered) {
          setAlreadyRegistered(true);
        }
      } else {
        setServerError(t("registrationClosed"));
      }
    } catch {
      setServerError("Failed to register. Please try again.");
    }
  };

  return (
    <div className="bg-surface-container-low border-outline-variant/30 relative overflow-hidden rounded-3xl border p-6 sm:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="bg-primary/10 text-primary font-label-sm text-label-sm inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium">
            <SparklesIcon className="size-3.5" />
            {t("eventBadge")}
          </span>
          {isFull && (
            <span className="bg-clay/10 text-clay font-label-sm text-label-sm inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium">
              <UsersIcon className="size-3.5" />
              {t("fullCapacity")}
            </span>
          )}
        </div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface">
          {isFull ? t("waitlistHeading") : t("registerHeading")}
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
          {isFull ? t("waitlistDescription") : t("registerDescription")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="reg-name">{t("nameLabel")}</FieldLabel>
          <Input
            id="reg-name"
            placeholder={t("namePlaceholder")}
            {...register("name")}
            aria-invalid={!!errors.name}
          />
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="reg-email">{t("emailLabel")}</FieldLabel>
          <Input
            id="reg-email"
            type="email"
            placeholder={t("emailPlaceholder")}
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor="reg-phone">{t("phoneLabel")}</FieldLabel>
          <Input
            id="reg-phone"
            type="tel"
            placeholder={t("phonePlaceholder")}
            {...register("phone")}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.notes}>
          <FieldLabel htmlFor="reg-notes">{t("notesLabel")}</FieldLabel>
          <Textarea
            id="reg-notes"
            rows={2}
            placeholder={t("notesPlaceholder")}
            {...register("notes")}
            aria-invalid={!!errors.notes}
          />
          <FieldDescription>{t("notesLabel")}</FieldDescription>
        </Field>

        {serverError && (
          <p className="text-destructive font-body-sm text-body-sm">
            {serverError}
          </p>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full gap-2 rounded-full py-3"
          >
            {isSubmitting && <Spinner className="size-4" />}
            <span>
              {isFull ? t("submitWaitlist") : t("submitRegister")}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}
