import type { MetadataRoute } from "next";

import { env } from "@/env";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getPublishedRows as getPublishedArticles } from "@/modules/journal/server/get-articles";
import { getPublishedRows as getPublishedPractices } from "@/modules/practices/server/library";
import { getPublishedProgramRows } from "@/modules/programs/server/library";
import { getPageInventory } from "@/modules/pages/server/library";

// /sitemap.xml: every public page in both languages, each entry pointing at its translation
// (hreflang), so search engines index the English and Persian versions as one page. Rebuilt
// at most hourly; private areas (studio, profile, checkout) are left out and robots.ts disallows them.
export const revalidate = 3600;

/** Public pages that always exist, whatever the studio has published. */
const fixedPaths = ["/", "/practices", "/programs", "/journal", "/about", "/membership", "/privacy", "/terms", "/ethics"];

type Entry = { path: string; lastModified?: Date | null; priority: number };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: Entry[] = fixedPaths.map((path) => ({ path, priority: path === "/" ? 1 : 0.8 }));
  try {
    const [practices, programs, articles, pages] = await Promise.all([
      getPublishedPractices(),
      getPublishedProgramRows(),
      getPublishedArticles(),
      getPageInventory(),
    ]);
    entries.push(
      ...practices.map((p) => ({ path: `/practices/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
      ...programs.map((p) => ({ path: `/programs/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
      ...articles.map((a) => ({ path: `/journal/${a.slug}`, lastModified: a.updatedAt, priority: 0.6 })),
      // The studio's own pages (built-in ones are among the fixed paths above).
      ...pages.filter((p) => !p.builtin && p.publishedContent).map((p) => ({ path: `/${p.slug}`, lastModified: p.publishedAt, priority: 0.5 })),
    );
  } catch (error) {
    // Without the database (e.g. a build with no connection) the fixed pages still go out.
    console.error("Sitemap: content could not be read.", error);
  }

  const url = (path: string, locale: (typeof routing.locales)[number]) =>
    new URL(getPathname({ href: path, locale }), env.BETTER_AUTH_URL).toString();

  return entries.flatMap(({ path, lastModified, priority }) => {
    const languages = Object.fromEntries(routing.locales.map((locale) => [locale, url(path, locale)]));
    return routing.locales.map((locale) => ({
      url: url(path, locale),
      lastModified: lastModified ?? undefined,
      priority,
      alternates: { languages },
    }));
  });
}
