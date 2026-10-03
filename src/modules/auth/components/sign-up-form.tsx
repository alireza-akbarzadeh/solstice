"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, CheckIcon, LoaderCircleIcon, MailIcon, MoonIcon, SunriseIcon, UserIcon, WindIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FieldError } from "@/components/ui/field";
import { getPathname, Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { signUpSchema, validationKey, type SignUpValues } from "@/modules/auth/schemas";
import { authClient } from "@/server/better-auth/client";

import { PasswordField } from "./password-field";

const rhythms = [
  { id: "morning", icon: SunriseIcon },
  { id: "evening", icon: MoonIcon },
  { id: "breath", icon: WindIcon },
] as const;

const inputClass =
  "h-12 w-full rounded-lg bg-surface-container-high ps-4 pe-11 font-body-md text-body-md text-on-surface transition-all duration-200 placeholder:text-outline focus:bg-surface focus:ring-2 focus:ring-primary focus:outline-none aria-invalid:ring-2 aria-invalid:ring-error/50";

function Checkbox({
  checked,
  onChange,
  invalid,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="group flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={invalid ? true : undefined} className="peer sr-only" />
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-surface-container-high text-on-primary transition-all peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100",
          invalid && "ring-2 ring-error/50",
        )}
      >
        <CheckIcon className="size-3.5" />
      </span>
      <span className="font-body-sm text-body-sm text-on-surface-variant select-none">{children}</span>
    </label>
  );
}

export function SignUpForm({ next, signInHref }: { next: string; signInHref: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", practiceRhythm: "morning", terms: false, newsletter: true },
  });
  const pending = form.formState.isSubmitting;
  const message = (key: string | undefined) => {
    const known = validationKey(key);
    return known ? t(`validation.${known}`) : undefined;
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      practiceRhythm: values.practiceRhythm,
      marketingOptIn: values.newsletter,
      // Where the verification email link lands.
      callbackURL: getPathname({ href: "/verify-email", locale }),
    });
    if (error) {
      const code = error.code ?? "";
      setError(
        code.startsWith("USER_ALREADY_EXISTS") ? t("errors.userExists") : code === "PASSWORD_TOO_SHORT" ? t("errors.weakPassword") : t("errors.generic"),
      );
      return;
    }
    router.replace(next);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-label-lg text-label-lg text-on-surface">
                {t("signUp.name")}
              </label>
              <div className="relative">
                <input
                  {...field}
                  id="name"
                  autoComplete="name"
                  maxLength={100}
                  placeholder={t("signUp.namePlaceholder")}
                  aria-invalid={fieldState.invalid || undefined}
                  aria-describedby={fieldState.invalid ? "name-error" : undefined}
                  className={inputClass}
                />
                <UserIcon aria-hidden className="pointer-events-none absolute end-3.5 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
              </div>
              {fieldState.invalid && <FieldError id="name-error">{message(fieldState.error?.message)}</FieldError>}
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-label-lg text-label-lg text-on-surface">
                {t("email")}
              </label>
              <div className="relative">
                <input
                  {...field}
                  id="email"
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  placeholder={t("emailPlaceholder")}
                  aria-invalid={fieldState.invalid || undefined}
                  aria-describedby={fieldState.invalid ? "email-error" : undefined}
                  className={cn(inputClass, "rtl:text-end")}
                />
                <MailIcon aria-hidden className="pointer-events-none absolute end-3.5 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
              </div>
              {fieldState.invalid && <FieldError id="email-error">{message(fieldState.error?.message)}</FieldError>}
            </div>
          )}
        />
      </div>

      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <PasswordField
            id="password"
            label={t("signUp.password")}
            autoComplete="new-password"
            showStrength
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.invalid ? message(fieldState.error?.message) : undefined}
          />
        )}
      />

      <Controller
        control={form.control}
        name="practiceRhythm"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2.5 pt-2">
            <legend className="mb-2.5 font-label-lg text-label-lg text-on-surface">{t("signUp.rhythmLabel")}</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {rhythms.map(({ id, icon: Icon }) => {
                const active = field.value === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => field.onChange(id)}
                    className={cn(
                      "flex flex-col rounded-lg p-3.5 text-start transition-all duration-200",
                      active ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface hover:bg-surface-container-high",
                    )}
                  >
                    <Icon className="mb-1.5 size-5" />
                    <span className="font-label-lg text-label-lg leading-tight">{t(`signUp.rhythms.${id}.title`)}</span>
                    <span className="mt-1 font-body-sm text-body-sm opacity-80">{t(`signUp.rhythms.${id}.sub`)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      />

      <div className="flex flex-col gap-3.5 pt-2">
        <Controller
          control={form.control}
          name="terms"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Checkbox checked={field.value} onChange={field.onChange} invalid={fieldState.invalid}>
                {t.rich("signUp.terms", {
                  link: (chunks) => (
                    <Link href="/terms" className="text-primary underline underline-offset-4 hover:text-on-surface">
                      {chunks}
                    </Link>
                  ),
                })}
              </Checkbox>
              {fieldState.invalid && <FieldError className="ps-8">{message(fieldState.error?.message)}</FieldError>}
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="newsletter"
          render={({ field }) => (
            <Checkbox checked={field.value} onChange={field.onChange}>
              {t("signUp.newsletter")}
            </Checkbox>
          )}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-label-lg text-label-lg tracking-wider text-on-primary uppercase shadow-md transition-all duration-200 hover:bg-on-primary-fixed-variant active:scale-[0.99] disabled:opacity-80"
        >
          {pending ? (
            <>
              <LoaderCircleIcon className="size-4 animate-spin" />
              {t("signUp.submitting")}
            </>
          ) : (
            <>
              {t("signUp.submit")}
              <ArrowRightIcon className="size-5 rtl:rotate-180" />
            </>
          )}
        </button>
        <p className="flex flex-wrap items-center justify-center gap-2 pt-2 text-center">
          <span className="font-body-sm text-body-sm text-on-surface-variant">{t("signUp.hasAccount")}</span>
          <Link href={signInHref} className="font-label-lg text-label-lg text-primary underline underline-offset-4 transition-colors hover:text-on-surface">
            {t("signUp.signIn")}
          </Link>
        </p>
      </div>
    </form>
  );
}
