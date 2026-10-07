import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { settings } from "@/server/db/schema";

import {
  DEFAULT_HOME_SECTIONS,
  HOME_SECTION_IDS,
  type HomeSectionConfig,
  type HomeSectionId,
} from "../sections";

export type StoredHomeSectionsSetting = Record<string, unknown> & {
  sections: HomeSectionConfig[];
};

/**
 * Loads the current homepage section order and visibility settings.
 * Ensures any new sections added to DEFAULT_HOME_SECTIONS are included even if older settings were stored.
 */
export async function getHomeSections(): Promise<HomeSectionConfig[]> {
  try {
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, "home_sections"))
      .limit(1);

    const val = row?.value as { sections?: unknown[] } | undefined;
    const rawList = Array.isArray(val?.sections)
      ? val.sections
      : Array.isArray(row?.value)
        ? (row.value as unknown[])
        : null;

    if (rawList) {
      const validStored: HomeSectionConfig[] = [];
      const seenIds = new Set<string>();

      for (const item of rawList) {
        if (
          item &&
          typeof item === "object" &&
          "id" in item &&
          typeof item.id === "string" &&
          HOME_SECTION_IDS.includes(item.id as HomeSectionId)
        ) {
          const id = item.id as HomeSectionId;
          const enabled = "enabled" in item && typeof item.enabled === "boolean" ? item.enabled : true;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            validStored.push({ id, enabled });
          }
        }
      }

      // Append any default sections that might not be in the stored config
      for (const def of DEFAULT_HOME_SECTIONS) {
        if (!seenIds.has(def.id)) {
          validStored.push({ ...def });
        }
      }

      return validStored;
    }
  } catch (error) {
    console.error("[home:sections] Failed to read home_sections setting:", error);
  }

  return [...DEFAULT_HOME_SECTIONS];
}

/**
 * Persists the homepage sections order and visibility to the settings table.
 */
export async function saveHomeSections(sections: HomeSectionConfig[]): Promise<HomeSectionConfig[]> {
  // Validate that all sections belong to valid IDs
  const validIds = new Set(HOME_SECTION_IDS);
  const normalized: HomeSectionConfig[] = [];
  const seen = new Set<string>();

  for (const s of sections) {
    if (validIds.has(s.id) && !seen.has(s.id)) {
      seen.add(s.id);
      normalized.push({ id: s.id, enabled: !!s.enabled });
    }
  }

  // Ensure missing sections are appended at the end
  for (const def of DEFAULT_HOME_SECTIONS) {
    if (!seen.has(def.id)) {
      normalized.push({ ...def });
    }
  }

  const value: StoredHomeSectionsSetting = { sections: normalized };

  await db
    .insert(settings)
    .values({ key: "home_sections", value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });

  return normalized;
}

/**
 * Resets home sections to the default order and visibility.
 */
export async function resetHomeSections(): Promise<HomeSectionConfig[]> {
  await db.delete(settings).where(eq(settings.key, "home_sections"));
  return [...DEFAULT_HOME_SECTIONS];
}
