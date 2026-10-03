import { useMessages } from "next-intl";

import { categoryNamespace, type CategoryKind } from "./types";

type WithCategories = Record<string, { categories?: Record<string, string> } | undefined>;

/** slug → name from a messages object (names are merged in per request; see i18n/request.ts). */
export const categoryLookup = (messages: unknown, kind: CategoryKind) => {
  const names = (messages as WithCategories)[categoryNamespace[kind]]?.categories ?? {};
  // A slug with no name (e.g. a category removed from under old content) shows as itself.
  return (slug: string) => names[slug] ?? slug;
};

/** Category names for client and server components. */
export function useCategoryName(kind: CategoryKind) {
  return categoryLookup(useMessages(), kind);
}
