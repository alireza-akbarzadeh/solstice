"use server";

import { revalidatePath } from "next/cache";

import { getViewer } from "@/modules/memberships/server/viewer";
import { newsletterIssueSchema } from "@/modules/newsletter/schemas";
import { sendIssue } from "@/modules/newsletter/server/issues";

export type NewsletterResult =
  | { ok: true; recipients: number; failed: number; mailbox: boolean }
  | { ok: false; error: "forbidden" | "invalid" | "failed" };

export async function sendNewsletter(input: unknown): Promise<NewsletterResult> {
  if ((await getViewer()).user?.role !== "instructor") return { ok: false, error: "forbidden" };
  const parsed = newsletterIssueSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const result = await sendIssue(parsed.data);
    revalidatePath("/[locale]/instructor/subscribers", "page");
    return { ok: true, ...result };
  } catch (error) {
    console.error("Newsletter could not be sent.", error);
    return { ok: false, error: "failed" };
  }
}
