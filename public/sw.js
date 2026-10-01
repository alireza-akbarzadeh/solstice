// Arte Yoga Studio service worker: offline support + Web Push. Hand-written, no build step.
//
// Registered as /sw.js?v=<buildId> (next.config.js resolves one id per deployment), so the
// script URL changes whenever the app does and the browser installs a new worker. The version
// therefore needs no hand-bumping: caches are namespaced by the build that filled them, and
// `activate` drops every cache belonging to an older one.
const SELF_URL = new URL(self.location.href);
const VERSION = SELF_URL.searchParams.get("v") ?? "dev";
const STATIC_CACHE = `solstice-static-${VERSION}`;
const PAGE_CACHE = `solstice-pages-${VERSION}`;
const MAX_PAGES = 40;

// Registered as /sw.js?mode=development in dev: skip caching so it never fights hot reload.
const DEV = SELF_URL.searchParams.get("mode") === "development";

const OFFLINE_PAGES = { en: "/offline", fa: "/fa/offline" };
const PRECACHE = [...Object.values(OFFLINE_PAGES), "/icons/icon-192.png", "/icons/badge-96.png"];

// Personal areas are never stored on the device.
const PRIVATE_PATH =
  /^(\/fa)?\/(dashboard|profile|progress|my-practices|community|instructor|sign-in|sign-up|forgot-password|reset-password|verify-email|checkout|test|membership\/welcome)(\/|$)/;

const localeOf = (pathname) => (pathname === "/fa" || pathname.startsWith("/fa/") ? "fa" : "en");

// The offline pages must render with no network, so also cache the stylesheets their HTML
// links and the fonts those stylesheets declare. Hashed /_next/static URLs change with
// every build, hence discovering them at install time.
const STYLESHEET_URL = /\/_next\/static\/[^"'\s<>\\]+\.css/g;
const FONT_URL = /\/_next\/static\/media\/[^"'\s)]+\.woff2/g;

async function precache() {
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(PRECACHE.filter((url) => !Object.values(OFFLINE_PAGES).includes(url)));
  const stylesheets = new Set();
  for (const page of Object.values(OFFLINE_PAGES)) {
    const response = await fetch(page, { cache: "reload" });
    if (!response.ok) throw new Error(`precache failed: ${page}`);
    for (const [url] of (await response.clone().text()).matchAll(STYLESHEET_URL)) stylesheets.add(url);
    await cache.put(page, response);
  }
  const fonts = new Set();
  for (const url of stylesheets) {
    const response = await fetch(url);
    for (const [font] of (await response.clone().text()).matchAll(FONT_URL)) fonts.add(font);
    await cache.put(url, response);
  }
  await cache.addAll(["/images/brand/logo.svg", ...fonts]);
}

self.addEventListener("install", (event) => {
  // Deliberately no skipWaiting() here. A new worker installs in the background and then
  // *waits*, so the running page keeps being served by the worker its JavaScript was built
  // against. The member chooses when to switch, via the SKIP_WAITING message below.
  // In development there is no prompt and nothing is cached, so taking over at once is fine.
  event.waitUntil(
    (async () => {
      if (DEV) {
        await self.skipWaiting();
        return;
      }
      await precache();
    })(),
  );
});

// Sent by the client when the member accepts the update (see pwa-update-provider.tsx).
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, PAGE_CACHE]);
      for (const key of await caches.keys()) {
        if (key.startsWith("solstice-") && (DEV || !keep.has(key))) await caches.delete(key);
      }
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (const request of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(request);
}

async function handleNavigation(event) {
  const url = new URL(event.request.url);
  try {
    const response = (await event.preloadResponse) || (await fetch(event.request));
    if (response.ok && !PRIVATE_PATH.test(url.pathname)) {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(event.request, response.clone());
      event.waitUntil(trimCache(PAGE_CACHE, MAX_PAGES));
    }
    return response;
  } catch {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    return (await caches.match(OFFLINE_PAGES[localeOf(url.pathname)])) || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (DEV) return;
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  // React Server Component payloads are per-navigation data, not pages.
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }
  // Content-hashed build output, our images and icons never change under the same URL.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(request));
  }
});

// --- Web Push ---------------------------------------------------------------------------

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || (data.lang === "fa" ? "استودیو یوگای آرته" : "Arte Yoga Studio");
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag,
      lang: data.lang,
      dir: data.dir || "auto",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).pathname === target.pathname && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(target.href);
    })(),
  );
});

// The browser rotated our subscription: subscribe again and tell the server.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const options = event.oldSubscription?.options;
      if (!options) return;
      const subscription = event.newSubscription || (await self.registration.pushManager.subscribe(options));
      await fetch("/api/push/subscription", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          oldEndpoint: event.oldSubscription?.endpoint,
          subscription: subscription.toJSON(),
        }),
      });
    })(),
  );
});
