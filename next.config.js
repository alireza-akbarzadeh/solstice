/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

import { execFileSync } from "node:child_process";

import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * One identifier per deployment, resolved automatically so nobody has to remember to bump a
 * version by hand. The service worker is registered as `/sw.js?v=<buildId>`: a browser decides
 * a worker is new by comparing the script URL and bytes, so without this a deploy that doesn't
 * happen to edit sw.js would never reach an installed PWA at all.
 *
 * Set NEXT_PUBLIC_BUILD_ID explicitly to force a distinct build — useful for testing the update
 * flow twice from the same commit.
 */
function resolveBuildId() {
  if (process.env.NEXT_PUBLIC_BUILD_ID) return process.env.NEXT_PUBLIC_BUILD_ID;
  // Vercel (and most CI) expose the commit; same commit → same build → no spurious update prompt.
  if (process.env.VERCEL_GIT_COMMIT_SHA)
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12);
  try {
    // execFile, not exec: no shell, so nothing here can be interpreted as a command.
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    // No git (a tarball build, say): fall back to the build time.
    return Date.now().toString(36);
  }
}

const buildId = resolveBuildId();

/** @type {import("next").NextConfig} */
const config = {
  // A production build and a `next dev` server share .next and corrupt each other's output —
  // the symptom is Turbopack failing to resolve next/font modules. Setting NEXT_DIST_DIR lets a
  // one-off build go somewhere else while a dev server keeps running. Unset, nothing changes.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  env: { NEXT_PUBLIC_BUILD_ID: buildId },
  // CMS covers can use public HTTPS images, including the automatic YouTube thumbnail.
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  generateBuildId: () => buildId,
  async headers() {
    return [
      {
        // Browsers must always revalidate the service worker so updates roll out promptly.
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default withNextIntl(config);
