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
