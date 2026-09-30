"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { formText } from "@/lib/form-data";
import { withNext } from "@/lib/safe-next";
import { getViewer } from "@/modules/memberships/server/viewer";

import { getProgram } from "./server/get-program";
import { enroll, restartProgram as restart } from "./server/progress";

// Programs are included with membership: account first, then membership, then back here.
export async function enrollInProgram(formData: FormData) {
  const locale = await getLocale();
  const program = await getProgram(locale, formText(formData, "program"));
  if (!program) return redirect({ href: "/programs", locale });

  const here = `/programs/${program.slug}`;
  const viewer = await getViewer();
  if (!viewer.user) return redirect({ href: withNext("/sign-up", withNext("/membership", here)), locale });
  if (!viewer.hasAccess) return redirect({ href: withNext("/membership", here), locale });

  await enroll(viewer.user.id, program.slug);
  revalidatePath("/[locale]", "layout");
  return redirect({ href: `${here}#syllabus`, locale });
}

export async function restartProgram(formData: FormData) {
  const locale = await getLocale();
  const program = await getProgram(locale, formText(formData, "program"));
  const viewer = await getViewer();
  if (!program || !viewer.user) return redirect({ href: "/programs", locale });

  await restart(viewer.user.id, program.slug);
  revalidatePath("/[locale]", "layout");
  return redirect({ href: `/programs/${program.slug}`, locale });
}
