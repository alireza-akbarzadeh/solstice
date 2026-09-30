import type { Locale } from "@/i18n/routing";

import { samplePractices } from "../sample-data";
import type { DurationRange, PracticeFilters, PracticeSummary } from "../types";
import { toPracticeSummary } from "./to-summary";

export const PRACTICES_PAGE_SIZE = 6;

const durationBounds: Record<DurationRange, [min: number, max: number]> = {
  "under-15": [0, 14],
  "15-30": [15, 30],
  "30-45": [31, 45],
  "60-plus": [60, Infinity],
};

export type PracticePage = {
  items: PracticeSummary[];
  total: number;
  page: number;
  pageCount: number;
  /** Totals across the whole library, independent of filters. */
  library: { total: number; open: number };
};

// TODO(db): move filtering and paging into a Drizzle query once the videos schema exists.
export async function getPractices(locale: Locale, filters: PracticeFilters): Promise<PracticePage> {
  const q = filters.q?.trim().toLocaleLowerCase(locale);

  const matching = samplePractices
    .map((p) => toPracticeSummary(p, locale))
    .filter((p) => {
      if (filters.category && p.category !== filters.category) return false;
      if (filters.props && p.props !== filters.props) return false;
      if (filters.intensity && p.intensity.level !== filters.intensity) return false;
      if (filters.duration) {
        const [min, max] = durationBounds[filters.duration];
        if (p.durationMinutes < min || p.durationMinutes > max) return false;
      }
      if (q) {
        const haystack = `${p.title} ${p.summary} ${p.series}`.toLocaleLowerCase(locale);
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

  const pageCount = Math.max(1, Math.ceil(matching.length / PRACTICES_PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page), pageCount);

  return {
    items: matching.slice((page - 1) * PRACTICES_PAGE_SIZE, page * PRACTICES_PAGE_SIZE),
    total: matching.length,
    page,
    pageCount,
    library: {
      total: samplePractices.length,
      open: samplePractices.filter((p) => p.access === "open").length,
    },
  };
}
