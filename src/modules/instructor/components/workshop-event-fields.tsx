"use client";

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import {
  CalendarDaysIcon,
  GlobeIcon,
  MapPinIcon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkshopEventDetails } from "@/modules/workshops/types";
import { LocalizedField, emptyLocalized } from "./localized-field";

const COMMON_TIMEZONES = [
  { value: "Asia/Tehran", label: "Tehran (UTC+03:30)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Europe/London", label: "London (GMT / BST)" },
  { value: "Europe/Paris", label: "Paris / Berlin (CET / CEST)" },
  { value: "America/New_York", label: "New York (EST / EDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST / PDT)" },
];

export type WorkshopEventFormValues = {
  content: {
    event?: WorkshopEventDetails;
  };
};

export function WorkshopEventFields({
  control,
  disabled,
}: {
  control: Control<WorkshopEventFormValues>;
  disabled?: boolean;
}) {
  const t = useTranslations("Workshops.studio");

  const eventEnabled = useWatch({
    control,
    name: "content.event.enabled",
  });

  return (
    <div className="bg-surface-container-low/60 border-outline-variant/30 space-y-6 rounded-3xl border p-6 md:p-8">
      {/* Enable Event Switch */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {t("enableEvent")}
            </h3>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xl">
            {t("enableEventDesc")}
          </p>
        </div>
        <Controller
          control={control}
          name="content.event.enabled"
          render={({ field }) => (
            <Switch
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          )}
        />
      </div>

      {eventEnabled && (
        <div className="border-outline-variant/20 space-y-6 border-t pt-6">
          {/* Start and End Dates */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel className="flex items-center gap-1.5">
                <CalendarDaysIcon className="size-3.5 text-primary" />
                <span>{t("startDate")}</span>
              </FieldLabel>
              <Controller
                control={control}
                name="content.event.startDate"
                render={({ field }) => (
                  <Input
                    type="datetime-local"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={disabled}
                  />
                )}
              />
            </Field>

            <Field>
              <FieldLabel className="flex items-center gap-1.5">
                <CalendarDaysIcon className="size-3.5 text-on-surface-variant" />
                <span>{t("endDate")}</span>
              </FieldLabel>
              <Controller
                control={control}
                name="content.event.endDate"
                render={({ field }) => (
                  <Input
                    type="datetime-local"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={disabled}
                  />
                )}
              />
            </Field>
          </div>

          {/* Timezone & Location Type */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel>{t("timezone")}</FieldLabel>
              <Controller
                control={control}
                name="content.event.timezone"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "Asia/Tehran"}
                    onValueChange={field.onChange}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("timezone")} />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel>{t("locationType")}</FieldLabel>
              <Controller
                control={control}
                name="content.event.locationType"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "in_person"}
                    onValueChange={field.onChange}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">
                        <span className="flex items-center gap-2">
                          <MapPinIcon className="size-4 text-primary" />
                          <span>In-Person Gathering / حضوری</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="online">
                        <span className="flex items-center gap-2">
                          <VideoIcon className="size-4 text-primary" />
                          <span>Online Sanctuary / آنلاین</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="hybrid">
                        <span className="flex items-center gap-2">
                          <GlobeIcon className="size-4 text-primary" />
                          <span>Hybrid / ترکیبی</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          {/* Location Name (Bilingual) */}
          <Controller
            control={control}
            name="content.event.location"
            render={({ field }) => (
              <LocalizedField
                label={t("locationName")}
                value={field.value ?? emptyLocalized}
                onChange={field.onChange}
                disabled={disabled}
              />
            )}
          />

          {/* Capacity */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel className="flex items-center gap-1.5">
                <UsersIcon className="size-3.5 text-primary" />
                <span>{t("capacityLabel")}</span>
              </FieldLabel>
              <Controller
                control={control}
                name="content.event.capacity"
                render={({ field }) => (
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 16"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      field.onChange(val === "" ? null : Number(val));
                    }}
                    disabled={disabled}
                  />
                )}
              />
              <FieldDescription>{t("capacityHint")}</FieldDescription>
            </Field>

            {/* Accepting Registrations Switch */}
            <div className="bg-surface-container/50 flex flex-col justify-between rounded-2xl border border-outline-variant/20 p-4">
              <div className="space-y-0.5">
                <div className="font-label-md text-label-md font-medium text-on-surface">
                  {t("registrationOpen")}
                </div>
                <div className="font-body-xs text-body-xs text-on-surface-variant">
                  {t("registrationOpenDesc")}
                </div>
              </div>
              <div className="mt-3">
                <Controller
                  control={control}
                  name="content.event.registrationOpen"
                  render={({ field }) => (
                    <Switch
                      checked={field.value !== false}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Price Label (Bilingual) */}
          <Controller
            control={control}
            name="content.event.priceLabel"
            render={({ field }) => (
              <LocalizedField
                label={t("priceLabel")}
                value={field.value ?? emptyLocalized}
                onChange={field.onChange}
                disabled={disabled}
              />
            )}
          />

          {/* Payment Instructions (Bilingual Textarea) */}
          <Controller
            control={control}
            name="content.event.paymentInstructions"
            render={({ field }) => (
              <LocalizedField
                label={t("paymentInstructions")}
                value={field.value ?? emptyLocalized}
                onChange={field.onChange}
                multiline
                disabled={disabled}
              />
            )}
          />
        </div>
      )}
    </div>
  );
}
