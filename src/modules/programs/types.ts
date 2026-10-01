import type { Localized } from "@/lib/localized";
import type { PracticeSummary } from "@/modules/practices/types";

export type ProgramTone = "primary" | "clay";
export type ProgramPacing = "daily" | "self";

export type ProgramSpotlight = {
  slug: string;
  tone: ProgramTone;
  icon: "sunrise" | "brain";
  badge: string;
  title: string;
  description: string;
  phases: { label: string; title: string }[];
  cta: string;
  note: string;
  image: string;
  imageAlt: string;
};

export type ProgramDay = { day: number; practice: PracticeSummary };

export type ProgramWeek = {
  index: number;
  label: string;
  title: string;
  description: string;
  focus: string;
  days: ProgramDay[];
};

export type ProgramDetail = Omit<ProgramSpotlight, "phases"> & {
  pacing: ProgramPacing;
  heroTitle: string;
  lede: string;
  totalDays: number;
  minutes: { min: number; max: number };
  weeks: ProgramWeek[];
};

/** Stored curriculum order determines the day numbers; a practice may recur on later days. */
export type StoredProgramWeek = {
  label: Localized;
  title: Localized;
  description: Localized;
  focus: Localized;
  practices: string[];
};

export type ProgramFields = {
  title: Localized;
  description: Localized;
  heroTitle: Localized;
  lede: Localized;
  badge: Localized;
  cta: Localized;
  note: Localized;
  image: string;
  imageAlt: Localized;
  tone: ProgramTone;
  icon: ProgramSpotlight["icon"];
  pacing: ProgramPacing;
  weeks: StoredProgramWeek[];
};
