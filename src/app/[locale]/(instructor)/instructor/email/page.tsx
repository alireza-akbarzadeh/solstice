import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StudioCrumb } from "@/components/layout/studio-breadcrumb";
import { routing } from "@/i18n/routing";
import { getEmailSettingsView } from "@/modules/email/server/settings";
import { EmailSettingsEditor } from "@/modules/instructor/components/email-settings-editor";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { requireInstructor } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/email">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.email" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen. How the site sends mail (verification, password reset, renewal reminders,
// newsletters): the test mailbox or an SMTP server, with the sender's name and address.
export default async function StudioEmailPage({ params }: PageProps<"/[locale]/instructor/email">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/email");
  const [t, view] = await Promise.all([getTranslations("Studio.email"), getEmailSettingsView()]);
  const presets = ["gmail", "zoho", "host"] as const;

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioCrumb items={[]} />
      <StudioPageHeader eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")} />

      <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
        <div className="xl:col-span-8">
          <EmailSettingsEditor initial={view} />
        </div>
        <aside className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm xl:col-span-4">
          <h2 className="font-label-lg text-label-lg text-on-surface">{t("guide.title")}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("guide.body")}</p>
          <ul className="flex flex-col gap-3">
            {presets.map((preset) => (
              <li key={preset} className="rounded-lg bg-surface p-space-sm">
                <p className="font-label-md text-label-md text-on-surface">{t(`guide.${preset}.name`)}</p>
                <p dir="ltr" className="font-body-sm text-body-sm text-on-surface-variant rtl:text-end">
                  {t(`guide.${preset}.settings`)}
                </p>
                <p className="mt-1 font-body-sm text-body-sm text-outline">{t(`guide.${preset}.note`)}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
