"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import { useMessages, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CopyTree } from "@/modules/pages/types";
import { LocalizedField } from "./localized-field";

function blank(template: CopyTree): CopyTree {
  if (typeof template === "string")
    return template.includes("{") || template.includes("<") ? template : "";
  if (Array.isArray(template)) return template.map(blank);
  return Object.fromEntries(
    Object.entries(template).map(([key, value]) => [key, blank(value)]),
  );
}

const humanize = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());

import { isMicrocopyKey } from "@/modules/pages/microcopy";

export { isMicrocopyKey };

/** Paired structured fields preserve both locales; repeatable items move together. */
export function PageCopyFields({
  en,
  fa,
  templateEn,
  templateFa,
  label,
  onChange,
  disabled = false,
  showAdvanced = false,
}: {
  en: CopyTree;
  fa: CopyTree;
  templateEn: CopyTree;
  templateFa: CopyTree;
  label: string;
  onChange: (en: CopyTree, fa: CopyTree) => void;
  disabled?: boolean;
  showAdvanced?: boolean;
}) {
  const t = useTranslations("Studio.pages");
  const labels = (
    useMessages() as unknown as {
      Studio: { pages: { copyLabels: Record<string, string> } };
    }
  ).Studio.pages.copyLabels;

  if (typeof en === "string" && typeof fa === "string") {
    const templated =
      en.includes("{") ||
      fa.includes("{") ||
      en.includes("<") ||
      fa.includes("<");
    return (
      <LocalizedField
        label={label}
        value={{ en, fa }}
        template={{
          en: typeof templateEn === "string" ? templateEn : en,
          fa: typeof templateFa === "string" ? templateFa : fa,
        }}
        multiline={
          en.length > 100 ||
          fa.length > 100 ||
          /body|description|paragraph|quote|bio|متن|توضیح|پاراگراف|نقل/.test(
            label.toLowerCase(),
          )
        }
        rows={3}
        maxLength={20000}
        disabled={disabled}
        description={templated ? t("keepVariables") : undefined}
        onChange={(next) => onChange(next.en, next.fa)}
      />
    );
  }

  if (Array.isArray(en) && Array.isArray(fa)) {
    const enTemplates = Array.isArray(templateEn) ? templateEn : en;
    const faTemplates = Array.isArray(templateFa) ? templateFa : fa;
    const exampleEn = enTemplates[0] ?? en[0];
    const exampleFa = faTemplates[0] ?? fa[0];
    const move = (index: number, by: number) => {
      const a = [...en],
        b = [...fa];
      [a[index], a[index + by]] = [a[index + by]!, a[index]!];
      [b[index], b[index + by]] = [b[index + by]!, b[index]!];
      onChange(a, b);
    };

    return (
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="font-semibold">{label}</h4>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              disabled ||
              exampleEn === undefined ||
              exampleFa === undefined ||
              en.length >= 100
            }
            onClick={() => {
              if (exampleEn !== undefined && exampleFa !== undefined)
                onChange([...en, blank(exampleEn)], [...fa, blank(exampleFa)]);
            }}
          >
            <PlusIcon data-icon="inline-start" />
            {t("addItem")}
          </Button>
        </div>
        {!en.length && (
          <p className="text-on-surface-variant text-sm">{t("emptyItems")}</p>
        )}
        {en.map((value, index) => (
          <details
            key={index}
            open={index === 0}
            className="border-hairline bg-surface rounded-xl border p-4"
          >
            <summary className="cursor-pointer text-sm font-medium">
              {t("item", { number: index + 1 })}
            </summary>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("moveUp")}
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("moveDown")}
                  disabled={disabled || index === en.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() =>
                    onChange(
                      en.filter((_, i) => i !== index),
                      fa.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2Icon data-icon="inline-start" />
                  {t("removeItem")}
                </Button>
              </div>
              <PageCopyFields
                en={value}
                fa={fa[index] ?? value}
                templateEn={enTemplates[index] ?? exampleEn ?? value}
                templateFa={faTemplates[index] ?? exampleFa ?? value}
                label={label}
                disabled={disabled}
                showAdvanced={showAdvanced}
                onChange={(a, b) =>
                  onChange(
                    en.map((item, i) => (i === index ? a : item)),
                    fa.map((item, i) => (i === index ? b : item)),
                  )
                }
              />
            </div>
          </details>
        ))}
      </section>
    );
  }

  if (
    en &&
    fa &&
    typeof en === "object" &&
    typeof fa === "object" &&
    !Array.isArray(en) &&
    !Array.isArray(fa)
  ) {
    const a =
      typeof templateEn === "object" && !Array.isArray(templateEn)
        ? templateEn
        : {};
    const b =
      typeof templateFa === "object" && !Array.isArray(templateFa)
        ? templateFa
        : {};

    const allKeys = Object.keys(a);
    const marketingKeys = allKeys.filter((k) => !isMicrocopyKey(k));
    const visibleKeys = showAdvanced
      ? allKeys
      : marketingKeys.length > 0
        ? marketingKeys
        : allKeys;
    const hiddenCount = allKeys.length - visibleKeys.length;

    return (
      <div className="flex flex-col gap-5">
        {visibleKeys.map((key) => {
          const value = en[key] ?? a[key]!;
          const isMicro = isMicrocopyKey(key);
          const child = (
            <PageCopyFields
              en={value}
              fa={fa[key] ?? value}
              templateEn={a[key] ?? value}
              templateFa={b[key] ?? fa[key] ?? value}
              label={labels[key] ?? humanize(key)}
              disabled={disabled}
              showAdvanced={showAdvanced}
              onChange={(nextEn, nextFa) =>
                onChange({ ...en, [key]: nextEn }, { ...fa, [key]: nextFa })
              }
            />
          );

          return typeof value === "string" ? (
            <div key={key} className="flex flex-col gap-1.5">
              {isMicro && showAdvanced && (
                <div className="flex items-center gap-1.5 self-start">
                  <Badge
                    variant="outline"
                    className="border-clay/30 bg-clay/10 text-clay text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  >
                    {t("advancedBadge")}
                  </Badge>
                </div>
              )}
              {child}
            </div>
          ) : (
            <details
              key={key}
              className={`rounded-xl border p-4 ${
                isMicro
                  ? "border-clay/30 bg-surface-container-low/40"
                  : "border-hairline bg-surface"
              }`}
              open={key === "hero" || !isMicro}
            >
              <summary className="flex cursor-pointer items-center justify-between font-medium">
                <span>{labels[key] ?? humanize(key)}</span>
                {isMicro && showAdvanced && (
                  <Badge
                    variant="outline"
                    className="border-clay/30 bg-clay/10 text-clay text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  >
                    {t("advancedBadge")}
                  </Badge>
                )}
              </summary>
              <div className="mt-5">{child}</div>
            </details>
          );
        })}

        {hiddenCount > 0 && !showAdvanced && (
          <div className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 px-3.5 py-2.5 text-xs text-on-surface-variant">
            <SlidersHorizontalIcon className="size-3.5 text-primary shrink-0" />
            <span>{t("hiddenMicrocopyNotice", { count: hiddenCount })}</span>
          </div>
        )}
      </div>
    );
  }

  return null;
}
