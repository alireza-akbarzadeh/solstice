import type { PracticeSummary } from "@/modules/practices/types";

export type PlaylistSummary = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  practicesCount: number;
  totalMinutes: number;
  previewImages: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type PlaylistWithPractices = PlaylistSummary & {
  practices: PracticeSummary[];
};
