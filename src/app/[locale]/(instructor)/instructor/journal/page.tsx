import { BookOpenIcon, ClockIcon, ExternalLinkIcon, LayersIcon, PenLineIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { StatCard } from "@/modules/instructor/components/stat-card";
import { StudioFilterPills } from "@/modules/instructor/components/studio-filter-pills";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { getAllArticleSummaries } from "@/modules/journal/server/get-articles";
import { journalCategories } from "@/modules/journal/types";
import { requireInstructor } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/journal">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.journal" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen (Stitch's sidebar lists "Journal & Essays" but never draws it). Essays are
// still sample data in modules/journal/sample-articles.ts, so this shelf is read-only.
export default async function StudioJournalPage({ params, searchParams }: PageProps<"/[locale]/instructor/journal">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/journal");
  const query = await searchParams;
  const rawCategory = Array.isArray(query.category) ? query.category[0] : query.category;
  const category = journalCategories.includes(rawCategory as (typeof journalCategories)[number]) ? rawCategory : undefined;

  const [t, tJournal, format, articles] = await Promise.all([
    getTranslations("Studio.journal"),
    getTranslations("Journal"),
    getFormatter(),
    getAllArticleSummaries(locale),
  ]);

  const shown = category ? articles.filter((a) => a.category === category) : articles;
  const minutes = articles.reduce((n, a) => n + a.readMinutes, 0);
  const authors = new Set(articles.map((a) => a.author.name)).size;
  const latest = articles[0];

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioPageHeader eyebrow={t("eyebrow")} title={t("title")} lede={t("lede", { total: articles.length, minutes })} />

      <Alert>
        <AlertTitle>{t("sampleTitle")}</AlertTitle>
        <AlertDescription>{t("sampleBody")}</AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("stats.essays")} value={format.number(articles.length)} note={t("stats.essaysNote")} icon={BookOpenIcon} />
        <StatCard label={t("stats.reading")} value={t("stats.minutes", { count: minutes })} note={t("stats.readingNote")} icon={ClockIcon} />
        <StatCard label={t("stats.categories")} value={format.number(new Set(articles.map((a) => a.category)).size)} note={t("stats.categoriesNote")} icon={LayersIcon} />
        <StatCard
          label={t("stats.authors")}
          value={format.number(authors)}
          note={latest ? t("stats.latest", { when: format.dateTime(latest.publishedAt, { dateStyle: "medium" }) }) : undefined}
          icon={PenLineIcon}
        />
      </div>

      <StudioFilterPills
        basePath="/instructor/journal"
        param="category"
        active={category ?? "all"}
        options={[
          { value: "all", label: t("all"), count: articles.length },
          ...journalCategories.map((c) => ({
            value: c,
            label: tJournal(`categories.${c}`),
            count: articles.filter((a) => a.category === c).length,
          })),
        ]}
      />

      <div className="overflow-hidden rounded-xl bg-surface-container-low shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container hover:bg-surface-container">
                <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">{t("table.essay")}</TableHead>
                <TableHead className="hidden font-label-sm text-label-sm tracking-wider uppercase md:table-cell">{t("table.category")}</TableHead>
                <TableHead className="hidden font-label-sm text-label-sm tracking-wider uppercase lg:table-cell">{t("table.published")}</TableHead>
                <TableHead className="text-end font-label-sm text-label-sm tracking-wider uppercase">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((article) => (
                <TableRow key={article.slug}>
                  <TableCell>
                    <div className="flex min-w-0 items-start gap-3">
                      <Image
                        src={article.image}
                        alt=""
                        width={64}
                        height={48}
                        sizes="64px"
                        className="hidden h-12 w-16 shrink-0 rounded object-cover sm:block"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-label-lg text-label-lg text-on-surface">{article.title}</p>
                        <p className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{article.excerpt}</p>
                        <p className="font-label-sm text-label-sm text-outline">
                          {t("table.issue", { issue: article.issue })} · {article.author.name} · {t("table.read", { count: article.readMinutes })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{tJournal(`categories.${article.category}`)}</Badge>
                  </TableCell>
                  <TableCell className="hidden font-body-sm text-body-sm text-on-surface-variant lg:table-cell">
                    {format.dateTime(article.publishedAt, { dateStyle: "medium" })}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/journal/${article.slug}`}>
                        <ExternalLinkIcon data-icon="inline-start" className="rtl:-scale-x-100" />
                        {t("table.read_")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
