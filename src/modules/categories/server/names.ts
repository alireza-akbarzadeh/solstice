import { getMessages } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import { categoryLookup } from "../names";
import { categoryNamespace, type Category, type CategoryKind } from "../types";

/** Category names for async server components. */
export async function getCategoryName(kind: CategoryKind) {
  return categoryLookup(await getMessages(), kind);
}

/**
 * Writes the studio's category names into the messages for one locale, so `useCategoryName`
 * (and anything reading `Practice.categories` / `Journal.categories`) sees the current names.
 */
export function mergeCategoryNames<T>(messages: T, locale: Locale, rows: Category[]): T {
  const out = messages as Record<string, Record<string, unknown> | undefined>;
  for (const kind of Object.keys(categoryNamespace) as CategoryKind[]) {
    const namespace = categoryNamespace[kind];
    out[namespace] = {
      ...out[namespace],
      categories: Object.fromEntries(rows.filter((c) => c.kind === kind).map((c) => [c.slug, c.name[locale] || c.name.en])),
    };
  }
  return messages;
}
