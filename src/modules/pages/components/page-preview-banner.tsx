import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getPathname } from "@/i18n/navigation";
import { localize } from "@/lib/localized";
import { pageDefinition } from "../definitions";
import { getBuiltinPagePreview } from "../server/request";
import { PagePreviewNavigation } from "./page-preview-navigation";

export async function PagePreviewBanner() {
  const preview = await getBuiltinPagePreview();
  if (!preview) return null;
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Studio.pages"),
  ]);
  const definition = pageDefinition(preview.slug)!;
  return (
    <aside
      data-slot="page-draft-preview"
      className="border-primary/20 bg-secondary-fixed/70 text-on-surface px-margin-mobile md:px-margin flex flex-wrap items-center justify-between gap-3 border-b py-3 text-sm"
    >
      <Suspense fallback={null}>
        <PagePreviewNavigation slug={preview.slug} />
      </Suspense>
      <div className="min-w-0">
        <p className="font-semibold">
          {t("previewTitle", { title: localize(definition.title, locale) })}
        </p>
        <p className="text-on-surface-variant mt-1">{t("previewHint")}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-4">
        <a
          href={getPathname({
            locale,
            href: `/instructor/pages?edit=${preview.slug}`,
          })}
          className="text-primary underline underline-offset-4"
        >
          {t("edit")}
        </a>
        <a
          href={getPathname({ locale, href: definition.path })}
          className="text-primary underline underline-offset-4"
        >
          {t("viewLive")}
        </a>
      </div>
    </aside>
  );
}
