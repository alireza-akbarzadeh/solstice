"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
} from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Spinner } from "@/components/ui/spinner";
import { Link, useRouter } from "@/i18n/navigation";
import {
  newProgram,
  publishProgram,
  removeProgram,
  saveProgram,
  type ProgramResult,
} from "@/modules/instructor/program-actions";
import { programFieldsSchema } from "@/modules/programs/schemas";
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
type PracticeOption = { slug: string; title: string; status: string };

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

/**
 * Creates or edits a program: the card and landing copy, then the curriculum of weeks and
 * practice days. react-hook-form validates with the same zod schema as the server actions.
 * Once members enroll, day order and pacing are locked so their progress stays meaningful.
 */
export function ProgramEditor({
  program,
  practiceOptions,
  enrollments,
}: {
  program: EditableProgram;
  practiceOptions: PracticeOption[];
  enrollments: number;
}) {
  const t = useTranslations("Studio.programs.editor");
  const router = useRouter();
  const [slug, setSlug] = useState(program.slug);
  const [status, setStatus] = useState(program.status);
  const [publishing, startPublish] = useTransition();
  const isNew = slug === null;
  const locked = enrollments > 0;

  const form = useForm<ProgramFields>({
    resolver: zodResolver(programFieldsSchema),
    defaultValues: {
      title: program.title,
      description: program.description,
      heroTitle: program.heroTitle,
      lede: program.lede,
      badge: program.badge,
      cta: program.cta,
      note: program.note,
      image: program.image,
      imageAlt: program.imageAlt,
      tone: program.tone,
      icon: program.icon,
      pacing: program.pacing,
      weeks: program.weeks,
    },
  });
  const weeks = useFieldArray({ control: form.control, name: "weeks" });
  const saving = form.formState.isSubmitting;
  const busy = saving || publishing;
  const bothLanguages = t("validation.bothLanguages");

  useEffect(() => {
    if (program.slug === null && slug)
      window.history.replaceState(
        null,
        "",
        `?edit=${encodeURIComponent(slug)}`,
      );
  }, [program.slug, slug]);
  useEffect(() => setStatus(program.status), [program.status]);

  const fail = (result: ProgramResult) => {
    if (!result.ok) toast.error(t(`errors.${result.error}`));
  };
  const persist = async (values: ProgramFields) => {
    const result = isNew
      ? await newProgram(values)
      : await saveProgram({ slug, fields: values });
    if (result.ok) {
      setSlug(result.slug);
      toast.success(t(isNew ? "created" : "saved"));
    } else fail(result);
    return result;
  };
  const invalid = () => toast.error(t("errors.invalid"));
  const onSave = form.handleSubmit(async (values) => {
    await persist(values);
  }, invalid);
  // Publishing saves first, so what goes live is what's on screen.
  const publish = form.handleSubmit(
    (values) =>
      new Promise<void>((resolve) =>
        startPublish(async () => {
          const saved = await persist(values);
          if (saved.ok) {
            const next = status === "published" ? "draft" : "published";
            const result = await publishProgram({
              slug: saved.slug,
              status: next,
            });
            if (result.ok) {
              setStatus(next);
              toast.success(
                t(next === "published" ? "published" : "unpublished"),
              );
            } else fail(result);
          }
          resolve();
        }),
      ),
    invalid,
  );

  const localized = (
    name:
      | "title"
      | "description"
      | "imageAlt"
      | "heroTitle"
      | "lede"
      | "badge"
      | "cta"
      | "note",
    label: string,
    extra: Partial<React.ComponentProps<typeof LocalizedField>> = {},
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <LocalizedField
          label={label}
          value={field.value}
          onChange={field.onChange}
          error={fieldState.invalid ? bothLanguages : undefined}
          {...extra}
        />
      )}
    />
  );

  return (
    <form
      onSubmit={onSave}
      noValidate
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
              disabled={busy}
              onClick={() => void publish()}
            >
              <EyeIcon data-icon="inline-start" />
              {t(status === "published" ? "unpublish" : "publish")}
            </Button>
          )}
          {!isNew && (
            <DeleteContentButton
              label={t("delete")}
              title={t("deleteTitle", { title: form.getValues("title.en") })}
              description={t("deleteBody", { count: enrollments })}
              cancelLabel={t("keep")}
              confirmLabel={t("delete")}
              disabled={busy}
              onConfirm={async () => {
                const result = await removeProgram({ slug });
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
          <Button type="submit" size="sm" disabled={busy}>
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
        {localized("title", t("fields.title"), { maxLength: 200 })}
        {localized("description", t("fields.description"), {
          maxLength: 1200,
          multiline: true,
        })}
        <div className="gap-space-md grid md:grid-cols-2">
          <Controller
            control={form.control}
            name="image"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="program-image">
                  {t("fields.image")}
                </FieldLabel>
                <Input
                  {...field}
                  id="program-image"
                  dir="ltr"
                  placeholder="/images/home/07.jpg"
                  aria-invalid={fieldState.invalid || undefined}
                />
                {fieldState.invalid ? (
                  <FieldError>{t("validation.image")}</FieldError>
                ) : (
                  <FieldDescription>{t("fields.imageHint")}</FieldDescription>
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="pacing"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="program-pacing">
                  {t("fields.pacing")}
                </FieldLabel>
                <ResponsiveSelect
                  id="program-pacing"
                  label={t("fields.pacing")}
                  value={field.value}
                  disabled={locked}
                  onValueChange={field.onChange}
                  options={[
                    { value: "self", label: t("fields.self") },
                    { value: "daily", label: t("fields.daily") },
                  ]}
                />
              </Field>
            )}
          />
        </div>
        {localized("imageAlt", t("fields.imageAlt"), { maxLength: 300 })}
      </FieldGroup>

      <details className="border-hairline p-space-md rounded-lg border">
        <summary className="cursor-pointer text-sm font-semibold">
          {t("presentation")}
        </summary>
        <FieldGroup className="mt-space-md">
          {localized("heroTitle", t("fields.heroTitle"), {
            description: t("fields.heroHint"),
            maxLength: 300,
          })}
          {localized("lede", t("fields.lede"), {
            maxLength: 1600,
            multiline: true,
          })}
          {localized("badge", t("fields.badge"), { maxLength: 160 })}
          {localized("cta", t("fields.cta"), { maxLength: 120 })}
          {localized("note", t("fields.note"), { maxLength: 300 })}
          <div className="gap-space-md grid sm:grid-cols-2">
            <Controller
              control={form.control}
              name="tone"
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("fields.tone")}</FieldLabel>
                  <ResponsiveSelect
                    label={t("fields.tone")}
                    value={field.value}
                    onValueChange={field.onChange}
                    options={[
                      { value: "primary", label: t("fields.green") },
                      { value: "clay", label: t("fields.clay") },
                    ]}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="icon"
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("fields.icon")}</FieldLabel>
                  <ResponsiveSelect
                    label={t("fields.icon")}
                    value={field.value}
                    onValueChange={field.onChange}
                    options={[
                      { value: "sunrise", label: t("fields.sunrise") },
                      { value: "brain", label: t("fields.brain") },
                    ]}
                  />
                </Field>
              )}
            />
          </div>
        </FieldGroup>
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
            disabled={locked || weeks.fields.length >= 12}
            onClick={() => weeks.append(emptyWeek(weeks.fields.length + 1))}
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
        {weeks.fields.length === 0 && (
          <p className="bg-surface p-space-md text-on-surface-variant rounded-lg text-sm">
            {t("emptyWeeks")}
          </p>
        )}
        {weeks.fields.map((week, index) => (
          <div
            key={week.id}
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
                  onClick={() => weeks.move(index, index - 1)}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("moveDown")}
                  disabled={locked || index === weeks.fields.length - 1}
                  onClick={() => weeks.move(index, index + 1)}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={locked}
                  onClick={() => weeks.remove(index)}
                >
                  {t("removeWeek")}
                </Button>
              </div>
            </div>
            <Controller
              control={form.control}
              name={`weeks.${index}.title`}
              render={({ field, fieldState }) => (
                <LocalizedField
                  label={t("fields.weekTitle")}
                  value={field.value}
                  onChange={field.onChange}
                  maxLength={200}
                  error={fieldState.invalid ? bothLanguages : undefined}
                />
              )}
            />
            <details>
              <summary className="text-clay cursor-pointer text-sm">
                {t("weekDetails")}
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                {(
                  [
                    ["label", t("fields.weekLabel"), { maxLength: 120 }],
                    [
                      "description",
                      t("fields.weekDescription"),
                      { maxLength: 1000, multiline: true },
                    ],
                    ["focus", t("fields.focus"), { maxLength: 200 }],
                  ] as const
                ).map(([key, label, extra]) => (
                  <Controller
                    key={key}
                    control={form.control}
                    name={`weeks.${index}.${key}`}
                    render={({ field }) => (
                      <LocalizedField
                        label={label}
                        value={field.value}
                        onChange={field.onChange}
                        {...extra}
                      />
                    )}
                  />
                ))}
              </div>
            </details>
            <WeekDays
              control={form.control}
              weekIndex={index}
              locked={locked}
              practiceOptions={practiceOptions}
            />
          </div>
        ))}
      </section>
      <div className="border-hairline pt-space-md flex flex-wrap items-center justify-between gap-3 border-t">
        <p className="text-on-surface-variant text-sm">{t("draftNotice")}</p>
        <Button type="submit" disabled={busy}>
          {saving ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <SaveIcon data-icon="inline-start" />
          )}
          {t(isNew ? "create" : "save")}
        </Button>
      </div>
    </form>
  );
}

