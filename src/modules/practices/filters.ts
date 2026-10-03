import {
  durationRanges,
  intensityLevels,
  propSetups,
  type PracticeFilters,
} from "./types";
import { isCategorySlug } from "@/modules/categories/types";

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function pick<T extends string>(allowed: readonly T[], value: string | string[] | undefined): T | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return allowed.includes(v as T) ? (v as T) : undefined;
}

// Unknown or malformed values are dropped rather than erroring, so shared links never break.
export function parsePracticeFilters(params: SearchParams): PracticeFilters {
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page);
  return {
    q: q ? q.slice(0, 100) : undefined,
    category: isCategorySlug(first(params.category)) ? first(params.category) : undefined,
    duration: pick(durationRanges, params.duration),
    props: pick(propSetups, params.props),
    intensity: pick(intensityLevels, params.intensity),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function practiceFiltersToQuery(filters: Partial<PracticeFilters>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "" || (key === "page" && value === 1)) continue;
    query.set(key, String(value));
  }
  const s = query.toString();
  return s ? `?${s}` : "";
}
