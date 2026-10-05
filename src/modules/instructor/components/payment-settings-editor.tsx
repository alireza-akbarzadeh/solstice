"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GlobeIcon, KeyRoundIcon, SaveIcon, ServerIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRouter } from "@/i18n/navigation";
import { gatewayIds, gatewayModes, gateways, type GatewayId } from "@/infrastructure/payment/gateways";
import { savePayments } from "@/modules/instructor/payment-settings-actions";
import { paymentSettingsSchema, type PaymentSettingsFormValues } from "@/modules/payments/schemas";
import { stripeCurrencies, type PaymentSettingsView } from "@/modules/payments/types";

const formValues = ({ settings }: PaymentSettingsView): PaymentSettingsFormValues => ({
  ...settings,
  credentials: { zarinpal: { merchantId: "" }, stripe: { secretKey: "", webhookSecret: "" } },
  clear: [],
});

/**
 * Which gateways take payments, in which mode, with which keys, and which one each visitor
 * sees first. Keys are write-only: a saved key shows as its last four characters, and typing
 * into the box replaces it.
 */
export function PaymentSettingsEditor({ initial, country }: { initial: PaymentSettingsView; country: string | null }) {
  const t = useTranslations("Studio.settings.payments");
  const router = useRouter();
  const [view, setView] = useState(initial);

  const form = useForm<PaymentSettingsFormValues, unknown, z.output<typeof paymentSettingsSchema>>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: formValues(initial),
  });
  const saving = form.formState.isSubmitting;
  const enabled = { zarinpal: form.watch("zarinpal.enabled"), stripe: form.watch("stripe.enabled") };
  const clear = form.watch("clear");

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await savePayments(values);
    if (!result.ok) {
      toast.error(t(`errors.${result.error}`));
      return;
    }
    toast.success(t("saved"));
    setView(result.view);
    form.reset(formValues(result.view));
    router.refresh();
  });

  const gatewayOptions = gatewayIds.filter((id) => enabled[id]).map((id) => ({ value: id, label: t(`gateways.${id}.name`) }));

  const gatewayCard = (id: GatewayId) => {
    const info = gateways[id];
    const supported = view.supported[id];
    return (
      <section key={id} className="flex flex-col gap-space-md rounded-lg bg-surface p-space-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-label-lg text-label-lg text-on-surface">{t(`gateways.${id}.name`)}</h3>
              <Badge variant="secondary">{t(`cards.${info.cards}`)}</Badge>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t(`gateways.${id}.body`)}</p>
          </div>
          <Controller
            control={form.control}
            name={`${id}.enabled`}
            render={({ field }) => (
              <label className="flex items-center gap-2 font-label-md text-label-md text-on-surface">
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={t("enable", { gateway: t(`gateways.${id}.name`) })} />
                {field.value ? t("on") : t("off")}
              </label>
            )}
          />
        </div>

        <fieldset disabled={!enabled[id]} className="flex flex-col gap-space-md disabled:opacity-60">
          <Controller
            control={form.control}
            name={`${id}.mode`}
            render={({ field }) => (
              <Field>
                <FieldLabel>{t("mode")}</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={field.value}
                  onValueChange={(value) => value && field.onChange(value)}
                  className="w-full sm:w-auto"
                >
                  {gatewayModes.map((mode) => (
                    <ToggleGroupItem key={mode} value={mode} disabled={!supported.includes(mode)} className="flex-1 px-4 sm:flex-none">
                      {t(`modes.${mode}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <FieldDescription>
                  {t(`modeHints.${field.value}`)} {supported.length < gatewayModes.length && t("notConnected", { gateway: t(`gateways.${id}.name`) })}
                </FieldDescription>
              </Field>
            )}
          />

          {id === "stripe" && (
            <Controller
              control={form.control}
              name="stripe.currency"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="stripe-currency">{t("stripeCurrency")}</FieldLabel>
                  <ResponsiveSelect
                    id="stripe-currency"
                    label={t("stripeCurrency")}
                    value={field.value}
                    onValueChange={field.onChange}
                    className="w-full sm:w-60"
                    options={stripeCurrencies.map((code) => ({ value: code, label: code }))}
                  />
                  <FieldDescription>{t("stripeCurrencyHint")}</FieldDescription>
                </Field>
              )}
            />
          )}
          {id === "zarinpal" && <p className="font-body-sm text-body-sm text-on-surface-variant">{t("zarinpalCurrency")}</p>}

          <div className="flex flex-col gap-space-sm">
            <h4 className="flex items-center gap-2 font-label-md text-label-md text-on-surface">
              <KeyRoundIcon aria-hidden className="size-4" />
              {t("keys.title")}
            </h4>
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              {info.credentials.map(({ key, env }) => {
                const status = view.credentials[id][key]!;
                const clearKey = `${id}.${key}`;
                const removing = clear.includes(clearKey);
                const name = `credentials.${id}.${key}` as "credentials.zarinpal.merchantId";
                return (
                  <Controller
                    key={key}
                    control={form.control}
                    name={name}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor={`key-${id}-${key}`}>{t(`keys.${id}.${key}` as Parameters<typeof t>[0])}</FieldLabel>
                        <Input
                          {...field}
                          id={`key-${id}-${key}`}
                          type="password"
                          autoComplete="off"
                          spellCheck={false}
                          dir="ltr"
                          disabled={status.fromEnv}
                          placeholder={status.last4 && !removing ? `•••• ${status.last4}` : t("keys.notSet")}
                          aria-invalid={fieldState.invalid || undefined}
                        />
                        {fieldState.invalid ? (
                          <FieldError>{t("keys.wrongShape")}</FieldError>
                        ) : status.fromEnv ? (
                          <FieldDescription className="flex items-center gap-1.5">
                            <ServerIcon aria-hidden className="size-3.5" />
                            {t("keys.fromEnv", { name: env })}
                          </FieldDescription>
                        ) : status.last4 ? (
                          <FieldDescription>
                            {removing ? t("keys.willRemove") : t("keys.saved")}{" "}
                            <button
                              type="button"
                              className="text-primary underline-offset-4 hover:underline"
                              onClick={() =>
                                form.setValue("clear", removing ? clear.filter((c) => c !== clearKey) : [...clear, clearKey], { shouldDirty: true })
                              }
                            >
                              {removing ? t("keys.keep") : t("keys.remove")}
                            </button>
                          </FieldDescription>
                        ) : (
                          <FieldDescription>{t("keys.hint")}</FieldDescription>
                        )}
                      </Field>
                    )}
                  />
                );
              })}
            </div>
          </div>
        </fieldset>
      </section>
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-space-lg rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
      <div className="flex flex-wrap items-start justify-between gap-space-md">
        <div>
          <h2 className="font-headline-sm text-headline-sm">{t("title")}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("lede")}</p>
        </div>
        <Button type="submit" size="sm" disabled={saving || !form.formState.isDirty}>
          {saving ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
          {t("save")}
        </Button>
      </div>

      <FieldGroup>
        {gatewayIds.map(gatewayCard)}
        {form.formState.errors.stripe?.enabled && <p className="font-body-sm text-body-sm text-error">{t("errors.oneEnabled")}</p>}

        <section className="flex flex-col gap-space-md rounded-lg bg-surface p-space-md">
          <div>
            <h3 className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
              <GlobeIcon aria-hidden className="size-4" />
              {t("routing.title")}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t("routing.body")}</p>
          </div>
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            {(["iranGateway", "defaultGateway"] as const).map((key) => (
              <Controller
                key={key}
                control={form.control}
                name={key}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor={`routing-${key}`}>{t(`routing.${key}`)}</FieldLabel>
                    <ResponsiveSelect
                      id={`routing-${key}`}
                      label={t(`routing.${key}`)}
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-full"
                      options={gatewayOptions}
                    />
                    {fieldState.invalid ? (
                      <FieldError>{t("errors.disabled")}</FieldError>
                    ) : (
                      <FieldDescription>{t(`routing.${key}Hint`)}</FieldDescription>
                    )}
                  </Field>
                )}
              />
            ))}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {country ? t("routing.yourCountry", { country }) : t("routing.noCountry")}
          </p>
        </section>
      </FieldGroup>
    </form>
  );
}
