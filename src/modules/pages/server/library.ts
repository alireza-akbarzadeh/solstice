import { and, desc, eq, isNotNull } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/server/db";
import { sitePages } from "@/server/db/schema";
import { localize } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import { pageDefinition } from "../definitions";

export type SitePageRow = typeof sitePages.$inferSelect;
export const getSitePage = cache(async (slug: string) => {
  const [row] = await db
    .select()
    .from(sitePages)
    .where(eq(sitePages.slug, slug))
    .limit(1);
  return row ?? null;
});
export async function getPageInventory() {
  return db.select().from(sitePages).orderBy(desc(sitePages.updatedAt));
}
export const getPublishedBuiltinPages = cache(async () =>
  db
    .select({
      slug: sitePages.slug,
      publishedContent: sitePages.publishedContent,
    })
    .from(sitePages)
    .where(
      and(eq(sitePages.builtin, true), isNotNull(sitePages.publishedContent)),
    ),
);
export async function getPublishedCustomPage(slug: string) {
  const row = await getSitePage(slug);
  return row && !row.builtin && row.publishedContent ? row : null;
}
const getCustomLinks = cache(async () =>
  db
    .select({ slug: sitePages.slug, content: sitePages.publishedContent })
    .from(sitePages)
    .where(
      and(eq(sitePages.builtin, false), isNotNull(sitePages.publishedContent)),
    ),
);
export const getNavigationPages = cache(async (locale: Locale) =>
  (await getCustomLinks())
    .filter((row) => row.content?.showInNavigation)
    .map((row) => ({
      href: `/${row.slug}`,
      label: localize(row.content!.title, locale),
    })),
);
export const getFooterPages = cache(async (locale: Locale) => {
  const rows = await getCustomLinks();
  return rows
    .filter((row) => row.content?.showInFooter)
    .map((row) => ({
      slug: row.slug,
      title: localize(row.content!.title, locale),
    }));
});
export async function getPageAssets(
  slug: string,
): Promise<Record<string, string>> {
  const fallback = pageDefinition(slug)?.assets ?? {};
  try {
    const page = (await getPublishedBuiltinPages()).find(
      (row) => row.slug === slug,
    );
    return { ...fallback, ...page?.publishedContent?.assets };
  } catch {
    return fallback;
  }
}