/**
 * One week's practice days. Day numbers run across the whole program, so each week counts the
 * days of the weeks before it. Days are plain slugs, edited as one array value.
 */
function WeekDays({
  control,
  weekIndex,
  locked,
  practiceOptions,
}: {
  control: Control<ProgramFields>;
  weekIndex: number;
  locked: boolean;
  practiceOptions: PracticeOption[];
}) {
  const t = useTranslations("Studio.programs.editor");
  const allWeeks = useWatch({ control, name: "weeks" });
  return (
    <Controller
      control={control}
      name={`weeks.${weekIndex}.practices`}
      render={({ field }) => {
        const days = field.value;
        const before = allWeeks
          .slice(0, weekIndex)
          .reduce((total, w) => total + w.practices.length, 0);
        const move = (dayIndex: number, by: number) => {
          const next = [...days];
          [next[dayIndex], next[dayIndex + by]] = [
            next[dayIndex + by]!,
            next[dayIndex]!,
          ];
          field.onChange(next);
        };
        return (
          <>
            <ol className="flex flex-col gap-3">
              {days.map((slug, dayIndex) => (
                <li
                  key={`${dayIndex}-${slug}`}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="text-on-surface-variant w-14 shrink-0 text-xs">
                    {t("day", { number: before + dayIndex + 1 })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <ResponsiveSelect
                      label={t("choosePractice")}
                      value={slug}
                      disabled={locked}
                      onValueChange={(value) =>
                        field.onChange(
                          days.map((p, i) => (i === dayIndex ? value : p)),
                        )
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
                      onClick={() => move(dayIndex, -1)}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t("moveDown")}
                      disabled={locked || dayIndex === days.length - 1}
                      onClick={() => move(dayIndex, 1)}
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
                        field.onChange(days.filter((_, i) => i !== dayIndex))
                      }
                    >
                      <XIcon />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              disabled={locked || !practiceOptions.length || days.length >= 31}
              onClick={() =>
                field.onChange([...days, practiceOptions[0]!.slug])
              }
            >
              <PlusIcon data-icon="inline-start" />
              {t("addDay")}
            </Button>
          </>
        );
      }}
    />
  );
}
