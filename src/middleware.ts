import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { pageDefinition } from "@/modules/pages/definitions";
import { pagePreviewHeader, pagePreviewQuery } from "@/modules/pages/preview";

const localeMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Never trust a caller-supplied preview header. Rebuild it from the current URL;
  // the server still checks the instructor's session before loading any draft.
  request.headers.delete(pagePreviewHeader);
  const slug = request.nextUrl.searchParams.get(pagePreviewQuery);
  const preview = !!slug && !!pageDefinition(slug);
  if (preview) request.headers.set(pagePreviewHeader, slug);
  const response = localeMiddleware(request);
  if (preview) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  // Skip API routes, Next.js internals, and files with an extension.
  // `\\.` — a single backslash in a string literal is dropped and would match any character.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
