"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon, MoonIcon, SunriseIcon, WindIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { PasswordField } from "@/modules/auth/components/password-field";
import { validationKey } from "@/modules/auth/schemas";
import { authClient } from "@/server/better-auth/client";

import { updateProfile } from "../actions";
import {
  changePasswordSchema,
  deleteAccountSchema,
  profileSchema,
  type ChangePasswordValues,
  type DeleteAccountValues,
  type ProfileValues,
} from "../schemas";
import { type PracticeRhythm, practiceRhythms } from "../types";

const rhythmIcons = { morning: SunriseIcon, evening: MoonIcon, breath: WindIcon };

const field = "block space-y-1.5";
const labelClass = "font-label-md text-label-md text-on-surface";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container disabled:opacity-70";

/** Translates a schema message (an `Auth.validation` key) for display under a field. */
function useValidationMessage() {
  const t = useTranslations("Auth.validation");
  return (message: string | undefined) => {
    const key = validationKey(message);
    return key ? t(key) : undefined;
  };
}

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; practiceRhythm: PracticeRhythm; marketingOptIn: boolean };
}) {
  const t = useTranslations("Profile.details");
  const tAuth = useTranslations("Auth.signUp");
  const message = useValidationMessage();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: initial.name, practiceRhythm: initial.practiceRhythm, marketingOptIn: initial.marketingOptIn },
  });
  const pending = form.formState.isSubmitting;

  const save = form.handleSubmit(async (values) => {
    const result = await updateProfile(values);
    if (result.ok) {
      toast.success(t("saved"));
      form.reset(values);
    } else toast.error(t("error"));
  });

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-space-md">
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        <Controller
          control={form.control}
          name="name"
          render={({ field: input, fieldState }) => (
            <div className={field}>
              <label htmlFor="profile-name" className={labelClass}>
                {t("name")}
              </label>
              <Input {...input} id="profile-name" maxLength={100} autoComplete="name" aria-invalid={fieldState.invalid || undefined} className="h-11" />
              {fieldState.invalid && <FieldError>{message(fieldState.error?.message)}</FieldError>}
            </div>
          )}
        />
        <label className={field}>
          <span className={labelClass}>{t("email")}</span>
          <Input value={initial.email} readOnly disabled dir="ltr" className="h-11" />
        </label>
      </div>

      <Controller
        control={form.control}
        name="practiceRhythm"
        render={({ field: rhythm }) => (
          <fieldset>
            <legend className={cn(labelClass, "mb-2.5")}>{tAuth("rhythmLabel")}</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {practiceRhythms.map((id) => {
                const Icon = rhythmIcons[id];
                const active = rhythm.value === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => rhythm.onChange(id)}
                    className={cn(
                      "flex flex-col items-start rounded-xl p-4 text-start transition-colors",
                      active ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface hover:bg-surface-container",
                    )}
                  >
                    <Icon className="mb-2 size-5" />
                    <span className="font-label-lg text-label-lg leading-tight">{tAuth(`rhythms.${id}.title`)}</span>
                    <span className="mt-1 font-body-sm text-body-sm opacity-80">{tAuth(`rhythms.${id}.sub`)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      />

      <Controller
        control={form.control}
        name="marketingOptIn"
        render={({ field: optIn }) => (
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={optIn.value} onChange={(e) => optIn.onChange(e.target.checked)} className="mt-1 size-4 accent-primary" />
            <span className="font-body-sm text-body-sm text-on-surface-variant">{tAuth("newsletter")}</span>
          </label>
        )}
      />

      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
          {t("save")}
        </button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const t = useTranslations("Profile.security");
  const message = useValidationMessage();
  const form = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema), defaultValues: { current: "", next: "" } });
  const pending = form.formState.isSubmitting;

  const submit = form.handleSubmit(async (values) => {
    const { error } = await authClient.changePassword({ currentPassword: values.current, newPassword: values.next, revokeOtherSessions: true });
    if (error) {
      toast.error(error.code === "INVALID_PASSWORD" ? t("wrongPassword") : error.code === "PASSWORD_TOO_SHORT" ? t("tooShort") : t("error"));
      return;
    }
    form.reset();
    toast.success(t("changed"));
  });

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-space-md md:grid-cols-2">
      <Controller
        control={form.control}
        name="current"
        render={({ field: input, fieldState }) => (
          <PasswordField
            id="current-password"
            label={t("current")}
            autoComplete="current-password"
            value={input.value}
            onChange={input.onChange}
            onBlur={input.onBlur}
            error={fieldState.invalid ? message(fieldState.error?.message) : undefined}
          />
        )}
      />
      <Controller
        control={form.control}
        name="next"
        render={({ field: input, fieldState }) => (
          <PasswordField
            id="new-password"
            label={t("new")}
            autoComplete="new-password"
            showStrength
            value={input.value}
            onChange={input.onChange}
            onBlur={input.onBlur}
            error={fieldState.invalid ? message(fieldState.error?.message) : undefined}
          />
        )}
      />
      <p className="font-body-sm text-body-sm text-on-surface-variant md:col-span-2">{t("hint")}</p>
      <div className="md:col-span-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
          {t("submit")}
        </button>
      </div>
    </form>
  );
}

export function DeleteAccount() {
  const t = useTranslations("Profile.privacy");
  const router = useRouter();
  const message = useValidationMessage();
  const [open, setOpen] = useState(false);
  const form = useForm<DeleteAccountValues>({ resolver: zodResolver(deleteAccountSchema), defaultValues: { password: "" } });
  const pending = form.formState.isSubmitting;

  const remove = form.handleSubmit(async ({ password }) => {
    const { error } = await authClient.deleteUser({ password });
    if (error) {
      toast.error(error.code === "INVALID_PASSWORD" ? t("wrongPassword") : t("error"));
      return;
    }
    toast.success(t("deleted"));
    router.replace("/");
    router.refresh();
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-label-md text-label-md text-on-surface-variant underline-offset-4 transition-colors hover:text-error hover:underline"
      >
        {t("start")}
      </button>
    );
  }

  return (
    <form onSubmit={remove} noValidate className="flex flex-col gap-space-sm rounded-xl bg-error-container/40 p-space-md">
      <p className="font-body-sm text-body-sm text-on-error-container">{t("warning")}</p>
      <Controller
        control={form.control}
        name="password"
        render={({ field: input, fieldState }) => (
          <PasswordField
            id="delete-password"
            label={t("password")}
            autoComplete="current-password"
            value={input.value}
            onChange={input.onChange}
            onBlur={input.onBlur}
            error={fieldState.invalid ? message(fieldState.error?.message) : undefined}
          />
        )}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-error px-5 py-2.5 font-label-lg text-label-lg text-on-error disabled:opacity-60"
        >
          {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
          {t("confirm")}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 font-label-lg text-label-lg text-on-surface-variant hover:text-primary">
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
