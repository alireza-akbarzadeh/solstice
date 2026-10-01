"use client";

import { ExternalLinkIcon, LoaderCircleIcon, PlusIcon, SaveIcon, Trash2Icon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Link, useRouter } from "@/i18n/navigation";
import type { Localized } from "@/lib/localized";
import {
  createJournalArticle,
  removeJournalArticle,
  saveJournalArticle,
} from "@/modules/instructor/journal-actions";
import { journalCategories, type JournalCategory, type JournalStoredBlock } from "@/modules/journal/types";

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
 */
export function JournalEditor({ article, practiceOptions }: { article: EditableArticle; practiceOptions: { slug: string; title: string }[] }) {
  const t = useTranslations("Studio.journal.editor");
  const tJournal = useTranslations("Journal");
  const router = useRouter();
  const [form, setForm] = useState(article);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const isNew = form.slug === null;

  const set = <K extends keyof EditableArticle>(key: K, value: EditableArticle[K]) => setForm((f) => ({ ...f, [key]: value }));

  /*
   * Once a new essay is saved it has a slug, and the address bar should say so — otherwise a
   * refresh drops the owner back on an empty form. A plain history replace rather than the
   * router: a client navigation issued from inside the save transition was being dropped, and
   * re-rendering the page here would throw away the form the owner is still looking at.
   */
  useEffect(() => {
    // history, not the router: a router navigation here leaves the save transition pending,
    // which keeps the submit button disabled, and re-rendering the page would discard the form
    // the owner is still looking at. The address bar only needs to catch up.
    if (article.slug === null && form.slug) window.history.replaceState(null, "", `?edit=${form.slug}`);
  }, [article.slug, form.slug]);

  const fields = () => ({
    category: form.category,
    issue: form.issue,
    title: form.title,
    excerpt: form.excerpt,
    tags: form.tags,
    authorName: form.authorName,
    authorRole: form.authorRole,
    authorImage: form.authorImage?.trim() ? form.authorImage.trim() : null,
    image: form.image.trim(),
    imageAlt: form.imageAlt,
    body: form.body,
    practices: form.practices,
  });

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    startSave(async () => {
      const result = isNew ? await createJournalArticle(fields()) : await saveJournalArticle({ slug: form.slug, fields: fields() });
      if (!result.ok) {
        toast.error(result.error === "invalid" ? t("invalid") : t("error"));
        return;
      }
      toast.success(isNew ? t("created") : t("saved"));
      // The essay exists now. Adopt its slug straight away so a second save edits it rather
      // than creating a duplicate, then move the URL onto its own editor.
      if (isNew && result.slug) setForm((f) => ({ ...f, slug: result.slug ?? null }));
    });
  };

  const onDelete = () =>
    startDelete(async () => {
      if (!form.slug) return;
      const result = await removeJournalArticle({ slug: form.slug });
      if (result.ok) {
        toast.success(t("deleted"));
        router.replace("/instructor/journal");
      } else toast.error(t("error"));
    });

  return (
    <form onSubmit={onSave} className="flex flex-col gap-space-lg rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
      <div className="flex flex-wrap items-start justify-between gap-space-sm">
        <div>
          <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("eyebrow")}</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{isNew ? t("newTitle") : t("title")}</h2>
        </div>
        <div className="flex items-center gap-space-xs">
          {form.slug && (
            <>
              <code className="rounded bg-surface px-2 py-1 font-label-sm text-label-sm text-on-surface-variant" dir="ltr">
                {form.slug}
              </code>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/journal/${form.slug}`}>
                  <ExternalLinkIcon data-icon="inline-start" className="rtl:-scale-x-100" />
                  {t("view")}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <FieldGroup>
        <LocalizedField label={t("fields.title")} value={form.title} onChange={(v) => set("title", v)} maxLength={200} disabled={saving} />
        <LocalizedField
          label={t("fields.excerpt")}
          description={t("fields.excerptHint")}
          value={form.excerpt}
          onChange={(v) => set("excerpt", v)}
          multiline
          maxLength={600}
          disabled={saving}
        />

        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="journal-category">{t("fields.category")}</FieldLabel>
            <ResponsiveSelect
              id="journal-category"
              label={t("fields.category")}
              value={form.category}
              disabled={saving}
              onValueChange={(v) => set("category", v as JournalCategory)}
              options={journalCategories.map((c) => ({ value: c, label: tJournal(`categories.${c}`) }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="journal-issue">{t("fields.issue")}</FieldLabel>
            <Input
              id="journal-issue"
              type="number"
              min={1}
              max={9999}
              disabled={saving}
              value={form.issue}
              onChange={(e) => set("issue", Number(e.target.value) || 1)}
            />
            <FieldDescription>{t("fields.issueHint")}</FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="journal-image">{t("fields.image")}</FieldLabel>
          <Input
            id="journal-image"
            dir="ltr"
            disabled={saving}
            placeholder="/images/journal/… or https://…"
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
          />
          <FieldDescription>{t("fields.imageHint")}</FieldDescription>
        </Field>
        <LocalizedField label={t("fields.imageAlt")} value={form.imageAlt} onChange={(v) => set("imageAlt", v)} maxLength={300} disabled={saving} />

        <fieldset className="flex flex-col gap-space-sm rounded-lg bg-surface p-space-md">
          <legend className="font-label-md text-label-md text-on-surface">{t("fields.author")}</legend>
          <LocalizedField label={t("fields.authorName")} value={form.authorName} onChange={(v) => set("authorName", v)} maxLength={120} disabled={saving} />
          <LocalizedField label={t("fields.authorRole")} value={form.authorRole} onChange={(v) => set("authorRole", v)} maxLength={160} disabled={saving} />
          <Field>
            <FieldLabel htmlFor="journal-author-image">{t("fields.authorImage")}</FieldLabel>
            <Input
              id="journal-author-image"
              dir="ltr"
              disabled={saving}
              placeholder={t("fields.authorImagePlaceholder")}
              value={form.authorImage ?? ""}
              onChange={(e) => set("authorImage", e.target.value)}
            />
          </Field>
        </fieldset>

        <Field>
          <FieldLabel>{t("fields.tags")}</FieldLabel>
          <div className="flex flex-col gap-space-sm">
            {form.tags.map((tag, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <LocalizedField
                    label={t("fields.tag", { n: i + 1 })}
                    value={tag}
                    disabled={saving}
                    maxLength={60}
                    onChange={(v) => set("tags", form.tags.map((x, xi) => (xi === i ? v : x)))}
                  />
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={saving}
                  aria-label={t("fields.removeTag")}
                  onClick={() => set("tags", form.tags.filter((_, xi) => xi !== i))}
                >
                  <XIcon />
                </Button>
              </div>
            ))}
            {form.tags.length < 8 && (
              <Button type="button" size="sm" variant="outline" disabled={saving} className="self-start" onClick={() => set("tags", [...form.tags, { ...emptyLocalized }])}>
                <PlusIcon data-icon="inline-start" />
                {t("fields.addTag")}
              </Button>
            )}
          </div>
        </Field>

        <Field>
          <FieldLabel>{t("fields.practices")}</FieldLabel>
          <FieldDescription>{t("fields.practicesHint")}</FieldDescription>
          <div className="flex flex-wrap gap-1.5">
            {practiceOptions.map((p) => {
              const on = form.practices.includes(p.slug);
              return (
                <Button
                  key={p.slug}
                  type="button"
                  size="sm"
                  variant={on ? "default" : "outline"}
                  disabled={saving}
                  onClick={() => set("practices", on ? form.practices.filter((s) => s !== p.slug) : [...form.practices, p.slug])}
                >
                  {p.title}
                </Button>
              );
            })}
          </div>
        </Field>
      </FieldGroup>

      <JournalBlockEditor body={form.body} onChange={(body) => set("body", body)} disabled={saving} />

      <div className="flex flex-wrap items-center justify-between gap-space-sm border-t border-hairline pt-space-md">
        {form.slug ? (
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
          {saving ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
          {isNew ? t("create") : t("save")}
        </Button>
      </div>
    </form>
  );
}
