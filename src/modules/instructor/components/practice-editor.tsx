"use client";

import { FilmIcon, LinkIcon, LoaderCircleIcon, SaveIcon, UnlinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Localized } from "@/lib/localized";
import { attachPracticeVideo, savePracticeMeta } from "@/modules/instructor/actions";
import { intensityLevels, practiceCategories, propSetups, type IntensityLevel, type PracticeAccess, type PracticeCategory, type PropSetup } from "@/modules/practices/types";

export type EditablePractice = {
  slug: string;
  title: Localized;
  summary: Localized;
  series: Localized;
  category: PracticeCategory;
  intensityLevel: IntensityLevel;
  intensityLabel: Localized;
  props: PropSetup;
  durationMinutes: number;
  access: PracticeAccess;
  previewSeconds: number | null;
  videoAssetId: string | null;
};

/** A localized pair of inputs: English and Persian side by side, each in its own direction. */
function LocalizedField({
  label,
  description,
  value,
  onChange,
  multiline,
  maxLength,
}: {
  label: string;
  description?: string;
  value: Localized;
  onChange: (next: Localized) => void;
  multiline?: boolean;
  maxLength?: number;
}) {
  const t = useTranslations("Studio.practices.editor");
  const Control = multiline ? Textarea : Input;
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-1 gap-space-sm md:grid-cols-2">
        {(["en", "fa"] as const).map((locale) => (
          <div key={locale} className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t(`locale.${locale}`)}</span>
            <Control
              dir={locale === "fa" ? "rtl" : "ltr"}
              value={value[locale]}
              maxLength={maxLength}
              rows={multiline ? 3 : undefined}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [locale]: e.target.value })}
            />
          </div>
        ))}
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

/**
 * Stitch: studio-admin-content-video-publisher — the editorial metadata column, plus the
 * ingest column rewritten for the mock VideoProvider, which holds a URL rather than an upload.
 */
