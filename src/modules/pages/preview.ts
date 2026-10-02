import { pageDefinition } from "./definitions";

export const pagePreviewQuery = "cmsPreview";
export const pagePreviewHeader = "x-solstice-page-preview";

export function pagePreviewPath(slug: string) {
  const definition = pageDefinition(slug);
  return definition
    ? `${definition.path}?${pagePreviewQuery}=${encodeURIComponent(slug)}`
    : `/instructor/pages/preview/${encodeURIComponent(slug)}`;
}
