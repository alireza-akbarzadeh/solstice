import { notFound } from "next/navigation";

/**
 * Sends a path that matched no real route to `[locale]/not-found.tsx`.
 *
 * Caveat worth knowing before you rely on it: this works in development, but in a production
 * build Next resolves an unmatched path to its own built-in 404 before reaching here, so a
 * completely unknown top-level path (/no-such-page) still shows the untranslated Next page.
 * What the localized 404 *does* cover in production — and what people actually hit — is every
 * notFound() thrown by a real page: a dead practice slug, a removed essay, an unknown locale.
 */
export default function CatchAllNotFound() {
  notFound();
}
