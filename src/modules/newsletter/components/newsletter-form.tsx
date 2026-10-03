"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckIcon, LoaderCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { cn } from "@/lib/utils";
import { forgotPasswordSchema as emailFormSchema, type ForgotPasswordValues } from "@/modules/auth/schemas";

import { subscribeToNewsletter } from "../actions";

/** Email sign-up for "The New Moon Epistle". `tone` matches the surface it sits on. */
export function NewsletterForm({
  source,
  tone = "light",
}: {
  source: "footer" | "journal";
  tone?: "light" | "primary";
}) {
  const t = useTranslations("Newsletter");
  const [done, setDone] = useState(false);
  // Checked in the browser with the same email rule the action applies on the server.
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: "" },
  });
  const pending = form.formState.isSubmitting;
  const invalid = !!form.formState.errors.email;

  const submit = form.handleSubmit(async ({ email }) => {
    const result = await subscribeToNewsletter({ email, source });
    if (result.ok) setDone(true);
    else form.setError("email", { message: "emailInvalid" });
  });

  if (done) {
    return (
      <p
        role="status"
        className={cn(
          "font-body-sm text-body-sm flex items-center justify-center gap-2 rounded-xl p-4 text-center",
          tone === "primary"
            ? "bg-on-primary/15 text-on-primary"
            : "bg-primary-fixed text-on-primary-fixed",
        )}
      >
        <CircleCheckIcon className="size-5 shrink-0" />
        {t("saved")}
      </p>
    );
  }

  return (
    <div>
      <form
        onSubmit={submit}
        noValidate
        className={cn(
          "gap-space-xs flex flex-col rounded-xl p-2 sm:flex-row",
          tone === "primary" && "bg-on-primary/10 backdrop-blur-md",
        )}
      >
        <label htmlFor={`newsletter-${source}`} className="sr-only">
          {t("label")}
        </label>
        <input
          id={`newsletter-${source}`}
          type="email"
          dir="ltr"
          autoComplete="email"
          {...form.register("email")}
          placeholder={t("placeholder")}
          aria-invalid={invalid || undefined}
          aria-describedby={
            invalid ? `newsletter-${source}-error` : undefined
          }
          className="bg-surface-container-lowest font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:ring-primary min-w-0 flex-1 rounded-lg px-4 py-3 focus:ring-2 focus:outline-none rtl:placeholder:text-right"
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "font-label-lg text-label-lg inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 transition-colors disabled:opacity-70",
            tone === "primary"
              ? "bg-surface-container-high text-on-surface hover:bg-surface-container-lowest"
              : "bg-primary text-on-primary hover:bg-primary-container",
          )}
        >
          {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
          {t("submit")}
        </button>
      </form>
      {invalid && (
        <p
          id={`newsletter-${source}-error`}
          role="alert"
          className={cn(
            "font-body-sm text-body-sm mt-2",
            tone === "primary" ? "text-on-primary" : "text-error",
          )}
        >
          {t("invalid")}
        </p>
      )}
    </div>
  );
}
