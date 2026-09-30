import { BadgeCheckIcon, PlayCircleIcon, QuoteIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { ShareButton } from "@/components/share-button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ArticleCard } from "@/modules/journal/components/article-card";
import { PrintButton, ReadingProgress } from "@/modules/journal/components/reading-tools";
import { getArticle, getRelatedArticles } from "@/modules/journal/server/get-articles";
import type { JournalBlock } from "@/modules/journal/types";
import { NewsletterForm } from "@/modules/newsletter/components/newsletter-form";
import { getPractice } from "@/modules/practices/server/get-practice";

export async function generateMetadata({ params }: PageProps<"/[locale]/journal/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const article = await getArticle(locale, slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    authors: [{ name: article.author.name }],
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt.toISOString(),
      images: [article.image],
    },
  };
}

function Block({ block, first, num }: { block: JournalBlock; first: boolean; num: (n: number) => string }) {
  switch (block.type) {
    case "p":
      return (
        <p
          className={cn(
            first &&
              "ltr:first-letter:float-left ltr:first-letter:me-3 ltr:first-letter:font-heading ltr:first-letter:text-6xl ltr:first-letter:leading-[0.9] ltr:first-letter:text-primary",
          )}
        >
          {block.text}
        </p>
      );
    case "h2":
      return <h2 className="pt-space-sm font-headline-md text-headline-md tracking-tight text-primary">{block.text}</h2>;
    case "quote":
      return (
        <aside className="relative my-space-xl overflow-hidden rounded-xl bg-surface-container-low px-space-lg py-space-lg md:px-space-xl">
          <QuoteIcon aria-hidden className="absolute -start-2 -top-2 size-20 text-surface-variant/60" />
          <blockquote className="relative z-10 text-center font-headline-md text-headline-md leading-snug text-primary italic rtl:not-italic">
            {block.text}
          </blockquote>
          <p className="mt-space-sm text-center font-label-md text-label-md tracking-widest text-clay uppercase">{block.source}</p>
        </aside>
      );
    case "figure":
      return (
        <figure className="my-space-lg">
          <div className="relative h-[280px] w-full overflow-hidden rounded-xl shadow-sm md:h-[420px]">
            <Image src={block.image} alt={block.alt} fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
          </div>
          <figcaption className="mt-space-xs text-center font-label-sm text-label-sm tracking-widest text-outline uppercase">{block.caption}</figcaption>
        </figure>
      );
    case "steps":
      return (
        <section className="my-space-xl rounded-xl bg-surface-container p-space-md md:p-space-lg">
          <h2 className="font-headline-sm text-headline-sm text-primary">{block.title}</h2>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{block.intro}</p>
          <ol className="mt-space-md space-y-space-sm">
            {block.items.map((item, i) => (
              <li key={item.title} className="flex gap-4 rounded-lg bg-surface p-space-md">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-label-lg text-label-lg text-on-primary">
                  {num(i + 1)}
                </span>
                <div>
                  <h3 className="font-label-lg text-label-lg text-on-surface">{item.title}</h3>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      );
  }
}

// Stitch: the-vagus-nerve-in-movement-essay-reader.html
export default async function ArticlePage({ params }: PageProps<"/[locale]/journal/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const article = await getArticle(locale, slug);
  if (!article) notFound();

  const [t, tPractice, format, related, practices] = await Promise.all([
    getTranslations("Journal"),
    getTranslations("Practice"),
    getFormatter(),
    getRelatedArticles(locale, article),
    Promise.all(article.practices.map((s) => getPractice(locale, s))),
  ]);
  const featuredPractices = practices.filter((p) => p !== null);
  const opensWithFigure = article.body[0]?.type === "figure";
  const firstParagraph = article.body.findIndex((b) => b.type === "p");

  return (
    <>
      <ReadingProgress label={t("reader.progress")} />
      <article id="essay" className="mx-auto w-full max-w-content px-margin-mobile pt-space-md pb-space-xl md:px-margin md:pt-space-xl">
        <header className="mx-auto mb-space-xl max-w-4xl">
          <nav aria-label={t("reader.breadcrumb")} className="mb-space-sm flex flex-wrap items-center gap-2 font-label-md text-label-md tracking-wider text-outline uppercase">
            <Link href="/journal" className="transition-colors hover:text-primary">
              {t("chronicle")}
            </Link>
            <span className="text-outline-variant">/</span>
            <Link href={`/journal?category=${article.category}`} className="transition-colors hover:text-primary">
              {t(`categories.${article.category}`)}
            </Link>
            <span className="text-outline-variant">/</span>
            <span aria-current="page" className="text-on-surface-variant">
              {t("issue", { issue: article.issue })}
            </span>
          </nav>
          <div className="mb-space-md flex flex-wrap items-center gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm font-semibold text-primary">
                {tag}
              </span>
            ))}
            <span className="ms-2 font-label-sm text-label-sm text-outline">
              {t("readTime", { minutes: article.readMinutes })} · {format.dateTime(article.publishedAt, { dateStyle: "medium" })}
            </span>
          </div>
          <h1 className="mb-space-md font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-[3.25rem] md:leading-[3.75rem]">
            {article.title}
          </h1>
          <p className="mb-space-lg font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{article.excerpt}</p>

          <div className="flex flex-col justify-between gap-space-md border-t border-surface-variant pt-space-md sm:flex-row sm:items-center">
            <div className="flex items-center gap-space-sm">
              {article.author.image ? (
                <Image
                  src={article.author.image}
                  alt=""
                  width={56}
                  height={56}
                  className="size-14 rounded-full object-cover shadow-sm ring-2 ring-surface-container-high"
                />
              ) : (
                <span aria-hidden className="flex size-14 items-center justify-center rounded-full bg-secondary-fixed font-label-lg text-label-lg text-on-secondary-fixed">
                  {article.author.name
                    .split(/\s+/)
                    .slice(-2)
                    .map((part) => part[0])
                    .join("")}
                </span>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm text-on-surface">{article.author.name}</span>
                  {article.author.image && <BadgeCheckIcon className="size-4 text-primary" aria-label={t("reader.verified")} />}
                </div>
                <p className="font-label-sm text-label-sm tracking-wider text-clay uppercase">{article.author.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant print:hidden">
              <ShareButton
                title={article.title}
                label={t("reader.share")}
                copiedLabel={t("reader.copied")}
                className="flex size-10 items-center justify-center rounded-lg bg-surface-container-low transition-colors hover:bg-surface-container hover:text-primary [&_svg]:size-4"
              />
              <PrintButton
                label={t("reader.print")}
                className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-2 font-label-md text-label-md transition-colors hover:bg-surface-container hover:text-primary"
              />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-space-md font-body-lg text-body-lg leading-relaxed text-on-surface">
          {!opensWithFigure && (
            <figure className="mb-space-lg">
              <div className="relative h-[280px] w-full overflow-hidden rounded-xl shadow-sm md:h-[420px]">
                <Image src={article.image} alt={article.imageAlt} fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
              </div>
            </figure>
          )}
          {article.body.map((block, i) => (
            <Block key={i} block={block} first={i === firstParagraph} num={(n) => format.number(n)} />
          ))}
          <p className="pt-space-lg font-body-md text-body-md text-clay italic rtl:not-italic">— {article.author.name}</p>
        </div>
      </article>

      {featuredPractices.length > 0 && (
        <Container className="pb-space-xl print:hidden">
          <section className="mx-auto max-w-4xl rounded-2xl bg-surface-container-low p-space-lg">
            <span className="block font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">{t("reader.practicesEyebrow")}</span>
            <h2 className="mt-1 mb-space-md font-headline-sm text-headline-sm text-on-surface">{t("reader.practicesTitle")}</h2>
            <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              {featuredPractices.map((practice) => (
                <li key={practice.slug}>
                  <Link href={`/practices/${practice.slug}`} className="group flex gap-4 rounded-xl bg-surface p-3 shadow-sm transition-shadow hover:shadow-md">
                    <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg">
                      <Image src={practice.image} alt="" fill sizes="128px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="flex min-w-0 flex-col justify-center">
                      <span className="font-label-sm text-label-sm tracking-wider text-clay uppercase">
                        {tPractice("minutes", { count: practice.durationMinutes })} · {tPractice(`categories.${practice.category}`)}
                      </span>
                      <h3 className="line-clamp-2 font-headline-sm text-[1.05rem] leading-snug text-on-surface transition-colors group-hover:text-primary">
                        {practice.title}
                      </h3>
                      <span className="mt-1 inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold text-primary">
                        <PlayCircleIcon className="size-4" />
                        {t("reader.practiceNow")}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Container>
      )}

      <Container className="pb-space-xl print:hidden">
        <h2 className="mb-space-lg font-headline-md text-headline-md text-on-surface">{t("reader.related")}</h2>
        <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <li key={item.slug}>
              <ArticleCard article={item} />
            </li>
          ))}
        </ul>
      </Container>

      <Container className="mb-space-2xl print:hidden">
        <section className="mx-auto max-w-4xl rounded-2xl bg-primary p-space-lg text-on-primary md:p-space-xl">
          <span className="font-label-sm text-label-sm tracking-widest text-on-primary-container uppercase">{t("chronicle")}</span>
          <h2 className="mt-1 mb-space-sm font-headline-md text-headline-md">{t("epistle.title")}</h2>
          <p className="mb-space-md max-w-xl font-body-md text-body-md text-on-primary/80">{t("epistle.body")}</p>
          <NewsletterForm source="journal" tone="primary" />
        </section>
      </Container>
    </>
  );
}
