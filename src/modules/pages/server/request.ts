import { headers } from "next/headers";
import { cache } from "react";
import { getSession } from "@/server/better-auth/server";
import { pageDefinition } from "../definitions";
import { pagePreviewHeader } from "../preview";
import { getPageAssets as getPublishedPageAssets, getSitePage } from "./library";

/** A query/header alone can never reveal a draft: verify the instructor's session first. */
export const getBuiltinPagePreview = cache(async () => {
  const slug = (await headers()).get(pagePreviewHeader);
  if (!slug || !pageDefinition(slug)) return null;
  const session = await getSession();
  if (session?.user.role !== "instructor") return null;
  const page = await getSitePage(slug);
  return page?.builtin ? page : null;
});

export async function getPageAssets(slug: string): Promise<Record<string, string>> {
  const preview = await getBuiltinPagePreview();
  if (preview?.slug === slug)
    return { ...pageDefinition(slug)?.assets, ...preview.draftContent.assets };
  return getPublishedPageAssets(slug);
}
