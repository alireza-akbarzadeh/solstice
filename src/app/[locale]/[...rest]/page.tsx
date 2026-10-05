import { notFound } from "next/navigation";

/**
 * Sends a path that matched no real route to `[locale]/not-found.tsx`, in the visitor's
 * language. Requests that never reach a locale (paths with a dot, like /old-page.html, which the
 * middleware skips) get the bilingual `app/not-found.tsx` instead, so no visitor sees Next's
 * untranslated built-in page.
 */
export default function CatchAllNotFound() {
  notFound();
}
