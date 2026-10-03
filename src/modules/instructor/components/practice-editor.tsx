"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, FilmIcon, LinkIcon, SaveIcon, Trash2Icon, UnlinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Link, useRouter } from "@/i18n/navigation";
import { parseVideoAsset } from "@/infrastructure/video/assets";
import type { Localized } from "@/lib/localized";
import { attachPracticeVideo, newPractice, publishPractice, removePractice, savePracticeMeta } from "@/modules/instructor/actions";
import { EmbedPlayer } from "@/modules/practices/components/embed-player";
import { practiceFormSchema, type PracticeFormOutput, type PracticeFormValues } from "@/modules/practices/schemas";
import {
  intensityLevels,
  practiceCategories,
  propSetups,
  type IntensityLevel,
  type PracticeAccess,
  type PracticeCategory,
  type PropSetup,
} from "@/modules/practices/types";

import { LocalizedField } from "./localized-field";

export type EditablePractice = {
  /** Null while writing a new practice; saving mints one from the English title. */
  slug: string | null;
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
  image: string;
  imageAlt: Localized;
  poster: string | null;
  videoAssetId: string | null;
  videoProvider: string | null;
  status: "draft" | "published";
};

const videoLink = (practice: EditablePractice) =>
  practice.videoProvider === "youtube" && practice.videoAssetId
    ? `https://youtu.be/${practice.videoAssetId}`
    : practice.videoProvider === "aparat" && practice.videoAssetId
      ? `https://www.aparat.com/v/${practice.videoAssetId}`
      : (practice.videoAssetId ?? "");

/**
 * The bilingual practice editor saves metadata and a hosted video link together.
 * react-hook-form validates with practiceFormSchema, which derives blank covers and alt text
 * and then applies the server action's own schema.
 */
