"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/** How often an open tab asks the browser to re-check /sw.js for a new deployment. */
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

type PwaUpdateValue = {
  /** A new version has installed and is waiting for the member to accept it. */
  updateReady: boolean;
  /** The switch is under way: the worker was told to activate and a reload is coming. */
  isUpdating: boolean;
  /** Accept the update: activate the waiting worker, then reload once it has taken over. */
  update: () => void;
  /** Hide the prompt for now. A later deployment raises it again. */
  dismiss: () => void;
};

const PwaUpdateContext = createContext<PwaUpdateValue | null>(null);

/**
 * Keeps an installed PWA up to date without ever being reinstalled.
 *
 * `next.config.js` gives every deployment an id and we register `/sw.js?v=<id>`, so a new
 * deployment is a new worker script. That worker installs in the background and waits; the
 * page carries on being served by the worker its JavaScript was built against, which is what
 * stops a half-updated app from asking for chunks that no longer exist. Only when the member
 * accepts do we send SKIP_WAITING, and only once the new worker is actually in control
 * (`controllerchange`) do we reload.
 *
 * Everything here is an enhancement: if any of it fails the app still loads normally.
 */
export function PwaUpdateProvider({ children }: { children: React.ReactNode }) {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  /** True only in the tab that accepted the update, so other tabs are not reloaded under the member. */
  const acceptedRef = useRef(false);
  /** controllerchange can fire more than once; one reload is enough. */
  const reloadedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const isProduction = process.env.NODE_ENV === "production";
    const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
    // Development registers a worker that caches nothing, and never prompts — otherwise every
    // hot reload would offer a "new version".
    const scriptUrl = isProduction ? `/sw.js?v=${buildId}` : "/sw.js?mode=development";

    let cancelled = false;

    const trackInstalling = (worker: ServiceWorker) => {
      const onStateChange = () => {
        // `controller` is null on a first-ever install: there is no older version to replace,
        // so the worker simply activates and there is nothing to tell the member about.
        if (worker.state === "installed" && navigator.serviceWorker.controller && !cancelled) {
          setWaiting(worker);
          setDismissed(false);
        }
        if (worker.state === "redundant") worker.removeEventListener("statechange", onStateChange);
      };
      worker.addEventListener("statechange", onStateChange);
    };

    const onControllerChange = () => {
      if (reloadedRef.current) return;
      if (acceptedRef.current) {
        reloadedRef.current = true;
        window.location.reload();
        return;
      }
      // Another tab accepted the update, so this tab's waiting worker is gone. Drop the prompt
      // rather than leaving it stuck, but don't reload underneath whatever is on screen here.
      setWaiting(null);
      setIsUpdating(false);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let interval: ReturnType<typeof setInterval> | undefined;
    let onVisibility: (() => void) | undefined;

    navigator.serviceWorker
      .register(scriptUrl, { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        if (cancelled) return;
        registrationRef.current = registration;
        if (!isProduction) return;

        // Installed during an earlier visit and still waiting.
        if (registration.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting);
        if (registration.installing) trackInstalling(registration.installing);

        registration.addEventListener("updatefound", () => {
          if (registration.installing) trackInstalling(registration.installing);
        });

        // Re-checks the script at its *registered* URL. A new deployment is normally found at
        // page load instead, because the new bundle registers a different `?v=` — which for an
        // installed PWA is every cold open. This covers the narrower case of sw.js itself
        // changing under the same URL, and costs nothing when there is nothing to find.
        const check = () => void registration.update().catch(() => undefined);
        onVisibility = () => {
          if (document.visibilityState === "visible") check();
        };
        document.addEventListener("visibilitychange", onVisibility);
        interval = setInterval(check, UPDATE_INTERVAL_MS);
      })
      .catch((error: unknown) => {
        // Registration can fail legitimately: private browsing, a blocked worker, no HTTPS.
        console.error("[pwa] service worker registration failed", error);
      });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      if (onVisibility) document.removeEventListener("visibilitychange", onVisibility);
      if (interval) clearInterval(interval);
    };
  }, []);

  const update = useCallback(() => {
    acceptedRef.current = true;
    setIsUpdating(true);

    const worker = waiting ?? registrationRef.current?.waiting ?? null;
    if (worker) {
      worker.postMessage({ type: "SKIP_WAITING" });
      // The reload happens on controllerchange, once the new worker is genuinely in control.
      return;
    }

    // No worker left to activate — another tab already switched, or it went redundant. A plain
    // reload still lands on the current version, so the member is never stuck on the prompt.
    if (!reloadedRef.current) {
      reloadedRef.current = true;
      window.location.reload();
    }
  }, [waiting]);

  const dismiss = useCallback(() => setDismissed(true), []);

  const value = useMemo<PwaUpdateValue>(
    () => ({ updateReady: waiting !== null && !dismissed, isUpdating, update, dismiss }),
    [waiting, dismissed, isUpdating, update, dismiss],
  );

  return <PwaUpdateContext.Provider value={value}>{children}</PwaUpdateContext.Provider>;
}

/** Null outside the provider, so a component can use it without being wrapped. */
export function usePwaUpdate() {
  return useContext(PwaUpdateContext);
}
