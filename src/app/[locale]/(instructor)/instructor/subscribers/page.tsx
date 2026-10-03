import { DownloadIcon, LanguagesIcon, MailIcon, SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { routing } from "@/i18n/routing";
import { StatCard } from "@/modules/instructor/components/stat-card";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { StudioSearch } from "@/modules/instructor/components/studio-search";
import { SubscriberList } from "@/modules/instructor/components/subscriber-list";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { getSubscriberStats, listSubscribers } from "@/modules/newsletter/server/subscribers";

const LIST_LIMIT = 500;

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/subscribers">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.subscribers" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen. Addresses captured by the footer and journal forms; sending waits for a
// real EmailProvider, so for now the list is exported and used in a mailing tool.
export default async function StudioSubscribersPage({ params, searchParams }: PageProps<"/[locale]/instructor/subscribers">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/subscribers");
  const query = await searchParams;
  const rawQ = Array.isArray(query.q) ? query.q[0] : query.q;
  const trimmed = rawQ?.trim().slice(0, 200);
  const q = trimmed?.length ? trimmed : undefined;

  const [t, format, stats, items] = await Promise.all([
    getTranslations("Studio.subscribers"),
    getFormatter(),
    getSubscriberStats(),
    listSubscribers({ q, limit: LIST_LIMIT }),
  ]);

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede")}
        actions={
          stats.total > 0 && (
            <Button asChild>
              {/* A plain anchor: the export is a file download, not a locale-prefixed page. */}
              <a href="/api/instructor/subscribers" download>
                <DownloadIcon data-icon="inline-start" />
                {t("export")}
              </a>
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2">
        <StatCard label={t("stats.total")} value={format.number(stats.total)} note={t("stats.totalNote")} icon={MailIcon} />
        <StatCard
          label={t("stats.languages")}
          value={`${format.number(stats.en)} / ${format.number(stats.fa)}`}
          note={t("stats.languagesNote")}
          icon={LanguagesIcon}
        />
      </div>

      {stats.total === 0 ? (
        <Empty className="rounded-xl bg-surface-container-low">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MailIcon />
            </EmptyMedia>
            <EmptyTitle className="font-headline-sm text-headline-sm">{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyBody")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section className="flex flex-col gap-space-md">
          <StudioSearch basePath="/instructor/subscribers" value={q} placeholder={t("searchPlaceholder")} />
          {items.length === 0 ? (
            <Empty className="rounded-xl bg-surface-container-low">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon />
                </EmptyMedia>
                <EmptyTitle className="font-headline-sm text-headline-sm">{t("noMatchTitle")}</EmptyTitle>
                <EmptyDescription>{t("noMatchBody")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <SubscriberList items={items} />
              {items.length === LIST_LIMIT && (
                <p className="font-body-sm text-body-sm text-on-surface-variant">{t("capped", { count: LIST_LIMIT })}</p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
