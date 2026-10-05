import { eq } from "drizzle-orm";

import { env } from "@/env";
import { open } from "@/lib/secret-box";
import { db } from "@/server/db";
import { settings } from "@/server/db/schema";

// Which AI answers, read at reply time: the "assistant" settings row the studio edits
// (/instructor/inbox/settings, key sealed with lib/secret-box), with GEMINI_API_KEY and
// GEMINI_MODEL winning when set.

export const aiModes = ["off", "test", "gemini"] as const;
export type AiMode = (typeof aiModes)[number];

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** The settings row as modules/conversations stores it. */
export type StoredAssistantSettings = {
  mode?: AiMode;
  model?: string;
  apiKey?: { sealed: string; last4: string };
  /** The studio's own notes for the assistant: FAQ answers, tone, what not to promise. */
  instructions?: string;
  /** The assistant also answers guidance questions first (labeled AI); the studio still replies. */
  guidanceAi?: boolean;
  /** "Usually replies within …" shown on the guidance page, in hours. */
  replyHours?: number;
  /** Assistant replies allowed per day across the site, to stay inside a free quota. */
  dailyLimit?: number;
};

export async function readStoredAssistantSettings(): Promise<StoredAssistantSettings> {
  try {
    const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "assistant")).limit(1);
    return (row?.value ?? {}) as StoredAssistantSettings;
  } catch {
    return {};
  }
}

/** Which fields the server's environment sets (and so the studio can't change). */
export const aiEnv = () => ({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL });

export type AiConfig = { mode: AiMode; model: string; apiKey?: string };

export async function loadAiConfig(stored?: StoredAssistantSettings): Promise<AiConfig> {
  const row = stored ?? (await readStoredAssistantSettings());
  const fromEnv = aiEnv();
  const sealed = row.apiKey?.sealed;
  return {
    mode: aiModes.find((mode) => mode === row.mode) ?? "off",
    model: fromEnv.model || row.model || DEFAULT_GEMINI_MODEL,
    apiKey: fromEnv.apiKey || (sealed ? (open(sealed) ?? undefined) : undefined),
  };
}
