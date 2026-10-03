"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AtSignIcon, CircleCheckIcon, LoaderCircleIcon, MailIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { FieldError } from "@/components/ui/field";
import { getPathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  validationKey,
  type ForgotPasswordValues,
  type ResetPasswordValues,
} from "@/modules/auth/schemas";
import { authClient } from "@/server/better-auth/client";

import { PasswordField } from "./password-field";

const submitClass =
  "flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-container font-label-lg text-label-lg text-surface shadow-sm transition-colors hover:bg-primary disabled:opacity-80";

function Done({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
        <CircleCheckIcon className="size-6" />
      </span>
      <p className="font-headline-sm text-headline-sm text-on-surface">{title}</p>
      <p className="font-body-md text-body-md text-on-surface-variant">{body}</p>
      {children}
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container">
      {children}
    </p>
  );
}

export function ForgotPasswordForm({ mailbox }: { mailbox: boolean }) {
  const t = useTranslations("Auth.recovery");
  const tAuth = useTranslations("Auth");
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const form = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const pending = form.formState.isSubmitting;

  const submit = form.handleSubmit(async ({ email }) => {
    setError(false);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: getPathname({ href: "/reset-password", locale }),
    });
    // Same answer whether or not the address has an account.
    if (error && error.status !== 404) setError(true);
    else setSent(true);
  });

  if (sent) {
    return (
      <Done title={t("sentTitle")} body={t("sentBody")}>
        {mailbox && (
          <Link href="/test/mailbox" className="inline-flex items-center gap-2 font-label-md text-label-md text-primary underline-offset-4 hover:underline">
            <MailIcon className="size-4" />
            {t("openMailbox")}
          </Link>
        )}
      </Done>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => {
          const key = validationKey(fieldState.error?.message);
          return (
            <div className="space-y-1.5">
              <label htmlFor="email" className="block font-label-md text-label-md text-on-surface">
                {tAuth("email")}
              </label>
              <div
                className={cn(
                  "relative rounded-lg bg-surface-container focus-within:ring-2 focus-within:ring-primary/20",
                  fieldState.invalid && "ring-2 ring-error/50 focus-within:ring-error/50",
                )}
              >
                <AtSignIcon aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
                <input
                  {...field}
                  id="email"
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  placeholder={tAuth("emailPlaceholder")}
                  aria-invalid={fieldState.invalid || undefined}
                  aria-describedby={fieldState.invalid ? "email-error" : undefined}
                  className="w-full rounded-lg bg-transparent py-3.5 ps-11 pe-4 text-start font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none rtl:text-end"
                />
              </div>
              {fieldState.invalid && <FieldError id="email-error">{key ? tAuth(`validation.${key}`) : null}</FieldError>}
            </div>
          );
        }}
      />
      {error && <ErrorNote>{tAuth("errors.generic")}</ErrorNote>}
      <button type="submit" disabled={pending} className={submitClass}>
        {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
        {t("send")}
      </button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("Auth.recovery");
  const tAuth = useTranslations("Auth");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "" } });
  const pending = form.formState.isSubmitting;

  const submit = form.handleSubmit(async ({ password }) => {
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (!error) return setDone(true);
    setError(error.code === "INVALID_TOKEN" ? t("invalidToken") : error.code === "PASSWORD_TOO_SHORT" ? tAuth("errors.weakPassword") : tAuth("errors.generic"));
  });

  if (done) {
    return (
      <Done title={t("resetTitle")} body={t("resetBody")}>
        <Link href="/sign-in" className="rounded-lg bg-primary px-6 py-2.5 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container">
          {tAuth("signIn.submit")}
        </Link>
      </Done>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => {
          const key = validationKey(fieldState.error?.message);
          return (
            <PasswordField
              id="password"
              label={t("newPassword")}
              autoComplete="new-password"
              showStrength
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.invalid && key ? tAuth(`validation.${key}`) : undefined}
            />
          );
        }}
      />
      {error && <ErrorNote>{error}</ErrorNote>}
      <button type="submit" disabled={pending} className={submitClass}>
        {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
        {t("save")}
      </button>
    </form>
  );
}

export function ResendVerification({ email, mailbox }: { email: string; mailbox: boolean }) {
  const t = useTranslations("Auth.recovery");
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const resend = () =>
    startTransition(async () => {
      await authClient.sendVerificationEmail({ email, callbackURL: getPathname({ href: "/verify-email", locale }) });
      setSent(true);
    });

  return (
    <div className="flex flex-col items-center gap-3">
      <button type="button" onClick={resend} disabled={pending || sent} className={submitClass}>
        {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
        {sent ? t("resent") : t("resend")}
      </button>
      {mailbox && (
        <Link href="/test/mailbox" className="inline-flex items-center gap-2 font-label-md text-label-md text-primary underline-offset-4 hover:underline">
          <MailIcon className="size-4" />
          {t("openMailbox")}
        </Link>
      )}
    </div>
  );
}
