"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Link, useRouter } from "@/i18n/navigation";
import {
  newPlan,
  removePlan,
  savePlan,
  type PlanResult,
} from "@/modules/instructor/plan-actions";
import {
  planFormSchema,
  type PlanFields,
  type PlanFormValues,
} from "@/modules/memberships/plan-schemas";
import { billingIntervals, type Currency } from "@/modules/memberships/plans";

import { DeleteContentButton } from "./delete-content-button";
import { LocalizedField } from "./localized-field";

export type EditablePlan = PlanFields & { id: string | null };

const empty = () => ({ en: "", fa: "" });

/**
 * Creates or edits one membership plan. react-hook-form holds the values and validates them
 * with the same zod rules the server action uses (planFormSchema); the server checks again.
 */
export function PlanEditor({
  plan,
  currencyLabel,
  otherCurrencies,
  members,
}: {
  plan: EditablePlan;
  currencyLabel: string;
  /** Currencies other than the site's, each a gateway may charge in (toman for Zarinpal, …). */
  otherCurrencies: { code: Currency; label: string }[];
  members: number;
}) {
  const t = useTranslations("Studio.plans.editor");
  const router = useRouter();
  const isNew = plan.id === null;

  const form = useForm<
    PlanFormValues,
    unknown,
    z.output<typeof planFormSchema>
  >({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      status: plan.status,
      featured: plan.featured,
      name: plan.name,
      description: plan.description,
      badge: plan.badge,
      features: plan.features,
      // A new plan starts with an empty price rather than a "0" to type over.
      price: isNew ? "" : String(plan.price),
      prices: Object.fromEntries(
        otherCurrencies.map(({ code }) => [code, plan.prices[code] === undefined ? "" : String(plan.prices[code])]),
      ),
      intervalMonths: plan.intervalMonths,
      trialDays: String(plan.trialDays),
      guidance: plan.guidance,
      guidancePlaces: String(plan.guidancePlaces),
    },
  });
  const features = useFieldArray({ control: form.control, name: "features" });
  const onSale = form.watch("status") === "active";
  const guidance = form.watch("guidance");
  const saving = form.formState.isSubmitting;

  const fail = (result: PlanResult) => {
    if (!result.ok) toast.error(t(`errors.${result.error}`));
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const result = isNew
      ? await newPlan(values)
      : await savePlan({ id: plan.id, fields: values });
    if (!result.ok) return fail(result);
    toast.success(t(isNew ? "created" : "saved"));
    if (isNew)
      router.replace(`/instructor/plans?edit=${encodeURIComponent(result.id)}`);
    else {
      form.reset(form.getValues());
      router.refresh();
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="gap-space-lg bg-surface-container-low p-space-md md:p-space-lg flex flex-col rounded-xl shadow-sm"
    >
      <div className="gap-space-md flex flex-wrap items-start justify-between">
        <div>
          <h2 className="font-headline-sm text-headline-sm">
            {t(isNew ? "newTitle" : "title")}
          </h2>
          {!isNew && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("membersOnPlan", { count: members })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/instructor/plans">{t("close")}</Link>
          </Button>
          {!isNew && (
            <DeleteContentButton
              label={t("delete")}
              title={t("deleteTitle", { name: plan.name.en || plan.name.fa })}
              description={
                members > 0
                  ? t("deleteInUse", { count: members })
                  : t("deleteBody")
              }
              cancelLabel={t("keep")}
              confirmLabel={t("delete")}
              disabled={saving || members > 0}
              onConfirm={async () => {
                const result = await removePlan({ id: plan.id });
                if (result.ok) {
                  toast.success(t("deleted"));
                  router.replace("/instructor/plans");
                  return true;
                }
                fail(result);
                return false;
              }}
            />
          )}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <SaveIcon data-icon="inline-start" />
            )}
            {t(isNew ? "create" : "save")}
          </Button>
        </div>
      </div>

      <FieldGroup>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <LocalizedField
              label={t("fields.name")}
              value={field.value}
              onChange={field.onChange}
              maxLength={80}
              error={fieldState.invalid ? t("validation.name") : undefined}
            />
          )}
        />
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <LocalizedField
              label={t("fields.description")}
              value={field.value}
              onChange={field.onChange}
              maxLength={400}
              multiline
              rows={2}
              error={
                fieldState.invalid ? t("validation.description") : undefined
              }
            />
          )}
        />

        <div className="gap-space-md grid grid-cols-1 md:grid-cols-3">
          <Controller
            control={form.control}
            name="price"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="plan-price">
                  {t("fields.price")}
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    {...field}
                    id="plan-price"
                    inputMode="decimal"
                    dir="ltr"
                    placeholder="0"
                    aria-invalid={fieldState.invalid || undefined}
                    className="flex-1"
                  />
                  <span className="font-label-md text-label-md text-on-surface-variant shrink-0">
                    {currencyLabel}
                  </span>
                </div>
                {fieldState.invalid ? (
                  <FieldError>{t("validation.price")}</FieldError>
                ) : (
                  <FieldDescription>{t("fields.priceHint")}</FieldDescription>
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="intervalMonths"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="plan-interval">
                  {t("fields.interval")}
                </FieldLabel>
                <ResponsiveSelect
                  id="plan-interval"
                  label={t("fields.interval")}
                  value={String(field.value)}
                  onValueChange={(value) => field.onChange(Number(value))}
                  className="w-full"
                  options={billingIntervals.map((months) => ({
                    value: String(months),
                    label: t("intervals", { months }),
                  }))}
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="trialDays"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="plan-trial">
                  {t("fields.trial")}
                </FieldLabel>
                <Input
                  {...field}
                  id="plan-trial"
                  inputMode="numeric"
                  dir="ltr"
                  aria-invalid={fieldState.invalid || undefined}
                />
                {fieldState.invalid ? (
                  <FieldError>{t("validation.trial")}</FieldError>
                ) : (
                  <FieldDescription>{t("fields.trialHint")}</FieldDescription>
                )}
              </Field>
            )}
          />
        </div>

        <section className="gap-space-sm flex flex-col">
          <div>
            <h3 className="font-label-lg text-label-lg text-on-surface">
              {t("fields.otherPrices")}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("fields.otherPricesHint")}
            </p>
          </div>
          <div className="gap-space-md grid grid-cols-1 sm:grid-cols-3">
            {otherCurrencies.map(({ code, label }) => (
              <Controller
                key={code}
                control={form.control}
                name={`prices.${code}`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor={`plan-price-${code}`}>{label}</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id={`plan-price-${code}`}
                      inputMode="decimal"
                      dir="ltr"
                      placeholder={t("fields.notSold")}
                      aria-invalid={fieldState.invalid || undefined}
                    />
                    {fieldState.invalid && (
                      <FieldError>{t("validation.price")}</FieldError>
                    )}
                  </Field>
                )}
              />
            ))}
          </div>
        </section>

        <Controller
          control={form.control}
          name="badge"
          render={({ field, fieldState }) => (
            <LocalizedField
              label={t("fields.badge")}
              description={t("fields.badgeHint")}
              value={field.value}
              onChange={field.onChange}
              maxLength={40}
              error={fieldState.invalid ? t("validation.badge") : undefined}
            />
          )}
        />

        <section className="gap-space-sm flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-label-lg text-label-lg text-on-surface">
                {t("fields.features")}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("fields.featuresHint")}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={features.fields.length >= 12}
              onClick={() => features.append(empty())}
            >
              <PlusIcon data-icon="inline-start" />
              {t("addFeature")}
            </Button>
          </div>
          {features.fields.map((item, index) => (
            <div
              key={item.id}
              className="border-hairline bg-surface p-space-sm flex flex-col gap-2 rounded-lg border"
            >
              <div className="flex items-center justify-end gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("moveUp")}
                  disabled={index === 0}
                  onClick={() => features.move(index, index - 1)}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("moveDown")}
                  disabled={index === features.fields.length - 1}
                  onClick={() => features.move(index, index + 1)}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("removeFeature")}
                  onClick={() => features.remove(index)}
                >
                  <Trash2Icon />
                </Button>
              </div>
              <Controller
                control={form.control}
                name={`features.${index}`}
                render={({ field, fieldState }) => (
                  <LocalizedField
                    label={t("feature", { number: index + 1 })}
                    value={field.value}
                    onChange={field.onChange}
                    maxLength={160}
                    error={
                      fieldState.invalid ? t("validation.feature") : undefined
                    }
                  />
                )}
              />
            </div>
          ))}
        </section>

        <div className="gap-space-md grid grid-cols-1 md:grid-cols-2">
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Field
                orientation="horizontal"
                className="bg-surface p-space-md rounded-lg"
              >
                <FieldContent>
                  <FieldLabel htmlFor="plan-on-sale">
                    {t("fields.onSale")}
                  </FieldLabel>
                  <FieldDescription>{t("fields.onSaleHint")}</FieldDescription>
                </FieldContent>
                <Switch
                  id="plan-on-sale"
                  checked={field.value === "active"}
                  onCheckedChange={(checked) => {
                    field.onChange(checked ? "active" : "hidden");
                    if (!checked) form.setValue("featured", false);
                  }}
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="featured"
            render={({ field }) => (
              <Field
                orientation="horizontal"
                data-disabled={!onSale || undefined}
                className="bg-surface p-space-md rounded-lg"
              >
                <FieldContent>
                  <FieldLabel htmlFor="plan-featured">
                    {t("fields.featured")}
                  </FieldLabel>
                  <FieldDescription>
                    {t("fields.featuredHint")}
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="plan-featured"
                  checked={field.value}
                  disabled={!onSale}
                  onCheckedChange={field.onChange}
                />
              </Field>
            )}
          />
        </div>

        <section className="gap-space-md bg-surface p-space-md flex flex-col rounded-lg">
          <Controller
            control={form.control}
            name="guidance"
            render={({ field }) => (
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="plan-guidance">{t("fields.guidance")}</FieldLabel>
                  <FieldDescription>{t("fields.guidanceHint")}</FieldDescription>
                </FieldContent>
                <Switch id="plan-guidance" checked={field.value} onCheckedChange={field.onChange} />
              </Field>
            )}
          />
          {guidance && (
            <Controller
              control={form.control}
              name="guidancePlaces"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined} className="max-w-xs">
                  <FieldLabel htmlFor="plan-guidance-places">{t("fields.guidancePlaces")}</FieldLabel>
                  <Input
                    {...field}
                    id="plan-guidance-places"
                    inputMode="numeric"
                    dir="ltr"
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.invalid ? (
                    <FieldError>{t("validation.guidancePlaces")}</FieldError>
                  ) : (
                    <FieldDescription>{t("fields.guidancePlacesHint")}</FieldDescription>
                  )}
                </Field>
              )}
            />
          )}
        </section>
      </FieldGroup>
    </form>
  );
}
