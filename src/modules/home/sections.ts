export type HomeSectionId =
  | "hero"
  | "featuredPractices"
  | "featuredPrograms"
  | "instructor"
  | "testimonials"
  | "membership";

export const HOME_SECTION_IDS: readonly HomeSectionId[] = [
  "hero",
  "featuredPractices",
  "featuredPrograms",
  "instructor",
  "testimonials",
  "membership",
] as const;

export type HomeSectionConfig = {
  id: HomeSectionId;
  enabled: boolean;
};

export const DEFAULT_HOME_SECTIONS: readonly HomeSectionConfig[] = [
  { id: "hero", enabled: true },
  { id: "featuredPractices", enabled: true },
  { id: "featuredPrograms", enabled: true },
  { id: "instructor", enabled: true },
  { id: "testimonials", enabled: true },
  { id: "membership", enabled: true },
] as const;
