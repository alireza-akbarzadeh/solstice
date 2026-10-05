"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { InboxIcon, SaveIcon, SendIcon, ServerIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Link, useRouter } from "@/i18n/navigation";
import { smtpSecurities } from "@/infrastructure/email/security";
import { emailSettingsSchema, type EmailSettingsFormValues } from "@/modules/email/schemas";
import type { EmailSettingsView } from "@/modules/email/server/settings";
import { saveEmail, sendTestEmail } from "@/modules/instructor/email-actions";

const formValues = (view: EmailSettingsView): EmailSettingsFormValues => ({
  provider: view.provider,
  host: view.host,
  port: view.port,
  security: view.security,
  user: view.user,
  password: "",
  clearPassword: false,
  fromName: view.fromName,
  fromAddress: view.fromAddress,
  replyTo: view.replyTo,
});

/**
 * How the site sends mail: the test mailbox (nothing leaves the site) or an SMTP server — any
 * mailbox provider works. The password is write-only; fields the server sets are read-only.
 */
export function EmailSettingsEditor({ initial }: { initial: EmailSettingsView }) {
  const t = useTranslations("Studio.email.editor");
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [testing, startTest] = useTransition();

  const form = useForm<EmailSettingsFormValues, unknown, z.output<typeof emailSettingsSchema>>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: formValues(initial),
  });
  const saving = form.formState.isSubmitting;
  const smtp = form.watch("provider") === "smtp";
  const clearPassword = form.watch("clearPassword");

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await saveEmail(values);
    if (!result.ok) {
      toast.error(t(`errors.${result.error}`));
      return;
    }
    toast.success(t("saved"));
    setView(result.view);
    form.reset(formValues(result.view));
    router.refresh();
  });

  const test = () =>
    startTest(async () => {
      const result = await sendTestEmail();
      if (result.ok) toast.success(result.mailbox ? t("testInMailbox", { to: result.to }) : t("testSent", { to: result.to }));
      else if (result.error === "delivery") toast.error(t("testFailed", { detail: result.detail }), { duration: 10_000 });
      else toast.error(t("errors.forbidden"));
    });

  const text = (name: "host" | "user" | "fromName" | "fromAddress" | "replyTo", opts: { type?: string; locked?: boolean; hint?: string } = {}) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={`email-${name}`}>{t(`fields.${name}`)}</FieldLabel>
          <Input
            {...field}
            id={`email-${name}`}
            type={opts.type ?? "text"}
            dir="ltr"
            autoComplete="off"
            disabled={opts.locked}
            aria-invalid={fieldState.invalid || undefined}
          />
          {fieldState.invalid ? (
            <FieldError>{t(`validation.${name}`)}</FieldError>
          ) : opts.locked ? (
            <FieldDescription className="flex items-center gap-1.5">
              <ServerIcon aria-hidden className="size-3.5" />
              {t("fromEnv")}
            </FieldDescription>
          ) : opts.hint ? (
            <FieldDescription>{opts.hint}</FieldDescription>
          ) : null}
        </Field>
      )}
    />
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-space-lg rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
      <div className="flex flex-wrap items-start justify-between gap-space-md">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-headline-sm text-headline-sm">{t("title")}</h2>
            <Badge variant={view.active === "smtp" ? "default" : "secondary"}>{t(`active.${view.active}`)}</Badge>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("lede")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={test} disabled={testing || saving || form.formState.isDirty} title={form.formState.isDirty ? t("saveFirst") : undefined}>
            {testing ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
            {t("test")}
          </Button>
          <Button type="submit" size="sm" disabled={saving || !form.formState.isDirty}>
            {saving ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
            {t("save")}
          </Button>
        </div>
      </div>

      <FieldGroup>
        <Controller
          control={form.control}
          name="provider"
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("fields.provider")}</FieldLabel>
              <ToggleGroup type="single" variant="outline" value={field.value} onValueChange={(v) => v && field.onChange(v)} className="w-full sm:w-auto">
                <ToggleGroupItem value="outbox" className="flex-1 px-4 sm:flex-none">
                  {t("providers.outbox")}
                </ToggleGroupItem>
                <ToggleGroupItem value="smtp" className="flex-1 px-4 sm:flex-none">
                  {t("providers.smtp")}
                </ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>
                {field.value === "smtp" ? (
                  t("providerHints.smtp")
                ) : (
                  <>
                    {t("providerHints.outbox")}{" "}
                    <Link href="/test/mailbox" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                      <InboxIcon aria-hidden className="size-3.5" />
                      {t("openMailbox")}
                    </Link>
                  </>
                )}
              </FieldDescription>
            </Field>
          )}
        />

        {smtp && (
          <section className="flex flex-col gap-space-md rounded-lg bg-surface p-space-md">
            <h3 className="font-label-lg text-label-lg text-on-surface">{t("serverTitle")}</h3>
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-[1fr_8rem]">
              {text("host", { locked: view.fromEnv.host, hint: t("hints.host") })}
              <Controller
                control={form.control}
                name="port"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="email-port">{t("fields.port")}</FieldLabel>
                    <Input {...field} id="email-port" inputMode="numeric" dir="ltr" disabled={view.fromEnv.port} aria-invalid={fieldState.invalid || undefined} />
                    {fieldState.invalid && <FieldError>{t("validation.port")}</FieldError>}
                  </Field>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="security"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="email-security">{t("fields.security")}</FieldLabel>
                  <ResponsiveSelect
                    id="email-security"
                    label={t("fields.security")}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={view.fromEnv.security}
                    className="w-full sm:w-72"
                    options={smtpSecurities.map((s) => ({ value: s, label: t(`securities.${s}`) }))}
                  />
                </Field>
              )}
            />
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              {text("user", { locked: view.fromEnv.user })}
              <Controller
                control={form.control}
                name="password"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="email-password">{t("fields.password")}</FieldLabel>
                    <Input
                      {...field}
                      id="email-password"
                      type="password"
                      autoComplete="new-password"
                      dir="ltr"
                      disabled={view.fromEnv.password}
                      placeholder={view.passwordLast4 && !clearPassword ? `•••• ${view.passwordLast4}` : t("notSet")}
                    />
                    <FieldDescription>
                      {view.fromEnv.password ? (
                        t("fromEnv")
                      ) : view.passwordLast4 ? (
                        <>
                          {clearPassword ? t("willRemove") : t("passwordSaved")}{" "}
                          <button
                            type="button"
                            className="text-primary underline-offset-4 hover:underline"
                            onClick={() => form.setValue("clearPassword", !clearPassword, { shouldDirty: true })}
                          >
                            {clearPassword ? t("keep") : t("remove")}
                          </button>
                        </>
                      ) : (
                        t("hints.password")
                      )}
                    </FieldDescription>
                  </Field>
                )}
              />
            </div>
          </section>
        )}

        <section className="flex flex-col gap-space-md rounded-lg bg-surface p-space-md">
          <h3 className="font-label-lg text-label-lg text-on-surface">{t("senderTitle")}</h3>
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            {text("fromName", { hint: t("hints.fromName") })}
            {text("fromAddress", { type: "email", locked: view.fromEnv.fromAddress, hint: t("hints.fromAddress") })}
          </div>
          {text("replyTo", { type: "email", hint: t("hints.replyTo") })}
        </section>
      </FieldGroup>
    </form>
  );
}
