import { z } from "zod";

/**
 * Validates that an asset path is either a clean local image path (/images/...) or a secure HTTPS URL.
 */
export function isValidAssetUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("/images/") && !trimmed.includes("..")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

const localizedStringSchema = z.object({
  en: z.string().trim().min(1).max(100),
  fa: z.string().trim().min(1).max(100),
});

const assetUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(1000)
  .refine(isValidAssetUrl, {
    message: "Must be a valid /images/... path or https:// URL",
  });

export const brandAssetsSchema = z.object({
  logoUrl: assetUrlSchema,
  logoAlt: localizedStringSchema,
  signInPhotoUrl: assetUrlSchema,
  signUpPhotoUrl: assetUrlSchema,
  instructorAvatarUrl: assetUrlSchema,
  instructorName: localizedStringSchema,
  studioName: localizedStringSchema,
});

export type BrandAssetsFormValues = z.infer<typeof brandAssetsSchema>;
