import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cache } from "react";

import { db } from "@/server/db";
import { settings } from "@/server/db/schema";
import { brandAssetsSchema } from "../schemas";
import { DEFAULT_BRAND_ASSETS, type BrandAssets } from "../types";

const KEY = "brand_assets";

/**
 * Retrieves the current brand assets configuration with fallback to serene sanctuary defaults.
 */
export const getBrandAssets = cache(async (): Promise<BrandAssets> => {
  try {
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, KEY))
      .limit(1);

    if (!row) return { ...DEFAULT_BRAND_ASSETS };

    const parsed = brandAssetsSchema.safeParse(row.value);
    if (!parsed.success) {
      return { ...DEFAULT_BRAND_ASSETS };
    }

    return parsed.data;
  } catch (error) {
    console.error("Brand assets could not be retrieved from database.", error);
    return { ...DEFAULT_BRAND_ASSETS };
  }
});

/**
 * Saves updated brand assets to the settings table and triggers path revalidation.
 */
export async function saveBrandAssets(assets: BrandAssets): Promise<void> {
  const validated = brandAssetsSchema.parse(assets);

  await db
    .insert(settings)
    .values({ key: KEY, value: validated })
    .onConflictDoUpdate({ target: settings.key, set: { value: validated } });

  revalidatePath("/", "layout");
}

/**
 * Resets brand assets back to the original sanctuary studio defaults.
 */
export async function resetBrandAssets(): Promise<void> {
  await db.delete(settings).where(eq(settings.key, KEY));
  revalidatePath("/", "layout");
}
