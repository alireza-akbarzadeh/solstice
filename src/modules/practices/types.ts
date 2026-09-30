export type PracticeTone = "primary" | "tertiary" | "clay";

export type PracticeSummary = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  categoryTone: PracticeTone;
  style: string;
  intensity: string;
  durationMinutes: number;
  image: string;
  imageAlt: string;
};
