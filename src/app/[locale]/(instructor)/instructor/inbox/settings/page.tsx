import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StudioCrumb } from "@/components/layout/studio-breadcrumb";
import { routing } from "@/i18n/routing";
import { AssistantSettingsEditor } from "@/modules/conversations/components/assistant-settings-editor";
import { getAssistantSettingsView } from "@/modules/conversations/server/settings";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { requireInstructor } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/inbox/settings">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.assistant" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen. The AI assistant (off / test / Gemini, key, the studio's instructions) and
// the guidance promises members see (reply time).
export default async function StudioAssistantPage({ params }: PageProps<"/[locale]/instructor/inbox/settings">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/inbox/settings");
  const [t, view] = await Promise.all([getTranslations("Studio.assistant"), getAssistantSettingsView()]);
  const knows = ["plans", "payments", "places", "pages"] as const;

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioCrumb items={[{ label: t("crumb") }]} />
      <StudioPageHeader eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")} />

      <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
        <div className="xl:col-span-8">
          <AssistantSettingsEditor initial={view} />
        </div>
        <aside className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm xl:col-span-4">
          <h2 className="font-label-lg text-label-lg text-on-surface">{t("guide.title")}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("guide.body")}</p>
          <ul className="flex list-disc flex-col gap-1 ps-5 font-body-sm text-body-sm text-on-surface-variant">
            {knows.map((key) => (
              <li key={key}>{t(`guide.knows.${key}`)}</li>
            ))}
          </ul>
          <h3 className="mt-2 font-label-lg text-label-lg text-on-surface">{t("guide.freeTitle")}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("guide.free")}</p>
          <h3 className="mt-2 font-label-lg text-label-lg text-on-surface">{t("guide.iranTitle")}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("guide.iran")}</p>
        </aside>
      </div>
    </div>
  );
}
