import type { MetadataRoute } from "next";

import { env } from "@/env";
import { routing } from "@/i18n/routing";

/** Areas only for signed-in people or for the site itself; never worth indexing. */
const privatePaths = [
  "/instructor",
  "/dashboard",
  "/profile",
  "/community",
  "/my-practices",
  "/progress",
  "/checkout",
  "/membership/welcome",
  "/unsubscribe",
  "/test",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

// /robots.txt: everything public may be crawled; private areas are disallowed in every
// language (English has no prefix, Persian lives under /fa).
export default function robots(): MetadataRoute.Robots {
  const prefixes = routing.locales.filter((l) => l !== routing.defaultLocale).map((l) => `/${l}`);
  const disallow = ["/api/", ...privatePaths, ...prefixes.flatMap((prefix) => privatePaths.map((path) => `${prefix}${path}`))];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: new URL("/sitemap.xml", env.BETTER_AUTH_URL).toString(),
  };
}
