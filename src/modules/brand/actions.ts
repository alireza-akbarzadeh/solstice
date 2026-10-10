"use server";

import { requireInstructor } from "@/modules/memberships/server/viewer";
import { brandAssetsSchema, type BrandAssetsFormValues } from "./schemas";
import { resetBrandAssets, saveBrandAssets } from "./server/brand-assets";

export async function saveBrandAssetsAction(values: BrandAssetsFormValues) {
  await requireInstructor("en", "/instructor/settings");

  const parsed = brandAssetsSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "invalid" as const };
  }

  try {
    await saveBrandAssets(parsed.data);
    return { success: true };
  } catch (error) {
    console.error("Failed to save brand assets:", error);
    return { success: false, error: "failed" as const };
  }
}

export async function resetBrandAssetsAction() {
  await requireInstructor("en", "/instructor/settings");

  try {
    await resetBrandAssets();
    return { success: true };
  } catch (error) {
    console.error("Failed to reset brand assets:", error);
    return { success: false, error: "failed" as const };
  }
}
