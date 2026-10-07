"use client";

import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ClockIcon,
  ListOrderedIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  type Control,
  Controller,
  useFieldArray,
  useWatch,
} from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatChapterTime,
  parseChapterTime,
} from "@/modules/practices/chapters";
import type {
  PracticeFormOutput,
  PracticeFormValues,
} from "@/modules/practices/schemas";

import { LocalizedField } from "./localized-field";

function InlineTimeInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (seconds: number) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState(() => formatChapterTime(value));

  useEffect(() => {
    setText(formatChapterTime(value));
  }, [value]);

  return (
    <Input
      dir="ltr"
      value={text}
      disabled={disabled}
      placeholder="00:00"
      className="h-8 w-24 font-mono text-center text-sm tabular-nums"
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseChapterTime(e.target.value));
      }}
      onBlur={() => {
        const parsed = parseChapterTime(text);
        setText(formatChapterTime(parsed));
        onChange(parsed);
      }}
    />
  );
}

export function PracticeChaptersEditor({
  control,
  disabled,
}: {
  control: Control<PracticeFormValues, unknown, PracticeFormOutput>;
  disabled?: boolean;
}) {
  const t = useTranslations("Studio.practices.editor.chapters");
  const tEditor = useTranslations("Studio.practices.editor");
  const bothLanguages = tEditor("validation.bothLanguages");

  const { fields, append, remove, move, replace } = useFieldArray({
    control,
    name: "chapters",
  });

  const chaptersValues = useWatch({
    control,
    name: "chapters",
  });

  const addChapter = () => {
    const list = chaptersValues ?? [];
    const lastSeconds =
      list.length > 0
        ? (list[list.length - 1]?.startSeconds ?? 0) + 300
        : 0;

    append({
      title: { en: "", fa: "" },
      description: { en: "", fa: "" },
      startSeconds: lastSeconds,
    });
  };

  const handleSortByTime = () => {
    if (!chaptersValues || chaptersValues.length < 2) return;
    const sorted = [...chaptersValues].sort(
      (a, b) => (a.startSeconds ?? 0) - (b.startSeconds ?? 0),
    );
    replace(sorted);
  };

  return (
    <section className="bg-surface-container-low p-space-md md:p-space-lg flex flex-col gap-space-md rounded-xl shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-label-sm text-label-sm text-clay tracking-widest uppercase">
            {t("eyebrow")}
          </span>
          <div className="mt-1 flex items-center gap-2.5">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {t("title")}
            </h2>
            <Badge variant="secondary">
              {t("count", { count: fields.length })}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {fields.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={handleSortByTime}
            >
              <ArrowUpDownIcon data-icon="inline-start" className="size-3.5" />
              {t("sortByTime")}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={addChapter}
          >
            <PlusIcon data-icon="inline-start" className="size-3.5" />
            {t("add")}
          </Button>
        </div>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("lede")}
      </p>

      {fields.length === 0 ? (
        <div className="border-outline-variant/30 bg-surface/60 p-space-lg flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
          <div className="bg-primary-container/30 text-primary flex size-10 items-center justify-center rounded-full">
            <ListOrderedIcon className="size-5" />
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface">
              {t("empty")}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-md">
              {t("emptyHint")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={addChapter}
          >
            <PlusIcon data-icon="inline-start" className="size-3.5" />
            {t("addFirst")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="border-outline-variant/20 bg-surface/80 p-space-md flex flex-col gap-3 rounded-lg border shadow-xs"
            >
              <div className="border-outline-variant/15 flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="bg-surface-container-high font-mono text-xs font-semibold text-on-surface-variant flex size-6 items-center justify-center rounded-full">
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="text-clay size-3.5" />
                    <Controller
                      control={control}
                      name={`chapters.${index}.startSeconds`}
                      render={({ field }) => (
                        <InlineTimeInput
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          disabled={disabled}
                        />
                      )}
                    />
                    <span className="font-label-xs text-label-xs text-on-surface-variant hidden sm:inline">
                      {t("timestampHint")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={Boolean(disabled) || index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label={t("moveUp")}
                    title={t("moveUp")}
                  >
                    <ArrowUpIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={Boolean(disabled) || index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label={t("moveDown")}
                    title={t("moveDown")}
                  >
                    <ArrowDownIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={disabled}
                    onClick={() => remove(index)}
                    aria-label={t("remove")}
                    title={t("remove")}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <Controller
                  control={control}
                  name={`chapters.${index}.title`}
                  render={({ field, fieldState }) => (
                    <LocalizedField
                      label={t("titleLabel")}
                      value={{
                        en: field.value?.en ?? "",
                        fa: field.value?.fa ?? "",
                      }}
                      onChange={field.onChange}
                      error={fieldState.invalid ? bothLanguages : undefined}
                      maxLength={200}
                      disabled={disabled}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`chapters.${index}.description`}
                  render={({ field }) => (
                    <LocalizedField
                      label={t("descLabel")}
                      value={{
                        en: field.value?.en ?? "",
                        fa: field.value?.fa ?? "",
                      }}
                      onChange={field.onChange}
                      maxLength={500}
                      multiline={false}
                      disabled={disabled}
                    />
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
