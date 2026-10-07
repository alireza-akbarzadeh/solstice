"use client";

import { AlertCircleIcon, CodeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Localized } from "@/lib/localized";
import {
  extractIcuVariables,
  getIcuVarName,
} from "@/modules/pages/microcopy";

export { extractIcuVariables, getIcuVarName };

/**
 * Every piece of reader-facing text exists in both languages, so the studio always edits them
 * as a pair — English and Persian side by side, each in its own direction.
 * Displays protected ICU variable chips and warns if variables are missing.
 */
export function LocalizedField({
  label,
  description,
  value,
  template,
  variables: explicitVariables,
  onChange,
  multiline,
  rows = 3,
  maxLength,
  disabled,
  error,
}: {
  label: string;
  description?: string;
  value: Localized;
  template?: Localized;
  variables?: string[];
  onChange: (next: Localized) => void;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  /** Validation message; marks both languages invalid. */
  error?: string;
}) {
  const t = useTranslations("Studio.locale");
  const tPages = useTranslations("Studio.pages");

  const inputRefs = {
    en: useRef<HTMLInputElement | HTMLTextAreaElement | null>(null),
    fa: useRef<HTMLInputElement | HTMLTextAreaElement | null>(null),
  };

  // Discover variables from template, explicit prop, or current values
  const discovered = Array.from(
    new Set([
      ...(explicitVariables ?? []),
      ...extractIcuVariables(template?.en ?? ""),
      ...extractIcuVariables(template?.fa ?? ""),
      ...extractIcuVariables(value.en ?? ""),
      ...extractIcuVariables(value.fa ?? ""),
    ]),
  );

  const insertVariable = (locale: "en" | "fa", token: string) => {
    const el = inputRefs[locale].current;
    const current = value[locale] ?? "";
    if (!el) {
      onChange({ ...value, [locale]: `${current} ${token}` });
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    onChange({ ...value, [locale]: next });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  };

  return (
    <Field data-invalid={error ? true : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel>{label}</FieldLabel>
        {discovered.length > 0 && (
          <div className="text-on-surface-variant flex items-center gap-1.5 text-xs">
            <CodeIcon className="text-primary size-3.5" />
            <span className="text-clay font-sans text-[11px] font-medium">
              {tPages("protectedVariables")}
            </span>
          </div>
        )}
      </div>

      <div className="gap-space-sm grid grid-cols-1 md:grid-cols-2">
        {(["en", "fa"] as const).map((locale) => {
          const currentText = value[locale] ?? "";
          const missingVars = discovered.filter((token) => {
            const varName = getIcuVarName(token);
            // Check if variable name exists inside braces in current text
            return !new RegExp(`\\{${varName}[^}]*\\}`).test(currentText);
          });

          return (
            <div key={locale} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-clay tracking-widest uppercase">
                  {t(locale)}
                </span>
                {discovered.length > 0 && missingVars.length > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    <AlertCircleIcon className="size-3" />
                    <span>
                      {tPages("missingVariable")}:{" "}
                      {missingVars.map(getIcuVarName).join(", ")}
                    </span>
                  </span>
                )}
              </div>

              {multiline ? (
                <Textarea
                  ref={(node) => {
                    inputRefs[locale].current = node;
                  }}
                  aria-label={`${label} (${t(locale)})`}
                  dir={locale === "fa" ? "rtl" : "ltr"}
                  value={value[locale]}
                  maxLength={maxLength}
                  disabled={disabled}
                  aria-invalid={error ? true : undefined}
                  rows={rows}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    onChange({ ...value, [locale]: e.target.value })
                  }
                />
              ) : (
                <Input
                  ref={(node) => {
                    inputRefs[locale].current = node;
                  }}
                  aria-label={`${label} (${t(locale)})`}
                  dir={locale === "fa" ? "rtl" : "ltr"}
                  value={value[locale]}
                  maxLength={maxLength}
                  disabled={disabled}
                  aria-invalid={error ? true : undefined}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange({ ...value, [locale]: e.target.value })
                  }
                />
              )}

              {/* Clickable protected variable chips */}
              {discovered.length > 0 && (
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  {discovered.map((token) => {
                    const varName = getIcuVarName(token);
                    const isPresent = new RegExp(`\\{${varName}[^}]*\\}`).test(
                      currentText,
                    );

                    return (
                      <button
                        key={token}
                        type="button"
                        disabled={disabled}
                        title={tPages("clickToInsert")}
                        onClick={() => insertVariable(locale, token)}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold transition-all ${
                          isPresent
                            ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 border"
                            : "border border-amber-500/40 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-300"
                        }`}
                      >
                        <span>{token}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

export const emptyLocalized: Localized = { en: "", fa: "" };
