import type { Locale } from "@/i18n/routing";

import type { PracticeSummary } from "../types";
import { getPublishedRows } from "./library";
import { toPracticeSummary } from "./to-summary";

export async function getFeaturedPractices(locale: Locale): Promise<PracticeSummary[]> {
  return (await getPublishedRows()).filter((p) => p.featured).map((p) => toPracticeSummary(p, locale));
}
