"use server";

import { revalidatePath } from "next/cache";

import { getViewer } from "@/modules/memberships/server/viewer";

import { testimonialFormSchema, testimonialReorderSchema, type TestimonialFormValues } from "../schemas";
import type { Testimonial } from "../types";
import {
  deleteTestimonial,
  reorderTestimonials,
  resetTestimonialsToDefaults,
  saveTestimonial,
  toggleTestimonialHidden,
} from "./testimonials";

export type TestimonialsActionResult =
  | { ok: true; testimonials: Testimonial[] }
  | { ok: false; error: "forbidden" | "invalid" | "failed"; message?: string };

async function verifyInstructor(): Promise<boolean> {
  const viewer = await getViewer();
  return viewer.user?.role === "instructor";
}

function revalidatePublicPages() {
  revalidatePath("/", "layout");
  revalidatePath("/fa", "layout");
  revalidatePath("/membership", "layout");
  revalidatePath("/fa/membership", "layout");
}

export async function saveTestimonialAction(data: TestimonialFormValues): Promise<TestimonialsActionResult> {
  if (!(await verifyInstructor())) return { ok: false, error: "forbidden" };

  const parsed = testimonialFormSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: "invalid", message: parsed.error.issues[0]?.message };
  }

  try {
    const updated = await saveTestimonial(parsed.data);
    revalidatePublicPages();
    return { ok: true, testimonials: updated };
  } catch (error) {
    console.error("[testimonials-actions] Save error:", error);
    return { ok: false, error: "failed" };
  }
}

export async function reorderTestimonialsAction(orderedIds: string[]): Promise<TestimonialsActionResult> {
  if (!(await verifyInstructor())) return { ok: false, error: "forbidden" };

  const parsed = testimonialReorderSchema.safeParse({ orderedIds });
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  try {
    const updated = await reorderTestimonials(parsed.data.orderedIds);
    revalidatePublicPages();
    return { ok: true, testimonials: updated };
  } catch (error) {
    console.error("[testimonials-actions] Reorder error:", error);
    return { ok: false, error: "failed" };
  }
}

export async function toggleTestimonialHiddenAction(id: string, hidden: boolean): Promise<TestimonialsActionResult> {
  if (!(await verifyInstructor())) return { ok: false, error: "forbidden" };

  try {
    const updated = await toggleTestimonialHidden(id, hidden);
    revalidatePublicPages();
    return { ok: true, testimonials: updated };
  } catch (error) {
    console.error("[testimonials-actions] Toggle error:", error);
    return { ok: false, error: "failed" };
  }
}

export async function deleteTestimonialAction(id: string): Promise<TestimonialsActionResult> {
  if (!(await verifyInstructor())) return { ok: false, error: "forbidden" };

  try {
    const updated = await deleteTestimonial(id);
    revalidatePublicPages();
    return { ok: true, testimonials: updated };
  } catch (error) {
    console.error("[testimonials-actions] Delete error:", error);
    return { ok: false, error: "failed" };
  }
}

export async function resetTestimonialsAction(): Promise<TestimonialsActionResult> {
  if (!(await verifyInstructor())) return { ok: false, error: "forbidden" };

  try {
    const updated = await resetTestimonialsToDefaults();
    revalidatePublicPages();
    return { ok: true, testimonials: updated };
  } catch (error) {
    console.error("[testimonials-actions] Reset error:", error);
    return { ok: false, error: "failed" };
  }
}
