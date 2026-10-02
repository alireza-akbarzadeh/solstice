import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { getSitePage } from "@/modules/pages/server/library";
import { ContentPage } from "@/modules/pages/components/content-page";
export const metadata = { robots: { index: false, follow: false } };
export default async function PagePreview({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireInstructor(locale, `/instructor/pages/preview/${slug}`);
  const [row, t] = await Promise.all([
    getSitePage(slug),
    getTranslations("Studio.pages"),
  ]);
  if (!row || row.builtin) notFound();
  return (
    <>
      <div className="bg-primary/10 flex flex-wrap justify-between gap-3 rounded-xl p-4">
        <p>{t("previewHint")}</p>
        <Link className="underline" href={`/instructor/pages?edit=${slug}`}>
          {t("edit")}
        </Link>
      </div>
      <ContentPage content={row.draftContent} locale={locale} />
    </>
  );
}
