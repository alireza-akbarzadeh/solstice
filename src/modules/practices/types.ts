export const practiceCategories = [
  "morning",
  "vinyasa",
  "restorative",
  "yin",
  "pranayama",
  "mobility",
  "evening",
] as const;
export type PracticeCategory = (typeof practiceCategories)[number];

export const intensityLevels = ["gentle", "moderate", "fire"] as const;
export type IntensityLevel = (typeof intensityLevels)[number];

export const propSetups = ["none", "bolster-blocks", "strap"] as const;
export type PropSetup = (typeof propSetups)[number];

export const durationRanges = ["under-15", "15-30", "30-45", "60-plus"] as const;
export type DurationRange = (typeof durationRanges)[number];

export type PracticeAccess = "open" | "members";

export type PracticeSummary = {
  slug: string;
  title: string;
  summary: string;
  category: PracticeCategory;
  /** Series or style line shown above the title, e.g. "Solar Series • Sequence IV". */
  series: string;
  intensity: { level: IntensityLevel; label: string };
  props: PropSetup;
  durationMinutes: number;
  rating: number;
  reviewCount: number;
  access: PracticeAccess;
  image: string;
  imageAlt: string;
};

export const implementKinds = ["blocks", "strap", "blanket", "bolster", "cushion"] as const;
export type ImplementKind = (typeof implementKinds)[number];

export type PracticeChapter = {
  title: string;
  description: string;
  startSeconds: number;
};

export type PracticeDetail = PracticeSummary & {
  status: "draft" | "published";
  /** The video at its VideoProvider (a URL, a YouTube id, an Aparat hash); null until attached. */
  videoAssetId: string | null;
  /** Which provider holds it, so a library can mix sources and survive a provider switch. */
  videoProvider: string | null;
  /** Large still shown before playback. */
  poster: string;
  /** Free preview length for non-members (members-only practices). */
  previewSeconds?: number;
  instructorNote?: string;
  focus: string[];
  implements: { kind: ImplementKind; name: string; detail: string }[];
  chapters: PracticeChapter[];
};

export type PracticeFilters = {
  q?: string;
  category?: PracticeCategory;
  duration?: DurationRange;
  props?: PropSetup;
  intensity?: IntensityLevel;
  page: number;
};
