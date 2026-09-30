import { routing } from "@/i18n/routing";

// `next` query params come from the URL, so only allow same-site, locale-less paths:
// "/practices/x?y=1" is fine; "//evil.com", "https://…" and "/fa/…" are not.
export function safeNextPath(value: unknown, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  try {
    const url = new URL(value, "http://local");
    if (url.origin !== "http://local") return fallback;
    const firstSegment = url.pathname.split("/")[1];
    if (routing.locales.includes(firstSegment as (typeof routing.locales)[number])) {
      url.pathname = url.pathname.slice(firstSegment!.length + 1) || "/";
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

export function withNext(path: string, next: string | undefined) {
  if (!next || next === "/") return path;
  return `${path}${path.includes("?") ? "&" : "?"}next=${encodeURIComponent(next)}`;
}
