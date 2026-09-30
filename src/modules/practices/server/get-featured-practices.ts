import type { Locale } from "@/i18n/routing";

import { samplePractices } from "../sample-data";
import type { PracticeSummary } from "../types";
import { toPracticeSummary } from "./to-summary";

// TODO(db): read featured practices from Drizzle once the videos schema exists.
export async function getFeaturedPractices(locale: Locale): Promise<PracticeSummary[]> {
  return samplePractices.filter((p) => p.featured).map((p) => toPracticeSummary(p, locale));
}
