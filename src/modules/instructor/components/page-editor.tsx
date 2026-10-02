"use client";

import { EyeIcon, SaveIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useMessages, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmbedPlayer } from "@/modules/practices/components/embed-player";
import { parseYouTubeId } from "@/infrastructure/video/assets";
import type { PageContent, PageDefinition } from "@/modules/pages/types";
import { pagePreviewPath } from "@/modules/pages/preview";
import type { PageResult } from "@/modules/pages/server/mutations";
import {
  newWebsitePage,
  saveWebsitePage,
  unpublishWebsitePage,
  removeWebsitePage,
} from "@/modules/instructor/page-actions";
import { LocalizedField } from "./localized-field";
import { JournalBlockEditor } from "./journal-block-editor";
import { PageCopyFields } from "./page-copy-fields";
import { DeleteContentButton } from "./delete-content-button";

export function PageEditor({
  initial,
  initialSlug,
  definition,
  template,
  live,
}: {
  initial: PageContent;
  initialSlug: string | null;
  definition: PageDefinition | null;
  template: PageContent | null;
  live: boolean;
}) {
  const t = useTranslations("Studio.pages");
  const labels = (
    useMessages() as unknown as {
      Studio: {
        pages: {
          assetLabels: Record<string, string>;
          namespaceLabels: Record<string, string>;
        };
      };
    }
  ).Studio.pages;
  const router = useRouter();
  const [content, setContent] = useState(initial);
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [savedSlug, setSavedSlug] = useState(initialSlug);
  const [customSlug, setCustomSlug] = useState(false);
  const [pending, start] = useTransition();
  const [published, setPublished] = useState(live);
  const isNew = savedSlug === null;
  const builtin = !!definition;
  useEffect(() => setPublished(live), [live]);

  const set = <K extends keyof PageContent>(key: K, value: PageContent[K]) =>
    setContent((current) => ({ ...current, [key]: value }));
  const fail = (result: PageResult) => {
    if (!result.ok) toast.error(t(`errors.${result.error}`));
  };
  const save = async (publish = false) => {
    let result: PageResult;
    if (isNew) {
      result = await newWebsitePage({ slug, content });
      if (result.ok) {
        setSavedSlug(result.slug);
        router.replace(
          `/instructor/pages?edit=${encodeURIComponent(result.slug)}`,
        );
        if (publish)
          result = await saveWebsitePage({
            slug: result.slug,
            content,
            publish: true,
          });
      }
    } else
      result = await saveWebsitePage({ slug: savedSlug, content, publish });
    if (!result.ok) {
      fail(result);
      return;
    }
    if (publish) setPublished(true);
    toast.success(t(publish ? "published" : "saved"));
  };
  const videoId = parseYouTubeId(content.videoUrl);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        start(() => save());
      }}
      className="gap-space-lg bg-surface-container-low p-space-md md:p-space-lg flex flex-col rounded-xl"
    >
      <header className="border-hairline flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="font-headline-sm text-headline-sm">
            {t(isNew ? "newPage" : "editPage")}
          </h2>
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
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            <SaveIcon data-icon="inline-start" />
            {t(isNew ? "createDraft" : "saveDraft")}
          </Button>
          {!isNew && (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => start(() => save(true))}
            >
              <EyeIcon data-icon="inline-start" />
              {t("publish")}
            </Button>
          )}
        </div>
      </header>
      <Alert>
        <AlertDescription>{t("draftHint")}</AlertDescription>
      </Alert>
      {!builtin && (
        <>
          <LocalizedField
            label={t("fields.title")}
            value={content.title}
            maxLength={200}
            disabled={pending}
            onChange={(value) => {
              set("title", value);
              if (isNew && !customSlug)
                setSlug(
                  value.en
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "")
                    .slice(0, 80),
                );
            }}
          />
          <Field>
            <FieldLabel htmlFor="page-slug">{t("fields.url")}</FieldLabel>
            <Input
              id="page-slug"
              dir="ltr"
              value={slug}
              disabled={!isNew || pending}
              placeholder="retreats"
              onChange={(event) => {
                setCustomSlug(true);
                setSlug(event.target.value.toLowerCase());
              }}
            />
            <FieldDescription>{t("urlHint")}</FieldDescription>
          </Field>
          <LocalizedField
            label={t("fields.description")}
            value={content.description}
            multiline
            maxLength={1600}
            disabled={pending}
            onChange={(value) => set("description", value)}
          />
          <LocalizedField
            label={t("fields.seoTitle")}
            value={content.seoTitle}
            maxLength={200}
            disabled={pending}
            description={t("seoHint")}
            onChange={(value) => set("seoTitle", value)}
          />
          <Field>
            <FieldLabel htmlFor="page-image">{t("fields.image")}</FieldLabel>
            <Input
              id="page-image"
              dir="ltr"
              value={content.image}
              disabled={pending}
              placeholder="/images/… or https://…"
              onChange={(event) => set("image", event.target.value)}
            />
            <FieldDescription>{t("imageHint")}</FieldDescription>
          </Field>
          <LocalizedField
            label={t("fields.imageAlt")}
            value={content.imageAlt}
            maxLength={300}
            disabled={pending}
            onChange={(value) => set("imageAlt", value)}
          />
          <Field>
            <FieldLabel htmlFor="page-video">{t("fields.video")}</FieldLabel>
            <Input
              id="page-video"
              dir="ltr"
              value={content.videoUrl}
              disabled={pending}
              placeholder="https://youtu.be/…"
              onChange={(event) => set("videoUrl", event.target.value)}
            />
          </Field>
          {videoId && (
            <EmbedPlayer
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`}
              title={content.title.en || "YouTube"}
            />
          )}
          <JournalBlockEditor
            body={content.body}
            disabled={pending}
            context="pages"
            onChange={(value) => set("body", value)}
          />
          <LocalizedField
            label={t("fields.actionLabel")}
            value={content.actionLabel}
            maxLength={200}
            disabled={pending}
            onChange={(value) => set("actionLabel", value)}
          />
          <Field>
            <FieldLabel htmlFor="page-action">
              {t("fields.actionHref")}
            </FieldLabel>
            <Input
              id="page-action"
              dir="ltr"
              value={content.actionHref}
              disabled={pending}
              placeholder="/membership"
              onChange={(event) => set("actionHref", event.target.value)}
            />
            <FieldDescription>{t("linkHint")}</FieldDescription>
          </Field>
          <Field className="flex-row items-center justify-between">
            <FieldLabel htmlFor="page-navigation">
              {t("fields.navigation")}
            </FieldLabel>
            <Switch
              id="page-navigation"
              checked={content.showInNavigation ?? false}
              disabled={pending}
              onCheckedChange={(value) => set("showInNavigation", value)}
            />
          </Field>
          <Field className="flex-row items-center justify-between">
            <FieldLabel htmlFor="page-footer">{t("fields.footer")}</FieldLabel>
            <Switch
              id="page-footer"
              checked={content.showInFooter}
              disabled={pending}
              onCheckedChange={(value) => set("showInFooter", value)}
            />
          </Field>
        </>
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
          {Object.keys(content.assets).length > 0 && (
            <section className="flex flex-col gap-4">
              <h3 className="font-semibold">{t("assetsTitle")}</h3>
              {Object.keys(definition.assets).map((key) => (
                <Field key={key}>
                  <FieldLabel htmlFor={`asset-${key}`}>
                    {labels.assetLabels[key] ?? key}
                  </FieldLabel>
                  <Input
                    id={`asset-${key}`}
                    dir="ltr"
                    value={content.assets[key] ?? definition.assets[key]}
                    disabled={pending}
                    onChange={(event) =>
                      set("assets", {
                        ...content.assets,
                        [key]: event.target.value,
                      })
                    }
                  />
                </Field>
              ))}
              <p className="text-on-surface-variant text-sm">
                {t("imageHint")}
              </p>
            </section>
          )}
          {definition.namespaces.map((namespace) => (
            <section key={namespace} className="flex flex-col gap-5">
              <h3 className="font-headline-sm text-headline-sm">
                {labels.namespaceLabels[namespace.replaceAll(".", "_")] ??
                  namespace}
              </h3>
              <PageCopyFields
                en={content.copy.en[namespace]!}
                fa={content.copy.fa[namespace]!}
                templateEn={template.copy.en[namespace]!}
                templateFa={template.copy.fa[namespace]!}
                label={namespace}
                disabled={pending}
                onChange={(en, fa) =>
                  set("copy", {
                    en: { ...content.copy.en, [namespace]: en },
                    fa: { ...content.copy.fa, [namespace]: fa },
                  })
                }
              />
            </section>
          ))}
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
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const result = await unpublishWebsitePage({
                        slug: savedSlug,
                      });
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
                disabled={pending}
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
        <Button type="submit" disabled={pending}>
          <SaveIcon data-icon="inline-start" />
          {t(isNew ? "createDraft" : "saveDraft")}
        </Button>
      </footer>
    </form>
  );
}
