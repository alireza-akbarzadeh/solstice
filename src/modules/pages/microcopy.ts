/**
 * Helpers for classifying website copy into primary marketing copy vs
 * interactive app microcopy (buttons, error alerts, status badges, player shortcuts),
 * and discovering / validating ICU message variables ({name}, {count}, etc.).
 */

/** Extracts variable tokens like {name}, {count}, {count, plural, one {# ...} other {# ...}}, etc. */
export function extractIcuVariables(text: string): string[] {
  if (!text) return [];
  const results: string[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === "{") {
      const after = text.slice(i + 1);
      if (/^[a-zA-Z0-9_]/.test(after)) {
        let depth = 1;
        let j = i + 1;
        while (j < text.length && depth > 0) {
          if (text[j] === "{") depth++;
          else if (text[j] === "}") depth--;
          j++;
        }
        if (depth === 0) {
          results.push(text.slice(i, j));
          i = j;
          continue;
        }
      }
    }
    i++;
  }
  return Array.from(new Set(results));
}

/** Extracts root variable name (e.g. {count, number} -> count) */
export function getIcuVarName(token: string): string {
  const match = /\{([a-zA-Z0-9_]+)/.exec(token);
  return match ? match[1]! : token.replace(/[{}]/g, "");
}

/** Identifies technical app microcopy (buttons, status codes, toasts, alerts) vs marketing copy */
export function isMicrocopyKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    /^(errors?|actions?|buttons?|status|validation|placeholders?|aria|shortcuts?|tooltips?|toast|copied|filters?|options?|pacing|empty)$/i.test(
      key,
    ) || /error|button|shortcut|validation|toast|copied/.test(lower)
  );
}

/** Namespaces containing technical/interactive system microcopy rather than marketing copy */
export const MICROCOPY_NAMESPACES = new Set([
  "Practice",
  "PracticeDetail",
  "PracticeActions",
  "Program",
  "Account",
  "Auth",
  "Metadata",
  "Nav",
  "Legal.updated",
  "Legal.updatedDate",
  "NotFound",
  "Offline",
  "Notifications",
  "Pwa",
  "LocaleSwitcher",
]);

export function isMicrocopyNamespace(namespace: string): boolean {
  return MICROCOPY_NAMESPACES.has(namespace);
}
