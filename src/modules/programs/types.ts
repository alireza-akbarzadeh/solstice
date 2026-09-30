export type ProgramTone = "primary" | "clay";

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
