"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, SaveIcon, SlidersHorizontalIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useMessages, useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { EmbedPlayer } from "@/modules/practices/components/embed-player";
import { parseYouTubeId } from "@/infrastructure/video/assets";
import { isCustomPageSlug } from "@/modules/pages/definitions";
import { pageContentSchema, validCustomContent } from "@/modules/pages/schemas";
import type { CopyTree, PageContent, PageDefinition } from "@/modules/pages/types";
import { pagePreviewPath } from "@/modules/pages/preview";
import type { PageResult } from "@/modules/pages/server/mutations";
import { newWebsitePage, saveWebsitePage, unpublishWebsitePage, removeWebsitePage } from "@/modules/instructor/page-actions";

import { LocalizedField } from "./localized-field";
import { JournalBlockEditor } from "./journal-block-editor";
import { PageCopyFields } from "./page-copy-fields";
import { DeleteContentButton } from "./delete-content-button";
import type { HomeSectionConfig } from "@/modules/home/sections";
import { HomeSectionsEditor } from "./home-sections-editor";

import { MICROCOPY_NAMESPACES } from "@/modules/pages/microcopy";

type PageForm = { slug: string; content: PageContent };

/**
 * The website page editor: existing pages edit their copy and images in both languages; new
 * pages are landing pages built from blocks. react-hook-form validates with the same content
 * schema the server applies; publishing also requires a complete page in both languages.
 */
