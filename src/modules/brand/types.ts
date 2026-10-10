import type { Localized } from "@/lib/localized";

export type BrandAssets = {
  logoUrl: string;
  logoAlt: Localized;
  signInPhotoUrl: string;
  signUpPhotoUrl: string;
  instructorAvatarUrl: string;
  instructorName: Localized;
  studioName: Localized;
};

export const DEFAULT_BRAND_ASSETS: BrandAssets = {
  logoUrl: "/images/brand/logo.svg",
  logoAlt: {
    en: "Solstice Sanctuary",
    fa: "پناهگاه سلستیس",
  },
  signInPhotoUrl: "/images/auth/sign-in.jpg",
  signUpPhotoUrl: "/images/auth/sanctuary-interior.jpg",
  instructorAvatarUrl: "/images/brand/elena-portrait.jpg",
  instructorName: {
    en: "Elena Rostova",
    fa: "النا روستووا",
  },
  studioName: {
    en: "Solstice",
    fa: "سلستیس",
  },
};

export function defaultBrandAssets(): BrandAssets {
  return { ...DEFAULT_BRAND_ASSETS };
}
