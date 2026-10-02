"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useMessages, useTranslations } from "next-intl";
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

/** Paired structured fields preserve both locales; repeatable items move together. */
export function PageCopyFields({
  en,
  fa,
  templateEn,
  templateFa,
  label,
  onChange,
  disabled = false,
}: {
  en: CopyTree;
  fa: CopyTree;
  templateEn: CopyTree;
  templateFa: CopyTree;
  label: string;
  onChange: (en: CopyTree, fa: CopyTree) => void;
  disabled?: boolean;
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
    return (
      <div className="flex flex-col gap-5">
        {Object.keys(a).map((key) => {
          const value = en[key] ?? a[key]!;
          const child = (
            <PageCopyFields
              en={value}
              fa={fa[key] ?? value}
              templateEn={a[key] ?? value}
              templateFa={b[key] ?? fa[key] ?? value}
              label={labels[key] ?? humanize(key)}
              disabled={disabled}
              onChange={(nextEn, nextFa) =>
                onChange({ ...en, [key]: nextEn }, { ...fa, [key]: nextFa })
              }
            />
          );
          return typeof value === "string" ? (
            <div key={key}>{child}</div>
          ) : (
            <details
              key={key}
              className="border-hairline rounded-xl border p-4"
              open={key === "hero"}
            >
              <summary className="cursor-pointer font-medium">
                {labels[key] ?? humanize(key)}
              </summary>
              <div className="mt-5">{child}</div>
            </details>
          );
        })}
      </div>
    );
  }
  return null;
}