export function PracticeEditor({ practice }: { practice: EditablePractice }) {
  const t = useTranslations("Studio.practices.editor");
  const tPractice = useTranslations("Practice");
  const tLibrary = useTranslations("Practices");
  const [form, setForm] = useState(practice);
  const [videoUrl, setVideoUrl] = useState(practice.videoAssetId ?? "");
  const [savingMeta, saveMeta] = useTransition();
  const [savingVideo, saveVideo] = useTransition();

  const set = <K extends keyof EditablePractice>(key: K, value: EditablePractice[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMeta(async () => {
      const result = await savePracticeMeta({
        slug: form.slug,
        title: form.title,
        summary: form.summary,
        series: form.series,
        category: form.category,
        intensityLevel: form.intensityLevel,
        intensityLabel: form.intensityLabel,
        props: form.props,
        durationMinutes: form.durationMinutes,
        access: form.access,
        previewSeconds: form.access === "members" ? form.previewSeconds : null,
      });
      if (result.ok) toast.success(t("saved"));
      else toast.error(t("error"));
    });
  };

  const onVideo = (url: string) => {
    saveVideo(async () => {
      const result = await attachPracticeVideo({ slug: form.slug, url });
      if (result.ok) {
        setVideoUrl(url);
        toast.success(url ? t("video.attached") : t("video.detached"));
      } else toast.error(t("video.invalid"));
    });
  };

  return (
    <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
      {/* Ingest column (Stitch: 5 of 12) */}
      <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm xl:col-span-5 md:p-space-lg">
        <div>
          <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("video.eyebrow")}</span>
          <h2 className="mt-1 font-headline-sm text-headline-sm text-on-surface">{t("video.title")}</h2>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-surface p-space-sm shadow-sm">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/40 text-primary">
            <FilmIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-label-md text-label-md text-on-surface">{videoUrl ? t("video.present") : t("video.absent")}</p>
            <p className="truncate font-body-sm text-body-sm text-on-surface-variant" dir="ltr">
              {videoUrl || t("video.absentHint")}
            </p>
          </div>
          <Badge variant={videoUrl ? "default" : "secondary"} className="shrink-0">
            {videoUrl ? t("video.ready") : t("video.pending")}
          </Badge>
        </div>

        <Field>
          <FieldLabel htmlFor="video-url">{t("video.urlLabel")}</FieldLabel>
          <Input
            id="video-url"
            dir="ltr"
            inputMode="url"
            placeholder="https://…/practice.mp4"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <FieldDescription>{t("video.urlHint")}</FieldDescription>
        </Field>

        <div className="flex flex-wrap gap-space-xs">
          <Button type="button" onClick={() => onVideo(videoUrl.trim())} disabled={savingVideo || !videoUrl.trim()}>
            {savingVideo ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <LinkIcon data-icon="inline-start" />}
            {t("video.attach")}
          </Button>
          {practice.videoAssetId && (
            <Button type="button" variant="outline" onClick={() => onVideo("")} disabled={savingVideo}>
              <UnlinkIcon data-icon="inline-start" />
              {t("video.detach")}
            </Button>
          )}
        </div>

        <Alert>
          <AlertTitle>{t("video.mockTitle")}</AlertTitle>
          <AlertDescription>{t("video.mockBody")}</AlertDescription>
        </Alert>
      </section>

      {/* Metadata column (Stitch: 7 of 12) */}
      <form onSubmit={onSave} className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm xl:col-span-7 md:p-space-lg">
        <div className="flex flex-wrap items-end justify-between gap-space-sm">
          <div>
            <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("eyebrow")}</span>
            <h2 className="mt-1 font-headline-sm text-headline-sm text-on-surface">{t("title")}</h2>
          </div>
          <code className="rounded bg-surface px-2 py-1 font-label-sm text-label-sm text-on-surface-variant" dir="ltr">
            {form.slug}
          </code>
        </div>

        <FieldGroup>
          <LocalizedField label={t("fields.title")} value={form.title} onChange={(v) => set("title", v)} maxLength={200} />
          <LocalizedField label={t("fields.series")} description={t("fields.seriesHint")} value={form.series} onChange={(v) => set("series", v)} maxLength={200} />
          <LocalizedField label={t("fields.summary")} value={form.summary} onChange={(v) => set("summary", v)} multiline maxLength={600} />

          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="category">{t("fields.category")}</FieldLabel>
              <ResponsiveSelect
                id="category"
                label={t("fields.category")}
                value={form.category}
                onValueChange={(v) => set("category", v as PracticeCategory)}
                options={practiceCategories.map((c) => ({ value: c, label: tPractice(`categories.${c}`) }))}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="props">{t("fields.props")}</FieldLabel>
              <ResponsiveSelect
                id="props"
                label={t("fields.props")}
                value={form.props}
                onValueChange={(v) => set("props", v as PropSetup)}
                options={propSetups.map((p) => ({ value: p, label: tPractice(`props.${p}`) }))}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="duration">{t("fields.duration")}</FieldLabel>
              <Input
                id="duration"
                type="number"
                min={1}
                max={600}
                value={form.durationMinutes}
                onChange={(e) => set("durationMinutes", Number(e.target.value))}
              />
            </Field>
          </div>

          <FieldSet>
            <FieldLegend variant="label">{t("fields.intensity")}</FieldLegend>
            <ToggleGroup
              type="single"
              value={form.intensityLevel}
              onValueChange={(v) => v && set("intensityLevel", v as IntensityLevel)}
              variant="outline"
              className="w-full"
            >
              {intensityLevels.map((level) => (
                <ToggleGroupItem key={level} value={level} className="flex-1">
                  {tLibrary(`intensities.${level}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <LocalizedField label={t("fields.intensityLabel")} value={form.intensityLabel} onChange={(v) => set("intensityLabel", v)} maxLength={120} />
          </FieldSet>

          <FieldSet>
            <FieldLegend variant="label">{t("fields.access")}</FieldLegend>
            <ToggleGroup
              type="single"
              value={form.access}
              onValueChange={(v) => v && set("access", v as PracticeAccess)}
              variant="outline"
              className="w-full"
            >
              <ToggleGroupItem value="open" className="flex-1">
                {t("fields.accessOpen")}
              </ToggleGroupItem>
              <ToggleGroupItem value="members" className="flex-1">
                {t("fields.accessMembers")}
              </ToggleGroupItem>
            </ToggleGroup>
            {form.access === "members" && (
              <Field>
                <FieldLabel htmlFor="preview">{t("fields.preview")}</FieldLabel>
                <Input
                  id="preview"
                  type="number"
                  min={0}
                  max={3600}
                  value={form.previewSeconds ?? 0}
                  onChange={(e) => set("previewSeconds", Number(e.target.value) || null)}
                />
                <FieldDescription>{t("fields.previewHint")}</FieldDescription>
              </Field>
            )}
          </FieldSet>
        </FieldGroup>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={savingMeta}>
            {savingMeta ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
            {t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
