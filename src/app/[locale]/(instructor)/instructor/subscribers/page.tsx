import {
  DownloadIcon,
  LanguagesIcon,
  MailIcon,
  SearchXIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";

import {
  StudioCrumb,
  type StudioCrumbItem,
} from "@/components/layout/studio-breadcrumb";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { routing } from "@/i18n/routing";
import { emailTestMode } from "@/infrastructure/email";
import { localize } from "@/lib/localized";
import { NewsletterComposer } from "@/modules/instructor/components/newsletter-composer";
import { StatCard } from "@/modules/instructor/components/stat-card";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { StudioSearch } from "@/modules/instructor/components/studio-search";
import { SubscriberList } from "@/modules/instructor/components/subscriber-list";
import { requireInstructor } from "@/modules/memberships/server/viewer";
import { listIssues } from "@/modules/newsletter/server/issues";
import {
  getSubscriberStats,
  listSubscribers,
} from "@/modules/newsletter/server/subscribers";

const LIST_LIMIT = 500;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/instructor/subscribers">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.subscribers" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen. Addresses captured by the footer and journal forms; sending waits for a
// real EmailProvider, so for now the list is exported and used in a mailing tool.
// Sending a newsletter runs in this page's server action, one message per subscriber.
export const maxDuration = 300;

export default async function StudioSubscribersPage({
  params,
  searchParams,
}: PageProps<"/[locale]/instructor/subscribers">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/subscribers");
  const query = await searchParams;
  const rawQ = Array.isArray(query.q) ? query.q[0] : query.q;
  const trimmed = rawQ?.trim().slice(0, 200);
  const q = trimmed?.length ? trimmed : undefined;

  const [t, format, stats, items, issues, mailbox] = await Promise.all([
    getTranslations("Studio.subscribers"),
    getFormatter(),
    getSubscriberStats(),
    listSubscribers({ q, limit: LIST_LIMIT }),
    listIssues(10),
    emailTestMode(),
  ]);

  const crumbItems: StudioCrumbItem[] = q ? [{ label: `“${q}”` }] : [];
  return (
    <div className="gap-space-lg flex flex-col">
      <StudioCrumb items={crumbItems} />
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

      <div className="gap-gutter grid grid-cols-1 sm:grid-cols-2">
        <StatCard
          label={t("stats.total")}
          value={format.number(stats.total)}
          note={t("stats.totalNote")}
          icon={MailIcon}
        />
        <StatCard
          label={t("stats.languages")}
          value={`${format.number(stats.en)} / ${format.number(stats.fa)}`}
          note={t("stats.languagesNote")}
          icon={LanguagesIcon}
        />
      </div>

      {stats.total > 0 && !q && <NewsletterComposer subscribers={stats.total} mailbox={mailbox} />}

      {issues.length > 0 && !q && (
        <section className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
          <h2 className="font-label-lg text-label-lg text-on-surface">{t("issues.title")}</h2>
          <ul className="divide-y divide-outline-variant/30">
            {issues.map((issue) => (
              <li key={issue.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                <span className="min-w-0 truncate font-label-lg text-label-lg text-on-surface">{localize(issue.subject, locale)}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {issue.sentAt
                    ? t("issues.sent", { date: format.dateTime(issue.sentAt, { dateStyle: "medium", timeStyle: "short" }), count: issue.recipients, failed: issue.failed })
                    : t("issues.sending")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stats.total === 0 ? (
        <Empty className="bg-surface-container-low rounded-xl">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MailIcon />
            </EmptyMedia>
            <EmptyTitle className="font-headline-sm text-headline-sm">
              {t("emptyTitle")}
            </EmptyTitle>
            <EmptyDescription>{t("emptyBody")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section className="gap-space-md flex flex-col">
          <StudioSearch
            basePath="/instructor/subscribers"
            value={q}
            placeholder={t("searchPlaceholder")}
          />
          {items.length === 0 ? (
            <Empty className="bg-surface-container-low rounded-xl">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon />
                </EmptyMedia>
                <EmptyTitle className="font-headline-sm text-headline-sm">
                  {t("noMatchTitle")}
                </EmptyTitle>
                <EmptyDescription>{t("noMatchBody")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <SubscriberList items={items} />
              {items.length === LIST_LIMIT && (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t("capped", { count: LIST_LIMIT })}
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
