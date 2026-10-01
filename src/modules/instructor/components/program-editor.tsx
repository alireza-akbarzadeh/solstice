"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  PlusIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Link, useRouter } from "@/i18n/navigation";
import {
  newProgram,
  publishProgram,
  removeProgram,
  saveProgram,
  type ProgramResult,
} from "@/modules/instructor/program-actions";
import type {
  ProgramFields,
  StoredProgramWeek,
} from "@/modules/programs/types";
import { DeleteContentButton } from "./delete-content-button";
import { LocalizedField } from "./localized-field";

export type EditableProgram = ProgramFields & {
  slug: string | null;
  status: "draft" | "published";
};
const empty = () => ({ en: "", fa: "" });
const emptyWeek = (number: number): StoredProgramWeek => ({
  label: {
    en: `Week ${number}`,
    fa: `هفتهٔ ${new Intl.NumberFormat("fa").format(number)}`,
  },
  title: empty(),
  description: empty(),
  focus: empty(),
  practices: [],
});

export function ProgramEditor({
  program,
  practiceOptions,
  enrollments,
}: {
  program: EditableProgram;
  practiceOptions: { slug: string; title: string; status: string }[];
  enrollments: number;
}) {
  const t = useTranslations("Studio.programs.editor");
  const router = useRouter();
  const [form, setForm] = useState(program);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(program.status);
  const isNew = form.slug === null;
  const locked = enrollments > 0;
  useEffect(() => {
    if (program.slug === null && form.slug)
      window.history.replaceState(
        null,
        "",
        `?edit=${encodeURIComponent(form.slug)}`,
      );
  }, [program.slug, form.slug]);
  useEffect(() => setStatus(program.status), [program.status]);
  const set = <K extends keyof ProgramFields>(
    key: K,
    value: ProgramFields[K],
  ) => setForm((current) => ({ ...current, [key]: value }));
  const setWeek = (index: number, value: StoredProgramWeek) =>
    set(
      "weeks",
      form.weeks.map((week, i) => (i === index ? value : week)),
    );
  const fail = (result: ProgramResult) => {
    if (!result.ok) toast.error(t(`errors.${result.error}`));
  };
  const fields = (): ProgramFields => form;
  const save = async () => {
    const result = isNew
      ? await newProgram(fields())
      : await saveProgram({ slug: form.slug, fields: fields() });
    if (result.ok) {
      setForm((current) => ({ ...current, slug: result.slug }));
      toast.success(t(isNew ? "created" : "saved"));
    } else fail(result);
    return result;
  };
  const publish = () =>
    start(async () => {
      const saved = await save();
      if (!saved.ok) return;
      const next = status === "published" ? "draft" : "published";
      const result = await publishProgram({ slug: saved.slug, status: next });
      if (result.ok) {
        setStatus(next);
        toast.success(t(next === "published" ? "published" : "unpublished"));
      } else fail(result);
    });
  const moveWeek = (index: number, by: number) => {
    const weeks = [...form.weeks];
    [weeks[index], weeks[index + by]] = [weeks[index + by]!, weeks[index]!];
    set("weeks", weeks);
  };
  const moveDay = (weekIndex: number, dayIndex: number, by: number) => {
    const week = form.weeks[weekIndex]!;
    const days = [...week.practices];
    [days[dayIndex], days[dayIndex + by]] = [
      days[dayIndex + by]!,
      days[dayIndex]!,
    ];
    setWeek(weekIndex, { ...week, practices: days });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          await save();
        });
      }}
      className="gap-space-lg bg-surface-container-low p-space-md md:p-space-lg flex flex-col rounded-xl shadow-sm"
    >
      <div className="gap-space-md flex flex-wrap items-start justify-between">
        <div>
          <h2 className="font-headline-sm text-headline-sm">
            {t(isNew ? "newTitle" : "title")}
          </h2>
          <Badge variant={status === "published" ? "default" : "secondary"}>
            {t(`status.${status}`)}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/instructor/programs">{t("close")}</Link>
          </Button>
          {!isNew && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={publish}
            >
              <EyeIcon data-icon="inline-start" />
              {t(status === "published" ? "unpublish" : "publish")}
            </Button>
          )}
          {!isNew && (
            <DeleteContentButton
              label={t("delete")}
              title={t("deleteTitle", { title: form.title.en })}
              description={t("deleteBody", { count: enrollments })}
              cancelLabel={t("keep")}
              confirmLabel={t("delete")}
              disabled={pending}
              onConfirm={async () => {
                const result = await removeProgram({ slug: form.slug });
                if (result.ok) {
                  toast.success(t("deleted"));
                  router.replace("/instructor/programs");
                  return true;
                }
                fail(result);
                return false;
              }}
            />
          )}
          <Button type="submit" size="sm" disabled={pending}>
            <SaveIcon data-icon="inline-start" />
            {t(isNew ? "create" : "save")}
          </Button>
        </div>
      </div>

      <LocalizedField
        label={t("fields.title")}
        value={form.title}
        onChange={(value) => set("title", value)}
        maxLength={200}
      />
      <LocalizedField
        label={t("fields.description")}
        value={form.description}
        onChange={(value) => set("description", value)}
        maxLength={1200}
        multiline
      />
      <div className="gap-space-md grid md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="program-image">{t("fields.image")}</FieldLabel>
          <Input
            id="program-image"
            dir="ltr"
            value={form.image}
            onChange={(event) => set("image", event.target.value)}
            placeholder="/images/home/07.jpg"
          />
          <FieldDescription>{t("fields.imageHint")}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="program-pacing">{t("fields.pacing")}</FieldLabel>
          <ResponsiveSelect
            id="program-pacing"
            label={t("fields.pacing")}
            value={form.pacing}
            disabled={locked}
            onValueChange={(value) =>
              set("pacing", value as ProgramFields["pacing"])
            }
            options={[
              { value: "self", label: t("fields.self") },
              { value: "daily", label: t("fields.daily") },
            ]}
          />
        </Field>
      </div>
      <LocalizedField
        label={t("fields.imageAlt")}
        value={form.imageAlt}
        onChange={(value) => set("imageAlt", value)}
        maxLength={300}
      />
      <details className="border-hairline p-space-md rounded-lg border">
        <summary className="cursor-pointer text-sm font-semibold">
          {t("presentation")}
        </summary>
        <div className="mt-space-md gap-space-md flex flex-col">
          <LocalizedField
            label={t("fields.heroTitle")}
            description={t("fields.heroHint")}
            value={form.heroTitle}
            onChange={(value) => set("heroTitle", value)}
            maxLength={300}
          />
          <LocalizedField
            label={t("fields.lede")}
            value={form.lede}
            onChange={(value) => set("lede", value)}
            maxLength={1600}
            multiline
          />
          <LocalizedField
            label={t("fields.badge")}
            value={form.badge}
            onChange={(value) => set("badge", value)}
            maxLength={160}
          />
          <LocalizedField
            label={t("fields.cta")}
            value={form.cta}
            onChange={(value) => set("cta", value)}
            maxLength={120}
          />
          <LocalizedField
            label={t("fields.note")}
            value={form.note}
            onChange={(value) => set("note", value)}
            maxLength={300}
          />
          <div className="gap-space-md grid sm:grid-cols-2">
            <Field>
              <FieldLabel>{t("fields.tone")}</FieldLabel>
              <ResponsiveSelect
                label={t("fields.tone")}
                value={form.tone}
                onValueChange={(value) =>
                  set("tone", value as ProgramFields["tone"])
                }
                options={[
                  { value: "primary", label: t("fields.green") },
                  { value: "clay", label: t("fields.clay") },
                ]}
              />
            </Field>
            <Field>
              <FieldLabel>{t("fields.icon")}</FieldLabel>
              <ResponsiveSelect
                label={t("fields.icon")}
                value={form.icon}
                onValueChange={(value) =>
                  set("icon", value as ProgramFields["icon"])
                }
                options={[
                  { value: "sunrise", label: t("fields.sunrise") },
                  { value: "brain", label: t("fields.brain") },
                ]}
              />
            </Field>
          </div>
        </div>
      </details>

      <section className="gap-space-md flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-headline-sm text-headline-sm">
            {t("curriculum")}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={locked || form.weeks.length >= 12}
            onClick={() =>
              set("weeks", [...form.weeks, emptyWeek(form.weeks.length + 1)])
            }
          >
            <PlusIcon data-icon="inline-start" />
            {t("addWeek")}
          </Button>
        </div>
        <p className="text-on-surface-variant text-sm">{t("curriculumHint")}</p>
        {locked && (
          <Alert>
            <AlertDescription>
              {t("locked", { count: enrollments })}
            </AlertDescription>
          </Alert>
        )}
        {form.weeks.length === 0 && (
          <p className="bg-surface p-space-md text-on-surface-variant rounded-lg text-sm">
            {t("emptyWeeks")}
          </p>
        )}
        {form.weeks.map((week, index) => (
          <div
            key={index}
            className="gap-space-md border-hairline bg-surface p-space-md flex flex-col rounded-xl border"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-semibold">
                {t("week", { number: index + 1 })}
              </h4>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("moveUp")}
                  disabled={locked || index === 0}
                  onClick={() => moveWeek(index, -1)}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("moveDown")}
                  disabled={locked || index === form.weeks.length - 1}
                  onClick={() => moveWeek(index, 1)}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={locked}
                  onClick={() =>
                    set(
                      "weeks",
                      form.weeks.filter((_, i) => i !== index),
                    )
                  }
                >
                  {t("removeWeek")}
                </Button>
              </div>
            </div>
            <LocalizedField
              label={t("fields.weekTitle")}
              value={week.title}
              onChange={(value) => setWeek(index, { ...week, title: value })}
              maxLength={200}
            />
            <details>
              <summary className="text-clay cursor-pointer text-sm">
                {t("weekDetails")}
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                <LocalizedField
                  label={t("fields.weekLabel")}
                  value={week.label}
                  onChange={(value) =>
                    setWeek(index, { ...week, label: value })
                  }
                  maxLength={120}
                />
                <LocalizedField
                  label={t("fields.weekDescription")}
                  value={week.description}
                  onChange={(value) =>
                    setWeek(index, { ...week, description: value })
                  }
                  multiline
                  maxLength={1000}
                />
                <LocalizedField
                  label={t("fields.focus")}
                  value={week.focus}
                  onChange={(value) =>
                    setWeek(index, { ...week, focus: value })
                  }
                  maxLength={200}
                />
              </div>
            </details>
            <ol className="flex flex-col gap-3">
              {week.practices.map((slug, dayIndex) => {
                const day =
                  form.weeks
                    .slice(0, index)
                    .reduce((total, w) => total + w.practices.length, 0) +
                  dayIndex +
                  1;
                return (
                  <li
                    key={dayIndex}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <span className="text-on-surface-variant w-14 shrink-0 text-xs">
                      {t("day", { number: day })}
                    </span>
                    <div className="min-w-0 flex-1">
                      <ResponsiveSelect
                        label={t("choosePractice")}
                        value={slug}
                        disabled={locked}
                        onValueChange={(value) =>
                          setWeek(index, {
                            ...week,
                            practices: week.practices.map((p, i) =>
                              i === dayIndex ? value : p,
                            ),
                          })
                        }
                        options={practiceOptions.map((p) => ({
                          value: p.slug,
                          label:
                            p.status === "draft"
                              ? t("draftPractice", { title: p.title })
                              : p.title,
                        }))}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={t("moveUp")}
                        disabled={locked || dayIndex === 0}
                        onClick={() => moveDay(index, dayIndex, -1)}
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={t("moveDown")}
                        disabled={
                          locked || dayIndex === week.practices.length - 1
                        }
                        onClick={() => moveDay(index, dayIndex, 1)}
                      >
                        <ArrowDownIcon />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={t("removeDay")}
                        disabled={locked}
                        onClick={() =>
                          setWeek(index, {
                            ...week,
                            practices: week.practices.filter(
                              (_, i) => i !== dayIndex,
                            ),
                          })
                        }
                      >
                        <XIcon />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              disabled={
                locked || !practiceOptions.length || week.practices.length >= 31
              }
              onClick={() =>
                setWeek(index, {
                  ...week,
                  practices: [...week.practices, practiceOptions[0]!.slug],
                })
              }
            >
              <PlusIcon data-icon="inline-start" />
              {t("addDay")}
            </Button>
          </div>
        ))}
      </section>
      <div className="border-hairline pt-space-md flex flex-wrap items-center justify-between gap-3 border-t">
        <p className="text-on-surface-variant text-sm">{t("draftNotice")}</p>
        <Button type="submit" disabled={pending}>
          <SaveIcon data-icon="inline-start" />
          {t(isNew ? "create" : "save")}
        </Button>
      </div>
    </form>
  );
}
