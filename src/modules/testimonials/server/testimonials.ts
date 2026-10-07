import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { settings } from "@/server/db/schema";

import { DEFAULT_TESTIMONIALS } from "../defaults";
import type { Testimonial, TestimonialInput, TestimonialPlacement } from "../types";

export type StoredTestimonialsSetting = {
  testimonials: Testimonial[];
};

/**
 * Loads all testimonials from the database setting table.
 * Falls back to DEFAULT_TESTIMONIALS if no setting exists yet.
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, "testimonials"))
      .limit(1);

    if (row?.value) {
      const val = row.value;
      const rawList = Array.isArray(val)
        ? val
        : typeof val === "object" && val !== null && "testimonials" in val && Array.isArray((val as { testimonials?: unknown[] }).testimonials)
          ? (val as { testimonials: unknown[] }).testimonials
          : null;

      if (rawList && rawList.length > 0) {
        const parsed: Testimonial[] = [];
        for (const item of rawList) {
          if (item && typeof item === "object" && "id" in item && "quote" in item) {
            const t = item as Partial<Testimonial>;
            if (t.id && t.quote && t.name) {
              parsed.push({
                id: String(t.id),
                name: {
                  en: t.name?.en ?? "",
                  fa: t.name?.fa ?? t.name?.en ?? "",
                },
                quote: {
                  en: t.quote?.en ?? "",
                  fa: t.quote?.fa ?? t.quote?.en ?? "",
                },
                roleOrMeta: {
                  en: t.roleOrMeta?.en ?? "",
                  fa: t.roleOrMeta?.fa ?? t.roleOrMeta?.en ?? "",
                },
                rating: typeof t.rating === "number" ? Math.max(1, Math.min(5, t.rating)) : 5,
                avatarColor: t.avatarColor ?? "bg-secondary-fixed text-on-secondary-fixed",
                hidden: !!t.hidden,
                order: typeof t.order === "number" ? t.order : parsed.length,
                showOn: t.showOn ?? "all",
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
              });
            }
          }
        }
        if (parsed.length > 0) {
          return parsed.sort((a, b) => a.order - b.order);
        }
      }
    }
  } catch (error) {
    console.error("[testimonials] Failed to read testimonials setting:", error);
  }

  return [...DEFAULT_TESTIMONIALS];
}

/**
 * Loads visible, active testimonials for a specific public section ("home", "membership", or any).
 */
export async function getActiveTestimonials(placement?: TestimonialPlacement): Promise<Testimonial[]> {
  const all = await getTestimonials();
  return all
    .filter((t) => !t.hidden)
    .filter((t) => !placement || t.showOn === "all" || t.showOn === placement)
    .sort((a, b) => a.order - b.order);
}

/**
 * Persists the entire list of testimonials to the database.
 */
async function persistTestimonials(list: Testimonial[]): Promise<Testimonial[]> {
  const normalized = list.map((item, index) => ({
    ...item,
    order: index,
    updatedAt: new Date().toISOString(),
  }));

  await db
    .insert(settings)
    .values({
      key: "testimonials",
      value: { testimonials: normalized },
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: { testimonials: normalized },
        updatedAt: new Date(),
      },
    });

  return normalized;
}

/**
 * Saves a single testimonial (creates a new one or updates an existing one).
 */
export async function saveTestimonial(input: TestimonialInput): Promise<Testimonial[]> {
  const list = await getTestimonials();
  const now = new Date().toISOString();

  if (input.id) {
    // Update existing
    const index = list.findIndex((t) => t.id === input.id);
    if (index >= 0) {
      list[index] = {
        ...list[index]!,
        ...input,
        id: input.id,
        updatedAt: now,
      };
      return persistTestimonials(list);
    }
  }

  // Create new
  const newId = input.id ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t_${Date.now()}`);
  const newTestimonial: Testimonial = {
    ...input,
    id: newId,
    order: list.length,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newTestimonial);

  return persistTestimonials(list);
}

/**
 * Reorders the testimonials by an array of IDs.
 */
export async function reorderTestimonials(orderedIds: string[]): Promise<Testimonial[]> {
  const list = await getTestimonials();
  const map = new Map(list.map((t) => [t.id, t]));
  const reordered: Testimonial[] = [];

  for (const id of orderedIds) {
    const item = map.get(id);
    if (item) {
      reordered.push(item);
      map.delete(id);
    }
  }

  // Append any leftover items
  for (const leftover of map.values()) {
    reordered.push(leftover);
  }

  return persistTestimonials(reordered);
}

/**
 * Toggles the hidden state of a testimonial.
 */
export async function toggleTestimonialHidden(id: string, hidden: boolean): Promise<Testimonial[]> {
  const list = await getTestimonials();
  const index = list.findIndex((t) => t.id === id);
  if (index >= 0) {
    list[index] = { ...list[index]!, hidden };
    return persistTestimonials(list);
  }
  return list;
}

/**
 * Deletes a testimonial by id.
 */
export async function deleteTestimonial(id: string): Promise<Testimonial[]> {
  const list = await getTestimonials();
  const filtered = list.filter((t) => t.id !== id);
  return persistTestimonials(filtered);
}

/**
 * Resets testimonials back to default studio quotes.
 */
export async function resetTestimonialsToDefaults(): Promise<Testimonial[]> {
  return persistTestimonials([...DEFAULT_TESTIMONIALS]);
}
