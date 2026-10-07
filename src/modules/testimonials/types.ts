import type { Localized } from "@/lib/localized";

export type TestimonialPlacement = "all" | "home" | "membership";

export type Testimonial = {
  id: string;
  name: Localized;
  quote: Localized;
  roleOrMeta: Localized;
  rating: number;
  avatarColor: string;
  hidden: boolean;
  order: number;
  showOn: TestimonialPlacement;
  createdAt?: string;
  updatedAt?: string;
};

export type TestimonialInput = Omit<Testimonial, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export const TESTIMONIAL_PLACEMENTS: readonly TestimonialPlacement[] = ["all", "home", "membership"] as const;

export const AVATAR_PALETTE = [
  { id: "sand", label: "Sand / Clay", class: "bg-secondary-fixed text-on-secondary-fixed" },
  { id: "sage", label: "Sage Forest", class: "bg-primary-fixed text-primary" },
  { id: "terracotta", label: "Terracotta Dusk", class: "bg-tertiary-fixed text-on-tertiary-fixed" },
  { id: "amber", label: "Warm Amber", class: "bg-surface-container-high text-clay" },
  { id: "stone", label: "Stone", class: "bg-surface-container-highest text-on-surface" },
] as const;
