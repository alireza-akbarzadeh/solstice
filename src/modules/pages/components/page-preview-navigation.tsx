"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { pagePreviewQuery } from "../preview";

/** App Router retains layouts across navigation; refresh their draft messages on exit. */
export function PagePreviewNavigation({ slug }: { slug: string }) {
  const activePreview = useSearchParams().get(pagePreviewQuery);
  useEffect(() => {
    if (activePreview !== slug) window.location.reload();
  }, [activePreview, slug]);
  return null;
}
