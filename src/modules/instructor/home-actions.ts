"use server";

import { revalidatePath } from "next/cache";

import { resetHomeSections, saveHomeSections } from "@/modules/home/server/sections";
import type { HomeSectionConfig } from "@/modules/home/sections";
import { getViewer } from "@/modules/memberships/server/viewer";

export type HomeSectionsResult =
  | { ok: true; sections: HomeSectionConfig[] }
  | { ok: false; error: "forbidden" | "failed" };

export async function saveHomeSectionsAction(sections: HomeSectionConfig[]): Promise<HomeSectionsResult> {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") return { ok: false, error: "forbidden" };

  try {
    const updated = await saveHomeSections(sections);
    revalidatePath("/", "layout");
    revalidatePath("/fa", "layout");
    return { ok: true, sections: updated };
  } catch (error) {
    console.error("[home-actions] Failed to save home sections:", error);
    return { ok: false, error: "failed" };
  }
}

export async function resetHomeSectionsAction(): Promise<HomeSectionsResult> {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") return { ok: false, error: "forbidden" };

  try {
    const updated = await resetHomeSections();
    revalidatePath("/", "layout");
    revalidatePath("/fa", "layout");
    return { ok: true, sections: updated };
  } catch (error) {
    console.error("[home-actions] Failed to reset home sections:", error);
    return { ok: false, error: "failed" };
  }
}