export function PageEditor({
  initial,
  initialSlug,
  definition,
  template,
  live,
  homeSections,
}: {
  initial: PageContent;
  initialSlug: string | null;
  definition: PageDefinition | null;
  template: PageContent | null;
  live: boolean;
  homeSections?: HomeSectionConfig[];
}) {
  const t = useTranslations("Studio.pages");
  const labels = (
    useMessages() as unknown as {
      Studio: { pages: { assetLabels: Record<string, string>; namespaceLabels: Record<string, string> } };
    }
  ).Studio.pages;
  const router = useRouter();
  const [savedSlug, setSavedSlug] = useState(initialSlug);
  const [customSlug, setCustomSlug] = useState(false);
  const [publishing, startPublish] = useTransition();
  const [published, setPublished] = useState(live);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isNew = savedSlug === null;
  const builtin = !!definition;
  useEffect(() => setPublished(live), [live]);

  // A new page's address must be free and well-formed; existing pages keep theirs.
  const schema = z.object({
    slug: isNew ? z.string().refine(isCustomPageSlug, "reserved") : z.string(),
    content: pageContentSchema,
  });
  const form = useForm<z.input<typeof schema>, unknown, PageForm>({
    resolver: zodResolver(schema),
    defaultValues: { slug: initialSlug ?? "", content: initial },
  });
  const saving = form.formState.isSubmitting;
  const busy = saving || publishing;
  const videoUrl = useWatch({ control: form.control, name: "content.videoUrl" });
  const videoId = parseYouTubeId(videoUrl);

  const fail = (result: PageResult) => {
    if (!result.ok) toast.error(t(`errors.${result.error}`));
  };
  const save = async ({ slug, content }: PageForm, publish = false) => {
    if (publish && !builtin && !validCustomContent(content, true)) {
      toast.error(t("errors.incomplete"));
      return;
    }
    let result: PageResult;
    if (isNew) {
      result = await newWebsitePage({ slug, content });
      if (result.ok) {
        setSavedSlug(result.slug);
        router.replace(`/instructor/pages?edit=${encodeURIComponent(result.slug)}`);
        if (publish) result = await saveWebsitePage({ slug: result.slug, content, publish: true });
      }
    } else result = await saveWebsitePage({ slug: savedSlug, content, publish });
    if (!result.ok) return fail(result);
    if (publish) setPublished(true);
    toast.success(t(publish ? "published" : "saved"));
  };
  const invalid = () => toast.error(t("errors.invalid"));
  const onSave = form.handleSubmit((values) => save(values), invalid);
  const onPublish = form.handleSubmit(
    (values) => new Promise<void>((resolve) => startPublish(async () => (await save(values, true), resolve()))),
    invalid,
  );

  const localized = (
    name: "content.title" | "content.description" | "content.seoTitle" | "content.imageAlt" | "content.actionLabel",
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
          disabled={busy}
          onChange={field.onChange}
          error={fieldState.invalid ? t("validation.bothLanguages") : undefined}
          {...extra}
        />
      )}
    />
  );
  const link = (name: "content.image" | "content.videoUrl" | "content.actionHref", id: string, label: string, placeholder: string, hint: string | null, error: string) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input {...field} id={id} dir="ltr" disabled={busy} placeholder={placeholder} aria-invalid={fieldState.invalid || undefined} />
          {fieldState.invalid ? <FieldError>{error}</FieldError> : hint && <FieldDescription>{hint}</FieldDescription>}
        </Field>
      )}
    />
  );

  return (
    <form onSubmit={onSave} noValidate className="gap-space-lg bg-surface-container-low p-space-md md:p-space-lg flex flex-col rounded-xl">
      <header className="border-hairline flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="font-headline-sm text-headline-sm">{t(isNew ? "newPage" : "editPage")}</h2>
          <Badge className="mt-2" variant={published ? "default" : "secondary"}>
            {t(published ? "live" : "draft")}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/instructor/pages">{t("close")}</Link>
          </Button>
          {!isNew && (published || builtin) && (
            <Button asChild variant="outline" size="sm">
              <Link href={definition?.path ?? `/${savedSlug}`} target="_blank">
                {t("viewLive")}
              </Link>
            </Button>
          )}
          {!isNew && (
            <Button asChild variant="outline" size="sm">
              <Link href={pagePreviewPath(savedSlug)} target="_blank">
                {t("preview")}
              </Link>
            </Button>
          )}
          <Button type="submit" variant="outline" size="sm" disabled={busy}>
            {saving ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
            {t(isNew ? "createDraft" : "saveDraft")}
          </Button>
          {!isNew && (
            <Button type="button" size="sm" disabled={busy} onClick={() => void onPublish()}>
              <EyeIcon data-icon="inline-start" />
              {t("publish")}
            </Button>
          )}
        </div>
      </header>
      <Alert>
        <AlertDescription>{t("draftHint")}</AlertDescription>
      </Alert>
      {savedSlug === "home" && homeSections && (
        <HomeSectionsEditor initialSections={homeSections} />
      )}
      {!builtin && (
        <FieldGroup>
          <Controller
            control={form.control}
            name="content.title"
            render={({ field, fieldState }) => (
              <LocalizedField
                label={t("fields.title")}
                value={field.value}
                maxLength={200}
                disabled={busy}
                error={fieldState.invalid ? t("validation.bothLanguages") : undefined}
                onChange={(value) => {
                  field.onChange(value);
                  // A new page's address follows its English title until edited by hand.
                  if (isNew && !customSlug)
                    form.setValue(
                      "slug",
                      value.en
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "")
                        .slice(0, 80),
                    );
                }}
              />
            )}
          />
          <Controller
            control={form.control}
            name="slug"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="page-slug">{t("fields.url")}</FieldLabel>
                <Input
                  id="page-slug"
                  dir="ltr"
                  value={field.value}
                  onBlur={field.onBlur}
                  disabled={!isNew || busy}
                  placeholder="retreats"
                  aria-invalid={fieldState.invalid || undefined}
                  onChange={(event) => {
                    setCustomSlug(true);
                    field.onChange(event.target.value.toLowerCase());
                  }}
                />
                {fieldState.invalid ? <FieldError>{t("errors.reserved")}</FieldError> : <FieldDescription>{t("urlHint")}</FieldDescription>}
              </Field>
            )}
          />
          {localized("content.description", t("fields.description"), { multiline: true, maxLength: 1600 })}
          {localized("content.seoTitle", t("fields.seoTitle"), { maxLength: 200, description: t("seoHint") })}
          {link("content.image", "page-image", t("fields.image"), "/images/… or https://…", t("imageHint"), t("validation.image"))}
          {localized("content.imageAlt", t("fields.imageAlt"), { maxLength: 300 })}
          {link("content.videoUrl", "page-video", t("fields.video"), "https://youtu.be/…", null, t("validation.video"))}
          {videoId && <EmbedPlayer src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`} title="YouTube" />}
          <Controller
            control={form.control}
            name="content.body"
            render={({ field }) => <JournalBlockEditor body={field.value} disabled={busy} context="pages" onChange={field.onChange} />}
          />
          {localized("content.actionLabel", t("fields.actionLabel"), { maxLength: 200 })}
          {link("content.actionHref", "page-action", t("fields.actionHref"), "/membership", t("linkHint"), t("validation.link"))}
          <Controller
            control={form.control}
            name="content.showInNavigation"
            render={({ field }) => (
              <Field orientation="horizontal" className="justify-between">
                <FieldLabel htmlFor="page-navigation">{t("fields.navigation")}</FieldLabel>
                <Switch id="page-navigation" checked={field.value ?? false} disabled={busy} onCheckedChange={field.onChange} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="content.showInFooter"
            render={({ field }) => (
              <Field orientation="horizontal" className="justify-between">
                <FieldLabel htmlFor="page-footer">{t("fields.footer")}</FieldLabel>
                <Switch id="page-footer" checked={field.value} disabled={busy} onCheckedChange={field.onChange} />
              </Field>
            )}
          />
        </FieldGroup>
      )}
      {definition && template && (
        <>
          {definition.manage && (
            <p className="text-on-surface-variant text-sm">
              {t("collectionHint")}{" "}
              <Link className="text-primary underline" href={definition.manage}>
                {t("manageCollection")}
              </Link>
            </p>
          )}
          {definition.settings && (
            <p className="text-on-surface-variant text-sm">
              {t("settingsHint")}{" "}
              <Link className="text-primary underline" href={definition.settings}>
                {t("openSettings")}
              </Link>
            </p>
          )}
          {Object.keys(definition.assets).length > 0 && (
            <Controller
              control={form.control}
              name="content.assets"
              render={({ field }) => (
                <section className="flex flex-col gap-4">
                  <h3 className="font-semibold">{t("assetsTitle")}</h3>
                  {Object.keys(definition.assets).map((key) => (
                    <Field key={key}>
                      <FieldLabel htmlFor={`asset-${key}`}>{labels.assetLabels[key] ?? key}</FieldLabel>
                      <Input
                        id={`asset-${key}`}
                        dir="ltr"
                        value={field.value[key] ?? definition.assets[key]}
                        disabled={busy}
                        onChange={(event) => field.onChange({ ...field.value, [key]: event.target.value })}
                      />
                    </Field>
                  ))}
                  <p className="text-on-surface-variant text-sm">{t("imageHint")}</p>
                </section>
              )}
            />
          )}
          {/* Namespaces like "Legal.privacy" contain dots, so the copy is one controlled value. */}
          <Controller
            control={form.control}
            name="content.copy"
            render={({ field }) => {
              const marketingNamespaces = definition.namespaces.filter(
                (ns) => !MICROCOPY_NAMESPACES.has(ns),
              );
              const advancedNamespaces = definition.namespaces.filter(
                (ns) => MICROCOPY_NAMESPACES.has(ns),
              );
              const hasMarketing = marketingNamespaces.length > 0;
              const primaryNamespaces = hasMarketing
                ? marketingNamespaces
                : definition.namespaces;
              const secondaryNamespaces = hasMarketing
                ? advancedNamespaces
                : [];

              return (
                <div className="flex flex-col gap-8">
                  {/* Advanced microcopy toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 p-4 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <SlidersHorizontalIcon className="size-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-on-surface">
                          {t("advancedToggleTitle")}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {t("advancedToggleHint")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="advanced-copy-toggle"
                        checked={showAdvanced}
                        onCheckedChange={setShowAdvanced}
                        aria-label={t("advancedToggleTitle")}
                      />
                    </div>
                  </div>

                  {/* Primary / Marketing namespaces */}
                  {primaryNamespaces.map((namespace) => (
                    <section key={namespace} className="flex flex-col gap-5">
                      <h3 className="font-headline-sm text-headline-sm">
                        {labels.namespaceLabels[namespace.replaceAll(".", "_")] ??
                          namespace}
                      </h3>
                      <PageCopyFields
                        en={field.value.en[namespace] as CopyTree}
                        fa={field.value.fa[namespace] as CopyTree}
                        templateEn={template.copy.en[namespace]!}
                        templateFa={template.copy.fa[namespace]!}
                        label={namespace}
                        disabled={busy}
                        showAdvanced={showAdvanced}
                        onChange={(en, fa) =>
                          field.onChange({
                            en: { ...field.value.en, [namespace]: en },
                            fa: { ...field.value.fa, [namespace]: fa },
                          })
                        }
                      />
                    </section>
                  ))}

                  {/* Dedicated container for advanced / microcopy namespaces when enabled */}
                  {showAdvanced && secondaryNamespaces.length > 0 && (
                    <div className="flex flex-col gap-6 rounded-2xl border border-clay/30 bg-surface-container-low/30 p-5">
                      <div className="flex flex-col gap-1 border-b border-outline-variant/20 pb-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-clay/40 bg-clay/10 text-clay text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                          >
                            {t("advancedBadge")}
                          </Badge>
                          <h4 className="font-semibold text-on-surface text-base">
                            {t("advancedMicrocopySection")}
                          </h4>
                        </div>
                        <p className="text-xs text-on-surface-variant">
                          {t("advancedMicrocopyDesc")}
                        </p>
                      </div>
                      {secondaryNamespaces.map((namespace) => (
                        <section key={namespace} className="flex flex-col gap-4">
                          <h3 className="font-headline-sm text-headline-sm">
                            {labels.namespaceLabels[
                              namespace.replaceAll(".", "_")
                            ] ?? namespace}
                          </h3>
                          <PageCopyFields
                            en={field.value.en[namespace] as CopyTree}
                            fa={field.value.fa[namespace] as CopyTree}
                            templateEn={template.copy.en[namespace]!}
                            templateFa={template.copy.fa[namespace]!}
                            label={namespace}
                            disabled={busy}
                            showAdvanced={showAdvanced}
                            onChange={(en, fa) =>
                              field.onChange({
                                en: { ...field.value.en, [namespace]: en },
                                fa: { ...field.value.fa, [namespace]: fa },
                              })
                            }
                          />
                        </section>
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          />
        </>
      )}
      <footer className="border-hairline flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <div className="flex flex-wrap gap-2">
          {!isNew && !builtin && (
            <>
              {published && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    startPublish(async () => {
                      const result = await unpublishWebsitePage({ slug: savedSlug });
                      if (result.ok) {
                        setPublished(false);
                        toast.success(t("unpublished"));
                      } else fail(result);
                    })
                  }
                >
                  {t("unpublish")}
                </Button>
              )}
              <DeleteContentButton
                label={t("delete")}
                title={t("deleteTitle")}
                description={t("deleteBody")}
                cancelLabel={t("keep")}
                confirmLabel={t("delete")}
                disabled={busy}
                onConfirm={async () => {
                  const result = await removeWebsitePage({ slug: savedSlug });
                  if (!result.ok) {
                    fail(result);
                    return false;
                  }
                  toast.success(t("deleted"));
                  router.replace("/instructor/pages");
                  return true;
                }}
              />
            </>
          )}
        </div>
        <Button type="submit" disabled={busy}>
          {saving ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
          {t(isNew ? "createDraft" : "saveDraft")}
        </Button>
      </footer>
    </form>
  );
}
