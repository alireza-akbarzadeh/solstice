import { loadAiConfig, type StoredAssistantSettings } from "./config";
import { geminiProvider } from "./providers/gemini";
import { testProvider } from "./providers/test";
import type { AiProvider } from "./types";

export * from "./types";
export { aiEnv, loadAiConfig, readStoredAssistantSettings, type StoredAssistantSettings } from "./config";

/**
 * The provider the studio chose, or null when the assistant is off (or set to Gemini without a
 * key). Adding another AI means one provider file and one more mode here.
 */
export async function getAiProvider(stored?: StoredAssistantSettings): Promise<AiProvider | null> {
  const config = await loadAiConfig(stored);
  if (config.mode === "test") return testProvider;
  if (config.mode === "gemini" && config.apiKey) return geminiProvider({ apiKey: config.apiKey, model: config.model });
  return null;
}
