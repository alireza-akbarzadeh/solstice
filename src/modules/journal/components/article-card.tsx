import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getCategoryName } from "@/modules/categories/server/names";

import type { JournalArticleSummary } from "../types";

// Grid card (the-solstice-chronicle-editorial-journal "Dispatches from the Atelier").
export async function ArticleCard({ article }: { article: JournalArticleSummary }) {
  const [t, format] = await Promise.all([getTranslations("Journal"), getFormatter()]);
  const journalCategory = await getCategoryName("journal");

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:hover:translate-y-0">
      <div className="relative h-60 overflow-hidden bg-surface-container">
        <Image
          src={article.image}
          alt={article.imageAlt}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
        />
        <span className="absolute end-4 top-4 rounded-full bg-inverse-surface/75 px-3 py-1 font-label-sm text-label-sm text-inverse-on-surface backdrop-blur-md">
          {t("readTime", { minutes: article.readMinutes })}
        </span>
        <span className="absolute start-4 bottom-3 rounded-md bg-surface-container-lowest/90 px-2.5 py-1 font-label-sm text-label-sm font-semibold text-primary backdrop-blur-md">
          {journalCategory(article.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between p-space-lg">
        <div>
          <h3 className="mb-3 font-headline-sm text-headline-sm leading-snug text-on-surface transition-colors group-hover:text-primary">
            <Link href={`/journal/${article.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {article.title}
            </Link>
          </h3>
          <p className="mb-space-md line-clamp-3 font-body-sm text-body-sm text-on-surface-variant">{article.excerpt}</p>
        </div>
        <div className="flex items-center justify-between gap-2 pt-space-sm font-body-sm text-body-sm text-on-surface-variant">
          <span className="font-label-md text-label-md text-on-surface">{article.author.name}</span>
          <time dateTime={article.publishedAt.toISOString()} className="font-label-sm text-label-sm">
            {format.dateTime(article.publishedAt, { dateStyle: "medium" })}
          </time>
        </div>
      </div>
    </article>
  );
}
