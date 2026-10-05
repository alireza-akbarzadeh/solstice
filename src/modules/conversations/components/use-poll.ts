"use client";

import { useEffect, useRef } from "react";

/**
 * Runs `tick` every `ms` while the tab is visible (and once when it becomes visible again), so
 * an open conversation picks up replies without sockets. Ticks never overlap.
 */
export function usePoll(tick: () => Promise<void>, ms: number, enabled = true) {
  const latest = useRef(tick);
  useEffect(() => {
    latest.current = tick;
  });

  useEffect(() => {
    if (!enabled) return;
    let busy = false;
    const run = () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      void latest.current().finally(() => {
        busy = false;
      });
    };
    const timer = window.setInterval(run, ms);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [ms, enabled]);
}

/** Appends messages that aren't already in the list (a poll can race a send). */
export function mergeMessages<T extends { id: number }>(current: T[], incoming: T[]) {
  if (!incoming.length) return current;
  const seen = new Set(current.map((m) => m.id));
  return [...current, ...incoming.filter((m) => !seen.has(m.id))].sort((a, b) => a.id - b.id);
}
