import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StudioCrumb } from "@/components/layout/studio-breadcrumb";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SocialIcon } from "@/modules/contact/components/social-icon";
import { getStudioContact } from "@/modules/contact/server/contact";
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
  const [t, tSettings, view, contact] = await Promise.all([
    getTranslations("Studio.assistant"),
    getTranslations("Studio.settings"),
    getAssistantSettingsView(),
    getStudioContact(),
  ]);
  const telegramUrl = contact.socials.find((s) => s.network === "telegram")?.url ?? "https://t.me/solstice_yoga";
  const instagramUrl = contact.socials.find((s) => s.network === "instagram")?.url ?? "https://instagram.com/solstice_yoga";
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
          <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface p-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                {tSettings("editor.directChannelsTitle")}
              </span>
              <Link
                href="/instructor/settings"
                className="font-label-sm text-label-sm text-primary underline-offset-4 hover:underline"
              >
                {tSettings("tabs.contact")} →
              </Link>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {tSettings("editor.directChannelsHint")}
            </p>
            <div className="flex flex-col gap-2 pt-1 border-t border-hairline/60">
              <div className="flex items-center gap-2 font-body-sm text-body-sm">
                <SocialIcon network="telegram" className="size-4 shrink-0 text-[#229ED9]" />
                <span className="truncate text-on-surface" dir="ltr">{telegramUrl}</span>
              </div>
              <div className="flex items-center gap-2 font-body-sm text-body-sm">
                <SocialIcon network="instagram" className="size-4 shrink-0 text-[#E1306C]" />
                <span className="truncate text-on-surface" dir="ltr">{instagramUrl}</span>
              </div>
            </div>
          </div>

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
