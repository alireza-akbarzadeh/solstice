"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLinkIcon, PlusIcon, SaveIcon, Trash2Icon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Spinner } from "@/components/ui/spinner";
import { Link, useRouter } from "@/i18n/navigation";
import type { Localized } from "@/lib/localized";
import {
  createJournalArticle,
  removeJournalArticle,
  saveJournalArticle,
} from "@/modules/instructor/journal-actions";
import { journalFieldsSchema, type JournalFieldsInput, type JournalFormValues } from "@/modules/journal/schemas";
import type { JournalCategory, JournalStoredBlock } from "@/modules/journal/types";

import { JournalBlockEditor } from "./journal-block-editor";
import { emptyLocalized, LocalizedField } from "./localized-field";

export type EditableArticle = {
  slug: string | null;
  category: JournalCategory;
  issue: number;
  title: Localized;
  excerpt: Localized;
  tags: Localized[];
  authorName: Localized;
  authorRole: Localized;
  authorImage: string | null;
  image: string;
  imageAlt: Localized;
  body: JournalStoredBlock[];
  practices: string[];
};

/**
 * Writes an essay end to end: the card details, the author, and the body itself. A new essay
 * has no slug yet — saving it creates one from the English title, so nobody has to invent a URL.
 * react-hook-form holds the fields and validates them with the action's own zod schema.
 */
