"use client";

import {
  FilmIcon,
  LinkIcon,
  LoaderCircleIcon,
  SaveIcon,
  Trash2Icon,
  UnlinkIcon,
  EyeIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useState, useTransition } from "react";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EmbedPlayer } from "@/modules/practices/components/embed-player";
import { parseVideoAsset } from "@/infrastructure/video/assets";
import type { Localized } from "@/lib/localized";
import {
  attachPracticeVideo,
  newPractice,
  publishPractice,
  removePractice,
  savePracticeMeta,
} from "@/modules/instructor/actions";
import { LocalizedField } from "./localized-field";
import {
  intensityLevels,
  practiceCategories,
  propSetups,
  type IntensityLevel,
  type PracticeAccess,
  type PracticeCategory,
  type PropSetup,
} from "@/modules/practices/types";

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

/**
 * The bilingual practice editor saves metadata and a hosted video link together.
 */
export function PracticeEditor({
  practice,
  usage,
}: {
  practice: EditablePractice;
  /** What deleting would take with it, shown in the confirmation. */
  usage?: {
    saves: number;
    reflections: number;
    sessions: number;
    programs: number;
  };
}) {
  const t = useTranslations("Studio.practices.editor");
  const tPractice = useTranslations("Practice");
  const tLibrary = useTranslations("Practices");
  const router = useRouter();
  const [form, setForm] = useState(practice);
  const [videoUrl, setVideoUrl] = useState(
    practice.videoProvider === "youtube" && practice.videoAssetId
      ? `https://youtu.be/${practice.videoAssetId}`
      : practice.videoProvider === "aparat" && practice.videoAssetId
        ? `https://www.aparat.com/v/${practice.videoAssetId}`
        : (practice.videoAssetId ?? ""),
  );
  const [status, setStatus] = useState(practice.status);
  const selectedVideo = parseVideoAsset(videoUrl);
  useEffect(() => setStatus(practice.status), [practice.status]);
  const [savingMeta, saveMeta] = useTransition();
  const [savingVideo, saveVideo] = useTransition();
  const [deleting, startDelete] = useTransition();
  const isNew = form.slug === null;

  // Once a new practice is saved it has a slug; the address bar catches up without a
  // re-render that would throw away the form.
  useEffect(() => {
    if (practice.slug === null && form.slug)
      window.history.replaceState(
        null,
        "",
        `?edit=${encodeURIComponent(form.slug)}`,
      );
  }, [practice.slug, form.slug]);

  const onDelete = () =>
    startDelete(async () => {
      if (!form.slug) return;
      const result = await removePractice({ slug: form.slug });
      if (result.ok) {
        toast.success(t("deleted"));
        router.replace("/instructor/videos");
      } else toast.error(t("error"));
    });

  const set = <K extends keyof EditablePractice>(
    key: K,
    value: EditablePractice[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const fields = () => ({
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
    image:
      form.image.trim() ||
      (selectedVideo?.providerId === "youtube"
        ? `https://i.ytimg.com/vi/${selectedVideo.assetId}/hqdefault.jpg`
        : ""),
    imageAlt: {
      en: form.imageAlt.en.trim() || form.title.en,
      fa: form.imageAlt.fa.trim() || form.title.fa,
    },
    videoUrl: videoUrl.trim(),
    poster: form.poster?.trim() ? form.poster.trim() : null,
  });

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoUrl.trim() && !selectedVideo) {
      toast.error(t("video.invalid"));
      return;
    }
    saveMeta(async () => {
      const result = isNew
        ? await newPractice(fields())
        : await savePracticeMeta({ slug: form.slug, ...fields() });
      if (!result.ok) {
        toast.error(
          result.error === "invalid"
            ? t("invalid")
            : result.error === "video"
              ? t("video.invalid")
              : t("error"),
        );
        return;
      }
      toast.success(isNew ? t("created") : t("saved"));
      // newPractice returns the minted slug; adopt it so a second save edits rather than
      // creating a second practice.
      if (isNew && result.message)
        setForm((f) => ({ ...f, slug: result.message ?? null }));
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
    <form
      onSubmit={onSave}
      className="gap-gutter grid grid-cols-1 items-start xl:grid-cols-12"
    >
      <div className="bg-surface-container-low p-space-md flex flex-wrap items-center justify-between gap-3 rounded-xl xl:col-span-12">
        <div>
          <h2 className="font-headline-sm text-headline-sm">
            {t(isNew ? "newTitle" : "title")}
          </h2>
          <Badge variant={status === "published" ? "default" : "secondary"}>
            {t(status === "published" ? "publishedState" : "draftState")}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild type="button" variant="outline" size="sm">
            <Link href="/instructor/videos">{t("close")}</Link>
          </Button>
          {!isNew && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={savingMeta || savingVideo || deleting}
              onClick={() =>
                saveMeta(async () => {
                  const saved = await savePracticeMeta({
                    slug: form.slug,
                    ...fields(),
                  });
                  if (!saved.ok) {
                    toast.error(
                      saved.error === "video"
                        ? t("video.invalid")
                        : t("invalid"),
                    );
                    return;
                  }
                  const next = status === "published" ? "draft" : "published";
                  const result = await publishPractice({
                    slug: form.slug,
                    status: next,
                  });
                  if (result.ok) {
                    setStatus(next);
                    toast.success(
                      t(next === "published" ? "publishedState" : "draftState"),
                    );
                  } else
                    toast.error(
                      t(result.error === "video" ? "video.missing" : "error"),
                    );
                })
              }
            >
              <EyeIcon data-icon="inline-start" />
              {t(status === "published" ? "unpublish" : "publish")}
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={savingMeta || savingVideo || deleting}
          >
            <SaveIcon data-icon="inline-start" />
            {t(isNew ? "create" : "save")}
          </Button>
        </div>
      </div>
      {/* Ingest column (Stitch: 5 of 12) */}
      <section className="gap-space-md bg-surface-container-low p-space-md md:p-space-lg flex flex-col rounded-xl shadow-sm xl:col-span-5">
        <div>
          <span className="font-label-sm text-label-sm text-clay tracking-widest uppercase">
            {t("video.eyebrow")}
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface mt-1">
            {t("video.title")}
          </h2>
        </div>

        <div className="bg-surface p-space-sm flex items-center gap-3 rounded-lg shadow-sm">
          <div className="bg-primary-container/40 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <FilmIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-label-md text-label-md text-on-surface">
              {videoUrl
                ? t(isNew ? "video.selected" : "video.present")
                : t("video.absent")}
            </p>
            <p
              className="font-body-sm text-body-sm text-on-surface-variant truncate"
              dir="ltr"
            >
              {videoUrl || t("video.absentHint")}
            </p>
          </div>
          <Badge
            variant={videoUrl ? "default" : "secondary"}
            className="shrink-0"
          >
            {videoUrl
              ? selectedVideo
                ? t(`video.providers.${selectedVideo.providerId}`)
                : t("video.ready")
              : t("video.pending")}
          </Badge>
        </div>

        <Field>
          <FieldLabel htmlFor="video-url">{t("video.urlLabel")}</FieldLabel>
          <Input
            id="video-url"
            dir="ltr"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=…"
            aria-invalid={!!videoUrl.trim() && !selectedVideo}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <FieldDescription>{t("video.urlHint")}</FieldDescription>
        </Field>

        {selectedVideo?.providerId === "youtube" && (
          <EmbedPlayer
            src={`https://www.youtube-nocookie.com/embed/${selectedVideo.assetId}?rel=0&playsinline=1`}
            title="YouTube"
          />
        )}
        <div className={isNew ? "hidden" : "gap-space-xs flex flex-wrap"}>
          <Button
            type="button"
            onClick={() => onVideo(videoUrl.trim())}
            disabled={isNew || savingVideo || savingMeta || !videoUrl.trim()}
          >
            {savingVideo ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : (
              <LinkIcon data-icon="inline-start" />
            )}
            {t("video.attach")}
          </Button>
          {practice.videoAssetId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onVideo("")}
              disabled={savingVideo}
            >
              <UnlinkIcon data-icon="inline-start" />
              {t("video.detach")}
            </Button>
          )}
        </div>

        {isNew && (
          <p className="text-on-surface-variant text-sm">
            {t("video.savedWithPractice")}
          </p>
        )}
        <Alert>
          <AlertTitle>{t("video.mockTitle")}</AlertTitle>
          <AlertDescription>{t("video.mockBody")}</AlertDescription>
        </Alert>
      </section>

      {/* Metadata column (Stitch: 7 of 12) */}
      <section className="gap-space-md bg-surface-container-low p-space-md md:p-space-lg flex flex-col rounded-xl shadow-sm xl:col-span-7">
        <div className="gap-space-sm flex flex-wrap items-end justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-clay tracking-widest uppercase">
              {t("eyebrow")}
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface mt-1">
              {t("title")}
            </h2>
          </div>
          <code
            className="bg-surface font-label-sm text-label-sm text-on-surface-variant rounded px-2 py-1"
            dir="ltr"
          >
            {form.slug}
          </code>
        </div>

        <FieldGroup>
          <LocalizedField
            label={t("fields.title")}
            value={form.title}
            onChange={(v) => set("title", v)}
            maxLength={200}
          />
          <LocalizedField
            label={t("fields.series")}
            description={t("fields.seriesHint")}
            value={form.series}
            onChange={(v) => set("series", v)}
            maxLength={200}
          />
          <LocalizedField
            label={t("fields.summary")}
            value={form.summary}
            onChange={(v) => set("summary", v)}
            multiline
            maxLength={600}
          />

          <div className="gap-space-md grid grid-cols-1 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="category">{t("fields.category")}</FieldLabel>
              <ResponsiveSelect
                id="category"
                label={t("fields.category")}
                value={form.category}
                onValueChange={(v) => set("category", v as PracticeCategory)}
                options={practiceCategories.map((c) => ({
                  value: c,
                  label: tPractice(`categories.${c}`),
                }))}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="props">{t("fields.props")}</FieldLabel>
              <ResponsiveSelect
                id="props"
                label={t("fields.props")}
                value={form.props}
                onValueChange={(v) => set("props", v as PropSetup)}
                options={propSetups.map((p) => ({
                  value: p,
                  label: tPractice(`props.${p}`),
                }))}
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
              onValueChange={(v) =>
                v && set("intensityLevel", v as IntensityLevel)
              }
              variant="outline"
              className="w-full"
            >
              {intensityLevels.map((level) => (
                <ToggleGroupItem key={level} value={level} className="flex-1">
                  {tLibrary(`intensities.${level}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <LocalizedField
              label={t("fields.intensityLabel")}
              value={form.intensityLabel}
              onChange={(v) => set("intensityLabel", v)}
              maxLength={120}
            />
          </FieldSet>

          <Field>
            <FieldLabel htmlFor="practice-image">
              {t("fields.image")}
            </FieldLabel>
            <Input
              id="practice-image"
              dir="ltr"
              placeholder="/images/practices/… or https://…"
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
            />
            <FieldDescription>{t("fields.imageHint")}</FieldDescription>
          </Field>
          <LocalizedField
            label={t("fields.imageAlt")}
            value={form.imageAlt}
            onChange={(v) => set("imageAlt", v)}
            maxLength={300}
          />
          <Field>
            <FieldLabel htmlFor="practice-poster">
              {t("fields.poster")}
            </FieldLabel>
            <Input
              id="practice-poster"
              dir="ltr"
              placeholder={t("fields.posterPlaceholder")}
              value={form.poster ?? ""}
              onChange={(e) => set("poster", e.target.value)}
            />
            <FieldDescription>{t("fields.posterHint")}</FieldDescription>
          </Field>

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
                  onChange={(e) =>
                    set("previewSeconds", Number(e.target.value) || null)
                  }
                />
                <FieldDescription>{t("fields.previewHint")}</FieldDescription>
              </Field>
            )}
          </FieldSet>
        </FieldGroup>

        {!!usage?.programs && (
          <Alert>
            <AlertDescription>
              {t("inUse", { count: usage.programs })}
            </AlertDescription>
          </Alert>
        )}
        <div className="gap-space-sm border-hairline pt-space-md flex flex-wrap items-center justify-between border-t">
          {form.slug ? (
            <ResponsiveDialog>
              <ResponsiveDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive"
                  disabled={
                    savingMeta || deleting || (usage?.programs ?? 0) > 0
                  }
                >
                  <Trash2Icon data-icon="inline-start" />
                  {t("delete")}
                </Button>
              </ResponsiveDialogTrigger>
              <ResponsiveDialogContent>
                <ResponsiveDialogHeader>
                  <ResponsiveDialogTitle>{t("delete")}</ResponsiveDialogTitle>
                  <ResponsiveDialogDescription>
                    {usage &&
                    (usage.saves > 0 ||
                      usage.reflections > 0 ||
                      usage.sessions > 0)
                      ? t("deleteUsage", {
                          saves: usage.saves,
                          reflections: usage.reflections,
                          sessions: usage.sessions,
                        })
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
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={onDelete}
                    >
                      {t("confirmDelete")}
                    </Button>
                  </ResponsiveDialogClose>
                </ResponsiveDialogFooter>
              </ResponsiveDialogContent>
            </ResponsiveDialog>
          ) : (
            <Badge variant="secondary">{t("draftNotice")}</Badge>
          )}

          <Button type="submit" size="lg" disabled={savingMeta}>
            {savingMeta ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : (
              <SaveIcon data-icon="inline-start" />
            )}
            {isNew ? t("create") : t("save")}
          </Button>
        </div>
      </section>
    </form>
  );
}
