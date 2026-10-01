"use client";

import { useTranslations } from "next-intl";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Localized } from "@/lib/localized";

/**
 * Every piece of reader-facing text exists in both languages, so the studio always edits them
 * as a pair — English and Persian side by side, each in its own direction. Editing one language
 * and forgetting the other is the easiest mistake to make here, and this makes it visible.
 */
export function LocalizedField({
  label,
  description,
  value,
  onChange,
  multiline,
  rows = 3,
  maxLength,
  disabled,
}: {
  label: string;
  description?: string;
  value: Localized;
  onChange: (next: Localized) => void;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
}) {
  const t = useTranslations("Studio.locale");
  const Control = multiline ? Textarea : Input;

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="gap-space-sm grid grid-cols-1 md:grid-cols-2">
        {(["en", "fa"] as const).map((locale) => (
          <div key={locale} className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-clay tracking-widest uppercase">
              {t(locale)}
            </span>
            <Control
              aria-label={`${label} (${t(locale)})`}
              dir={locale === "fa" ? "rtl" : "ltr"}
              value={value[locale]}
              maxLength={maxLength}
              disabled={disabled}
              rows={multiline ? rows : undefined}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
              ) => onChange({ ...value, [locale]: e.target.value })}
            />
          </div>
        ))}
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

export const emptyLocalized: Localized = { en: "", fa: "" };
