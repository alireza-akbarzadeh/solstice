import { aiEnv, DEFAULT_GEMINI_MODEL, loadAiConfig, readStoredAssistantSettings, type AiMode, type StoredAssistantSettings } from "@/infrastructure/ai";
import { seal } from "@/lib/secret-box";
import { db } from "@/server/db";
import { settings } from "@/server/db/schema";

import type { AssistantSettingsInput } from "../schemas";

export const DEFAULT_REPLY_HOURS = 24;
export const DEFAULT_DAILY_LIMIT = 300;

/** The chat settings with defaults filled in, for the pages and the reply logic. */
export type ChatSettings = {
  mode: AiMode;
  /** The assistant can answer now (on, and Gemini has a key). */
  assistantOn: boolean;
  instructions: string;
  guidanceAi: boolean;
  replyHours: number;
  dailyLimit: number;
};

export async function getChatSettings(stored?: StoredAssistantSettings): Promise<ChatSettings> {
  const row = stored ?? (await readStoredAssistantSettings());
  const config = await loadAiConfig(row);
  return {
    mode: config.mode,
    assistantOn: config.mode === "test" || (config.mode === "gemini" && !!config.apiKey),
    instructions: row.instructions ?? "",
    guidanceAi: row.guidanceAi ?? false,
    replyHours: row.replyHours ?? DEFAULT_REPLY_HOURS,
    dailyLimit: row.dailyLimit ?? DEFAULT_DAILY_LIMIT,
  };
}

/** What the studio's settings page shows: everything but the key, and what the server fixes. */
export type AssistantSettingsView = {
  mode: AiMode;
  model: string;
  apiKeyLast4: string | null;
  instructions: string;
  guidanceAi: boolean;
  replyHours: string;
  dailyLimit: string;
  fromEnv: { apiKey: boolean; model: boolean };
  /** On but unusable: Gemini chosen without a key. */
  missingKey: boolean;
};

export async function getAssistantSettingsView(): Promise<AssistantSettingsView> {
  const stored = await readStoredAssistantSettings();
  const [config, chat] = await Promise.all([loadAiConfig(stored), getChatSettings(stored)]);
  const env = aiEnv();
  return {
    mode: config.mode,
    model: config.model,
    apiKeyLast4: env.apiKey ? env.apiKey.slice(-4) : (stored.apiKey?.last4 ?? null),
    instructions: chat.instructions,
    guidanceAi: chat.guidanceAi,
    replyHours: String(chat.replyHours),
    dailyLimit: String(chat.dailyLimit),
    fromEnv: { apiKey: !!env.apiKey, model: !!env.model },
    missingKey: config.mode === "gemini" && !config.apiKey,
  };
}

export async function saveAssistantSettings(input: AssistantSettingsInput) {
  const current = await readStoredAssistantSettings();
  const env = aiEnv();
  const apiKey = env.apiKey
    ? current.apiKey
    : input.apiKey
      ? { sealed: seal(input.apiKey), last4: input.apiKey.slice(-4) }
      : input.clearApiKey
        ? undefined
        : current.apiKey;
  const value: StoredAssistantSettings = {
    mode: input.mode,
    model: env.model ? current.model : input.model || DEFAULT_GEMINI_MODEL,
    apiKey,
    instructions: input.instructions,
    guidanceAi: input.guidanceAi,
    replyHours: input.replyHours,
    dailyLimit: input.dailyLimit,
  };
  await db
    .insert(settings)
    .values({ key: "assistant", value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}
