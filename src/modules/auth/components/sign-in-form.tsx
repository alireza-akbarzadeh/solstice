"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, AtSignIcon, CheckIcon, LoaderCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FieldError } from "@/components/ui/field";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { signInSchema, validationKey, type SignInValues } from "@/modules/auth/schemas";
import { authClient } from "@/server/better-auth/client";

import { PasswordField } from "./password-field";

export function SignInForm({ next }: { next: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", remember: true },
  });
  const pending = form.formState.isSubmitting;
  const message = (key: string | undefined) => {
    const known = validationKey(key);
    return known ? t(`validation.${known}`) : undefined;
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const { error } = await authClient.signIn.email({ email: values.email, password: values.password, rememberMe: values.remember });
    if (error) {
      setError(error.code === "INVALID_EMAIL_OR_PASSWORD" ? t("errors.invalidCredentials") : t("errors.generic"));
      return;
    }
    router.replace(next);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <label htmlFor="email" className="block font-label-md text-label-md text-on-surface">
              {t("email")}
            </label>
            <div
              className={cn(
                "relative rounded-lg bg-surface-container transition-all duration-200 focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/20",
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
                placeholder={t("emailPlaceholder")}
                aria-invalid={fieldState.invalid || undefined}
                aria-describedby={fieldState.invalid ? "email-error" : undefined}
                className="w-full rounded-lg bg-transparent py-3.5 ps-11 pe-4 text-start font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none rtl:text-end"
              />
            </div>
            {fieldState.invalid && <FieldError id="email-error">{message(fieldState.error?.message)}</FieldError>}
          </div>
        )}
      />

      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <PasswordField
            id="password"
            label={t("password")}
            autoComplete="current-password"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.invalid ? message(fieldState.error?.message) : undefined}
            trailing={
              <Link href="/forgot-password" className="font-label-sm text-label-sm text-clay underline-offset-4 hover:underline">
                {t("signIn.forgot")}
              </Link>
            }
          />
        )}
      />

      <Controller
        control={form.control}
        name="remember"
        render={({ field }) => (
          <label className="group flex cursor-pointer items-center gap-3 pt-1 select-none">
            <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="peer sr-only" />
            <span className="flex size-5 items-center justify-center rounded bg-surface-container text-on-primary transition-all group-hover:bg-surface-container-high peer-checked:bg-primary-container peer-focus-visible:ring-2 peer-focus-visible:ring-primary [&>svg]:scale-0 peer-checked:[&>svg]:scale-100">
              <CheckIcon className="size-3.5 transition-transform" />
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant transition-colors group-hover:text-on-surface">
              {t("signIn.remember")}
            </span>
          </label>
        )}
      />

      {error && (
        <p role="alert" className="rounded-lg bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-container font-label-lg text-label-lg text-surface shadow-sm transition-all duration-300 hover:bg-primary active:scale-[0.99] disabled:opacity-80"
      >
        {pending ? (
          <>
            <LoaderCircleIcon className="size-4 animate-spin" />
            {t("signIn.submitting")}
          </>
        ) : (
          <>
            {t("signIn.submit")}
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
