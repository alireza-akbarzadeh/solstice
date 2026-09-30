"use client";

import { LoaderCircleIcon, MoonIcon, SunriseIcon, WindIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { formText } from "@/lib/form-data";
import { cn } from "@/lib/utils";
import { PasswordField } from "@/modules/auth/components/password-field";
import { authClient } from "@/server/better-auth/client";

import { updateProfile } from "../actions";
import { type PracticeRhythm, practiceRhythms } from "../types";

const rhythmIcons = { morning: SunriseIcon, evening: MoonIcon, breath: WindIcon };

const field = "block space-y-1.5";
const labelClass = "font-label-md text-label-md text-on-surface";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container disabled:opacity-70";

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; practiceRhythm: PracticeRhythm; marketingOptIn: boolean };
}) {
  const t = useTranslations("Profile.details");
  const tAuth = useTranslations("Auth.signUp");
  const [name, setName] = useState(initial.name);
  const [rhythm, setRhythm] = useState<PracticeRhythm>(initial.practiceRhythm);
  const [optIn, setOptIn] = useState(initial.marketingOptIn);
  const [pending, startTransition] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfile({ name, practiceRhythm: rhythm, marketingOptIn: optIn });
      if (result.ok) toast.success(t("saved"));
      else toast.error(t("error"));
    });
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-space-md">
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        <label className={field}>
          <span className={labelClass}>{t("name")}</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoComplete="name" className="h-11" />
        </label>
        <label className={field}>
          <span className={labelClass}>{t("email")}</span>
          <Input value={initial.email} readOnly disabled dir="ltr" className="h-11" />
        </label>
      </div>

      <fieldset>
        <legend className={cn(labelClass, "mb-2.5")}>{tAuth("rhythmLabel")}</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {practiceRhythms.map((id) => {
            const Icon = rhythmIcons[id];
            const active = rhythm === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setRhythm(id)}
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

      <label className="flex items-start gap-3">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-1 size-4 accent-primary" />
        <span className="font-body-sm text-body-sm text-on-surface-variant">{tAuth("newsletter")}</span>
      </label>

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
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const { error } = await authClient.changePassword({
        currentPassword: formText(data, "current"),
        newPassword: formText(data, "new"),
        revokeOtherSessions: true,
      });
      if (error) {
        toast.error(error.code === "INVALID_PASSWORD" ? t("wrongPassword") : error.code === "PASSWORD_TOO_SHORT" ? t("tooShort") : t("error"));
        return;
      }
      form.reset();
      toast.success(t("changed"));
    });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-space-md md:grid-cols-2">
      <PasswordField id="current-password" name="current" label={t("current")} autoComplete="current-password" />
      <PasswordField id="new-password" name="new" label={t("new")} autoComplete="new-password" showStrength />
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
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const remove = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = formText(new FormData(e.currentTarget), "password");
    startTransition(async () => {
      const { error } = await authClient.deleteUser({ password });
      if (error) {
        toast.error(error.code === "INVALID_PASSWORD" ? t("wrongPassword") : t("error"));
        return;
      }
      toast.success(t("deleted"));
      router.replace("/");
      router.refresh();
    });
  };

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
    <form onSubmit={remove} className="flex flex-col gap-space-sm rounded-xl bg-error-container/40 p-space-md">
      <p className="font-body-sm text-body-sm text-on-error-container">{t("warning")}</p>
      <PasswordField id="delete-password" label={t("password")} autoComplete="current-password" />
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