export function JournalEditor({
  article,
  practiceOptions,
  categoryOptions,
}: {
  article: EditableArticle;
  practiceOptions: { slug: string; title: string }[];
  /** Journal categories (value = slug), from /instructor/categories. */
  categoryOptions: { value: string; label: string }[];
}) {
  const t = useTranslations("Studio.journal.editor");
  const router = useRouter();
  const [slug, setSlug] = useState(article.slug);
  const [deleting, startDelete] = useTransition();
  const isNew = slug === null;

  const form = useForm<JournalFormValues, unknown, JournalFieldsInput>({
    resolver: zodResolver(journalFieldsSchema),
    defaultValues: {
      category: article.category,
      issue: article.issue,
      title: article.title,
      excerpt: article.excerpt,
      tags: article.tags,
      authorName: article.authorName,
      authorRole: article.authorRole,
      authorImage: article.authorImage ?? "",
      image: article.image,
      imageAlt: article.imageAlt,
      body: article.body,
      practices: article.practices,
    },
  });
  const tags = useFieldArray({ control: form.control, name: "tags" });
  const saving = form.formState.isSubmitting;
  const bothLanguages = t("validation.bothLanguages");

  /*
   * Once a new essay is saved it has a slug, and the address bar should say so — otherwise a
   * refresh drops the owner back on an empty form. A plain history replace rather than the
   * router: re-rendering the page here would throw away the form the owner is still looking at.
   */
  useEffect(() => {
    if (article.slug === null && slug) window.history.replaceState(null, "", `?edit=${slug}`);
  }, [article.slug, slug]);

  const onSave = form.handleSubmit(
    async (values) => {
      const result = isNew ? await createJournalArticle(values) : await saveJournalArticle({ slug, fields: values });
      if (!result.ok) {
        toast.error(result.error === "invalid" ? t("invalid") : t("error"));
        return;
      }
      toast.success(isNew ? t("created") : t("saved"));
      // The essay exists now. Adopt its slug straight away so a second save edits it rather
      // than creating a duplicate.
      if (isNew && result.slug) setSlug(result.slug);
    },
    () => toast.error(t("invalid")),
  );

  const onDelete = () =>
    startDelete(async () => {
      if (!slug) return;
      const result = await removeJournalArticle({ slug });
      if (result.ok) {
        toast.success(t("deleted"));
        router.replace("/instructor/journal");
      } else toast.error(t("error"));
    });

  const localizedController = (name: "title" | "excerpt" | "imageAlt" | "authorName" | "authorRole", label: string, extra: Partial<React.ComponentProps<typeof LocalizedField>> = {}) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <LocalizedField
          label={label}
          value={field.value}
          onChange={field.onChange}
          disabled={saving}
          error={fieldState.invalid ? bothLanguages : undefined}
          {...extra}
        />
      )}
    />
  );

  return (
    <form onSubmit={onSave} noValidate className="flex flex-col gap-space-lg rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
      <div className="flex flex-wrap items-start justify-between gap-space-sm">
        <div>
          <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("eyebrow")}</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{isNew ? t("newTitle") : t("title")}</h2>
        </div>
        <div className="flex items-center gap-space-xs">
          {slug && (
            <>
              <code className="rounded bg-surface px-2 py-1 font-label-sm text-label-sm text-on-surface-variant" dir="ltr">
                {slug}
              </code>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/journal/${slug}`}>
                  <ExternalLinkIcon data-icon="inline-start" className="rtl:-scale-x-100" />
                  {t("view")}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <FieldGroup>
        {localizedController("title", t("fields.title"), { maxLength: 200 })}
        {localizedController("excerpt", t("fields.excerpt"), { description: t("fields.excerptHint"), multiline: true, maxLength: 600 })}

        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="journal-category">{t("fields.category")}</FieldLabel>
                <ResponsiveSelect
                  id="journal-category"
                  label={t("fields.category")}
                  value={field.value}
                  disabled={saving}
                  onValueChange={field.onChange}
                  options={categoryOptions}
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="issue"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="journal-issue">{t("fields.issue")}</FieldLabel>
                <Input
                  id="journal-issue"
                  type="number"
                  min={1}
                  max={9999}
                  disabled={saving}
                  value={Number.isFinite(field.value) ? field.value : ""}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid || undefined}
                />
                {fieldState.invalid ? <FieldError>{t("validation.issue")}</FieldError> : <FieldDescription>{t("fields.issueHint")}</FieldDescription>}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="image"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="journal-image">{t("fields.image")}</FieldLabel>
              <Input
                {...field}
                id="journal-image"
                dir="ltr"
                disabled={saving}
                placeholder="/images/journal/… or https://…"
                aria-invalid={fieldState.invalid || undefined}
              />
              {fieldState.invalid ? <FieldError>{t("validation.image")}</FieldError> : <FieldDescription>{t("fields.imageHint")}</FieldDescription>}
            </Field>
          )}
        />
        {localizedController("imageAlt", t("fields.imageAlt"), { maxLength: 300 })}

        <fieldset className="flex flex-col gap-space-sm rounded-lg bg-surface p-space-md">
          <legend className="font-label-md text-label-md text-on-surface">{t("fields.author")}</legend>
          {localizedController("authorName", t("fields.authorName"), { maxLength: 120 })}
          {localizedController("authorRole", t("fields.authorRole"), { maxLength: 160 })}
          <Controller
            control={form.control}
            name="authorImage"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="journal-author-image">{t("fields.authorImage")}</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="journal-author-image"
                  dir="ltr"
                  disabled={saving}
                  placeholder={t("fields.authorImagePlaceholder")}
                />
              </Field>
            )}
          />
        </fieldset>

        <Field>
          <FieldLabel>{t("fields.tags")}</FieldLabel>
          <div className="flex flex-col gap-space-sm">
            {tags.fields.map((item, i) => (
              <div key={item.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <Controller
                    control={form.control}
                    name={`tags.${i}`}
                    render={({ field }) => (
                      <LocalizedField label={t("fields.tag", { n: i + 1 })} value={field.value} onChange={field.onChange} disabled={saving} maxLength={60} />
                    )}
                  />
                </div>
                <Button type="button" size="icon-sm" variant="ghost" disabled={saving} aria-label={t("fields.removeTag")} onClick={() => tags.remove(i)}>
                  <XIcon />
                </Button>
              </div>
            ))}
            {tags.fields.length < 8 && (
              <Button type="button" size="sm" variant="outline" disabled={saving} className="self-start" onClick={() => tags.append({ ...emptyLocalized })}>
                <PlusIcon data-icon="inline-start" />
                {t("fields.addTag")}
              </Button>
            )}
          </div>
        </Field>

        <Controller
          control={form.control}
          name="practices"
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("fields.practices")}</FieldLabel>
              <FieldDescription>{t("fields.practicesHint")}</FieldDescription>
              <div className="flex flex-wrap gap-1.5">
                {practiceOptions.map((p) => {
                  const on = field.value.includes(p.slug);
                  return (
                    <Button
                      key={p.slug}
                      type="button"
                      size="sm"
                      variant={on ? "default" : "outline"}
                      aria-pressed={on}
                      disabled={saving}
                      onClick={() => field.onChange(on ? field.value.filter((s) => s !== p.slug) : [...field.value, p.slug])}
                    >
                      {p.title}
                    </Button>
                  );
                })}
              </div>
            </Field>
          )}
        />
      </FieldGroup>

      <Controller
        control={form.control}
        name="body"
        render={({ field }) => <JournalBlockEditor body={field.value} onChange={field.onChange} disabled={saving} />}
      />

      <div className="flex flex-wrap items-center justify-between gap-space-sm border-t border-hairline pt-space-md">
        {slug ? (
          <ResponsiveDialog>
            <ResponsiveDialogTrigger asChild>
              <Button type="button" variant="outline" className="text-destructive" disabled={saving || deleting}>
                <Trash2Icon data-icon="inline-start" />
                {t("delete")}
              </Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>{t("delete")}</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>{t("deleteBody")}</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              <ResponsiveDialogFooter>
                <ResponsiveDialogClose asChild>
                  <Button variant="outline">{t("keep")}</Button>
                </ResponsiveDialogClose>
                <ResponsiveDialogClose asChild>
                  <Button variant="destructive" onClick={onDelete}>
                    {t("confirmDelete")}
                  </Button>
                </ResponsiveDialogClose>
              </ResponsiveDialogFooter>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        ) : (
          <Badge variant="secondary">{t("draftNotice")}</Badge>
        )}

        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
          {isNew ? t("create") : t("save")}
        </Button>
      </div>
    </form>
  );
}
