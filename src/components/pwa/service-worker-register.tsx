"use client";

import { useEffect } from "react";

// Registers public/sw.js. In development the worker skips all caching (see its DEV flag),
// so it only provides push handling and never serves stale builds.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const url = process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?mode=development";
    navigator.serviceWorker.register(url, { scope: "/", updateViaCache: "none" }).catch((error: unknown) => {
      console.error("[sw] registration failed", error);
    });
  }, []);

  return null;
}
