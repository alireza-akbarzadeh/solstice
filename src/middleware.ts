import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next.js internals, and files with an extension.
  // `\\.` — a single backslash in a string literal is dropped and would match any character.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
