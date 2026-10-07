import type { Localized } from "@/lib/localized";

export type StoredPracticeChapter = {
  title: Localized;
  description: Localized;
  startSeconds: number;
};

/** Formats integer seconds into "mm:ss" or "hh:mm:ss" string. */
export function formatChapterTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const mm = mins.toString().padStart(2, "0");
  const ss = secs.toString().padStart(2, "0");

  if (hrs > 0) {
    return `${hrs}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Parses user input into total integer seconds.
 * Accepts "mm:ss", "m:ss", "hh:mm:ss", raw seconds, and Persian/Arabic digits.
 */
export function parseChapterTime(input: string | number): number {
  if (typeof input === "number") {
    return Number.isFinite(input) && input >= 0 ? Math.floor(input) : 0;
  }
  if (!input) return 0;

  // Convert Persian and Arabic numerals to ASCII
  const normalized = input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .trim();

  if (normalized.includes(":")) {
    const parts = normalized.split(":").map((p) => {
      const n = parseInt(p.trim(), 10);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    });

    if (parts.length === 2) {
      const [m = 0, s = 0] = parts;
      return m * 60 + s;
    }
    if (parts.length === 3) {
      const [h = 0, m = 0, s = 0] = parts;
      return h * 3600 + m * 60 + s;
    }
  }

  const parsed = parseInt(normalized, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/** Sorts a chapter list by startSeconds ascending. */
export function sortChapters<T extends { startSeconds?: number }>(chapters: T[]): T[] {
  return [...chapters].sort((a, b) => (a.startSeconds ?? 0) - (b.startSeconds ?? 0));
}