export function PracticeEditor({
  practice,
  usage,
}: {
  practice: EditablePractice;
  /** What deleting would take with it, shown in the confirmation. */
  usage?: { saves: number; reflections: number; sessions: number; programs: number };
}) {
  const t = useTranslations("Studio.practices.editor");
  const tPractice = useTranslations("Practice");
  const tLibrary = useTranslations("Practices");
  const router = useRouter();
  const [slug, setSlug] = useState(practice.slug);
  const [status, setStatus] = useState(practice.status);
  const [publishing, startPublish] = useTransition();
  const [savingVideo, saveVideo] = useTransition();
  const [deleting, startDelete] = useTransition();
  const isNew = slug === null;

  const form = useForm<PracticeFormValues, unknown, PracticeFormOutput>({
    resolver: zodResolver(practiceFormSchema),
    defaultValues: {
      title: practice.title,
      summary: practice.summary,
      series: practice.series,
      category: practice.category,
      intensityLevel: practice.intensityLevel,
      intensityLabel: practice.intensityLabel,
      props: practice.props,
      durationMinutes: practice.durationMinutes,
      access: practice.access,
      previewSeconds: practice.previewSeconds,
      image: practice.image,
      imageAlt: practice.imageAlt,
      poster: practice.poster ?? "",
      videoUrl: videoLink(practice),
    },
  });
  const videoUrl = useWatch({ control: form.control, name: "videoUrl" });
  const access = useWatch({ control: form.control, name: "access" });
  const selectedVideo = parseVideoAsset(videoUrl);
  const saving = form.formState.isSubmitting;
  const busy = saving || publishing || savingVideo || deleting;
  const bothLanguages = t("validation.bothLanguages");

  useEffect(() => setStatus(practice.status), [practice.status]);
  // Once a new practice is saved it has a slug; the address bar catches up without a
  // re-render that would throw away the form.
  useEffect(() => {
    if (practice.slug === null && slug) window.history.replaceState(null, "", `?edit=${encodeURIComponent(slug)}`);
  }, [practice.slug, slug]);

  const saveError = (error: string) => toast.error(error === "invalid" ? t("invalid") : error === "video" ? t("video.invalid") : t("error"));
  const invalid = () => toast.error(t("invalid"));

  const onSave = form.handleSubmit(async (values) => {
    const result = isNew ? await newPractice(values) : await savePracticeMeta({ slug, ...values });
    if (!result.ok) return saveError(result.error);
    toast.success(isNew ? t("created") : t("saved"));
    // newPractice returns the minted slug; adopt it so a second save edits rather than
    // creating a second practice.
    if (isNew && result.message) setSlug(result.message);
  }, invalid);

  // Publishing saves first, so what goes live is what's on screen.
  const publish = form.handleSubmit(
    (values) =>
      new Promise<void>((resolve) =>
        startPublish(async () => {
          const saved = await savePracticeMeta({ slug, ...values });
          if (saved.ok) {
            const next = status === "published" ? "draft" : "published";
            const result = await publishPractice({ slug, status: next });
            if (result.ok) {
              setStatus(next);
              toast.success(t(next === "published" ? "publishedState" : "draftState"));
            } else toast.error(t(result.error === "video" ? "video.missing" : "error"));
          } else saveError(saved.error);
          resolve();
        }),
      ),
    invalid,
  );

  const onVideo = (url: string) =>
    saveVideo(async () => {
      const result = await attachPracticeVideo({ slug, url });
      if (result.ok) {
        form.setValue("videoUrl", url);
        toast.success(url ? t("video.attached") : t("video.detached"));
      } else toast.error(t("video.invalid"));
    });

  const onDelete = () =>
    startDelete(async () => {
      if (!slug) return;
      const result = await removePractice({ slug });
      if (result.ok) {
        toast.success(t("deleted"));
        router.replace("/instructor/videos");
      } else toast.error(t("error"));
    });

  const localized = (
    name: "title" | "series" | "summary" | "intensityLabel" | "imageAlt",
    label: string,
    extra: Partial<React.ComponentProps<typeof LocalizedField>> = {},
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <LocalizedField label={label} value={field.value} onChange={field.onChange} error={fieldState.invalid ? bothLanguages : undefined} {...extra} />
      )}
    />
  );

  return (
    <form onSubmit={onSave} noValidate className="gap-gutter grid grid-cols-1 items-start xl:grid-cols-12">
      <div className="bg-surface-container-low p-space-md flex flex-wrap items-center justify-between gap-3 rounded-xl xl:col-span-12">
        <div>
          <h2 className="font-headline-sm text-headline-sm">{t(isNew ? "newTitle" : "title")}</h2>
          <Badge variant={status === "published" ? "default" : "secondary"}>{t(status === "published" ? "publishedState" : "draftState")}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild type="button" variant="outline" size="sm">
            <Link href="/instructor/videos">{t("close")}</Link>
          </Button>
          {!isNew && (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void publish()}>
              <EyeIcon data-icon="inline-start" />
              {t(status === "published" ? "unpublish" : "publish")}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={busy}>
            <SaveIcon data-icon="inline-start" />
            {t(isNew ? "create" : "save")}
          </Button>
        </div>
      </div>

      {/* Ingest column (Stitch: 5 of 12) */}
      <section className="gap-space-md bg-surface-container-low p-space-md md:p-space-lg flex flex-col rounded-xl shadow-sm xl:col-span-5">
        <div>
          <span className="font-label-sm text-label-sm text-clay tracking-widest uppercase">{t("video.eyebrow")}</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface mt-1">{t("video.title")}</h2>
        </div>

        <div className="bg-surface p-space-sm flex items-center gap-3 rounded-lg shadow-sm">
          <div className="bg-primary-container/40 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <FilmIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-label-md text-label-md text-on-surface">{videoUrl ? t(isNew ? "video.selected" : "video.present") : t("video.absent")}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate" dir="ltr">
              {videoUrl || t("video.absentHint")}
            </p>
          </div>
          <Badge variant={videoUrl ? "default" : "secondary"} className="shrink-0">
            {videoUrl ? (selectedVideo ? t(`video.providers.${selectedVideo.providerId}`) : t("video.ready")) : t("video.pending")}
          </Badge>
        </div>

        <Controller
          control={form.control}
          name="videoUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="video-url">{t("video.urlLabel")}</FieldLabel>
              <Input
                {...field}
                id="video-url"
                dir="ltr"
                inputMode="url"
                placeholder="https://www.youtube.com/watch?v=…"
                aria-invalid={fieldState.invalid || (!!field.value.trim() && !selectedVideo) || undefined}
              />
              {fieldState.invalid ? <FieldError>{t("validation.video")}</FieldError> : <FieldDescription>{t("video.urlHint")}</FieldDescription>}
            </Field>
          )}
        />

        {selectedVideo?.providerId === "youtube" && (
          <EmbedPlayer src={`https://www.youtube-nocookie.com/embed/${selectedVideo.assetId}?rel=0&playsinline=1`} title="YouTube" />
        )}
        <div className={isNew ? "hidden" : "gap-space-xs flex flex-wrap"}>
          <Button type="button" onClick={() => onVideo(videoUrl.trim())} disabled={isNew || busy || !videoUrl.trim() || !selectedVideo}>
            {savingVideo ? <Spinner data-icon="inline-start" /> : <LinkIcon data-icon="inline-start" />}
            {t("video.attach")}
          </Button>
          {practice.videoAssetId && (
            <Button type="button" variant="outline" onClick={() => onVideo("")} disabled={busy}>
              <UnlinkIcon data-icon="inline-start" />
              {t("video.detach")}
            </Button>
          )}
        </div>

        {isNew && <p className="text-on-surface-variant text-sm">{t("video.savedWithPractice")}</p>}
        <Alert>
          <AlertTitle>{t("video.mockTitle")}</AlertTitle>
          <AlertDescription>{t("video.mockBody")}</AlertDescription>
        </Alert>
      </section>

      {/* Metadata column (Stitch: 7 of 12) */}
      <section className="gap-space-md bg-surface-container-low p-space-md md:p-space-lg flex flex-col rounded-xl shadow-sm xl:col-span-7">
        <div className="gap-space-sm flex flex-wrap items-end justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-clay tracking-widest uppercase">{t("eyebrow")}</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface mt-1">{t("title")}</h2>
          </div>
          <code className="bg-surface font-label-sm text-label-sm text-on-surface-variant rounded px-2 py-1" dir="ltr">
            {slug}
          </code>
        </div>

        <FieldGroup>
          {localized("title", t("fields.title"), { maxLength: 200 })}
          {localized("series", t("fields.series"), { description: t("fields.seriesHint"), maxLength: 200 })}
          {localized("summary", t("fields.summary"), { multiline: true, maxLength: 600 })}

          <div className="gap-space-md grid grid-cols-1 sm:grid-cols-3">
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="category">{t("fields.category")}</FieldLabel>
                  <ResponsiveSelect
                    id="category"
                    label={t("fields.category")}
                    value={field.value}
                    onValueChange={field.onChange}
                    options={practiceCategories.map((c) => ({ value: c, label: tPractice(`categories.${c}`) }))}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="props"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="props">{t("fields.props")}</FieldLabel>
                  <ResponsiveSelect
                    id="props"
                    label={t("fields.props")}
                    value={field.value}
                    onValueChange={field.onChange}
                    options={propSetups.map((p) => ({ value: p, label: tPractice(`props.${p}`) }))}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="durationMinutes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="duration">{t("fields.duration")}</FieldLabel>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    max={600}
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.invalid && <FieldError>{t("validation.duration")}</FieldError>}
                </Field>
              )}
            />
          </div>

          <FieldSet>
            <FieldLegend variant="label">{t("fields.intensity")}</FieldLegend>
            <Controller
              control={form.control}
              name="intensityLevel"
              render={({ field }) => (
                <ToggleGroup type="single" value={field.value} onValueChange={(v) => v && field.onChange(v)} variant="outline" className="w-full">
                  {intensityLevels.map((level) => (
                    <ToggleGroupItem key={level} value={level} className="flex-1">
                      {tLibrary(`intensities.${level}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            />
            {localized("intensityLabel", t("fields.intensityLabel"), { maxLength: 120 })}
          </FieldSet>

          <Controller
            control={form.control}
            name="image"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="practice-image">{t("fields.image")}</FieldLabel>
                <Input {...field} id="practice-image" dir="ltr" placeholder="/images/practices/… or https://…" aria-invalid={fieldState.invalid || undefined} />
                {fieldState.invalid ? <FieldError>{t("validation.image")}</FieldError> : <FieldDescription>{t("fields.imageHint")}</FieldDescription>}
              </Field>
            )}
          />
          {localized("imageAlt", t("fields.imageAlt"), { maxLength: 300 })}
          <Controller
            control={form.control}
            name="poster"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="practice-poster">{t("fields.poster")}</FieldLabel>
                <Input {...field} id="practice-poster" dir="ltr" placeholder={t("fields.posterPlaceholder")} aria-invalid={fieldState.invalid || undefined} />
                {fieldState.invalid ? <FieldError>{t("validation.image")}</FieldError> : <FieldDescription>{t("fields.posterHint")}</FieldDescription>}
              </Field>
            )}
          />

          <FieldSet>
            <FieldLegend variant="label">{t("fields.access")}</FieldLegend>
            <Controller
              control={form.control}
              name="access"
              render={({ field }) => (
                <ToggleGroup type="single" value={field.value} onValueChange={(v) => v && field.onChange(v)} variant="outline" className="w-full">
                  <ToggleGroupItem value="open" className="flex-1">
                    {t("fields.accessOpen")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="members" className="flex-1">
                    {t("fields.accessMembers")}
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            />
            {access === "members" && (
              <Controller
                control={form.control}
                name="previewSeconds"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="preview">{t("fields.preview")}</FieldLabel>
                    <Input
                      id="preview"
                      type="number"
                      min={0}
                      max={3600}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(Number.isFinite(e.target.valueAsNumber) && e.target.valueAsNumber > 0 ? e.target.valueAsNumber : null)}
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid || undefined}
                    />
                    {fieldState.invalid ? <FieldError>{t("validation.preview")}</FieldError> : <FieldDescription>{t("fields.previewHint")}</FieldDescription>}
                  </Field>
                )}
              />
            )}
          </FieldSet>
        </FieldGroup>

        {!!usage?.programs && (
          <Alert>
            <AlertDescription>{t("inUse", { count: usage.programs })}</AlertDescription>
          </Alert>
        )}
        <div className="gap-space-sm border-hairline pt-space-md flex flex-wrap items-center justify-between border-t">
          {slug ? (
            <ResponsiveDialog>
              <ResponsiveDialogTrigger asChild>
                <Button type="button" variant="outline" className="text-destructive" disabled={busy || (usage?.programs ?? 0) > 0}>
                  <Trash2Icon data-icon="inline-start" />
                  {t("delete")}
                </Button>
              </ResponsiveDialogTrigger>
              <ResponsiveDialogContent>
                <ResponsiveDialogHeader>
                  <ResponsiveDialogTitle>{t("delete")}</ResponsiveDialogTitle>
                  <ResponsiveDialogDescription>
                    {usage && (usage.saves > 0 || usage.reflections > 0 || usage.sessions > 0)
                      ? t("deleteUsage", { saves: usage.saves, reflections: usage.reflections, sessions: usage.sessions })
                      : t("deleteBody")}
                  </ResponsiveDialogDescription>
                </ResponsiveDialogHeader>
                <ResponsiveDialogFooter>
                  <ResponsiveDialogClose asChild>
                    <Button type="button" variant="outline">
                      {t("keep")}
                    </Button>
                  </ResponsiveDialogClose>
                  <ResponsiveDialogClose asChild>
                    <Button type="button" variant="destructive" onClick={onDelete}>
                      {t("confirmDelete")}
                    </Button>
                  </ResponsiveDialogClose>
                </ResponsiveDialogFooter>
              </ResponsiveDialogContent>
            </ResponsiveDialog>
          ) : (
            <Badge variant="secondary">{t("draftNotice")}</Badge>
          )}

          <Button type="submit" size="lg" disabled={busy}>
            {saving ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
            {isNew ? t("create") : t("save")}
          </Button>
        </div>
      </section>
    </form>
  );
}
