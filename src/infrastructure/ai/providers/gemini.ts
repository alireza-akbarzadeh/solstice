import { AiError, type AiProvider, type AiRequest } from "../types";

// Google Gemini over its REST API (no SDK): one generateContent call per reply. The free tier
// (Flash and Flash-Lite models) allows about 15 requests a minute; Google may use free-tier
// prompts to improve its products, so the app only sends it quick-help questions by default.

const endpoint = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { code?: number; status?: string; message?: string };
};

export function geminiProvider({ apiKey, model }: { apiKey: string; model: string }): AiProvider {
  return {
    id: "gemini",
    model,
    testMode: false,
    async reply(request: AiRequest) {
      let response: Response;
      try {
        response = await fetch(endpoint(model), {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: request.system }] },
            contents: request.turns.map((turn) => ({
              role: turn.role === "assistant" ? "model" : "user",
              parts: [{ text: turn.text }],
            })),
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 800,
              // Flash models "think" by default, which spends the output budget (replies end mid-
              // sentence) and adds seconds. Gemini 3 takes a level; 2.5 takes a token budget.
              ...(model.startsWith("gemini-3")
                ? { thinkingConfig: { thinkingLevel: "minimal" } }
                : model.includes("2.5-flash")
                  ? { thinkingConfig: { thinkingBudget: 0 } }
                  : {}),
            },
          }),
          signal: AbortSignal.timeout(25_000),
        });
      } catch (error) {
        throw new AiError("unavailable", error instanceof Error ? error.message : String(error));
      }

      const data = (await response.json().catch(() => ({}))) as GeminiResponse;
      if (!response.ok) {
        const detail = data.error?.message ?? `HTTP ${response.status}`;
        if (response.status === 429) throw new AiError("quota", detail);
        if (response.status === 401 || response.status === 403 || /API key/i.test(detail)) throw new AiError("auth", detail);
        throw new AiError("unavailable", detail);
      }
      if (data.promptFeedback?.blockReason) throw new AiError("blocked", data.promptFeedback.blockReason);

      const candidate = data.candidates?.[0];
      const text = (candidate?.content?.parts ?? []).map((part) => part.text ?? "").join("").trim();
      if (!text) throw new AiError(candidate?.finishReason === "SAFETY" ? "blocked" : "unavailable", candidate?.finishReason ?? "empty reply");
      return { text, model };
    },
  };
}

// Speech, image, robotics and other special-purpose models also answer generateContent but
// can't hold a text chat, so the studio's model picker leaves them out. Google still lists 1.x
// and 2.x models but refuses them to keys created since 2026 ("no longer available to new users").
const notForChat = /tts|image|robotics|computer-use|transcribe|customtools|omni|embedding|aqa|live|audio|banana|lyria|antigravity|research/;

/**
 * The chat models this key can use, newest first with previews last, or null when Google can't
 * be reached or refuses the key. Google retires models for new keys, so the studio picks from
 * this list rather than from names written into the app.
 */
export async function listGeminiModels(apiKey: string): Promise<string[] | null> {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
      headers: { "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const preview = (name: string) => /preview|exp|latest/.test(name);
    return (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""))
      .filter((name) => name.startsWith("gemini-") && !/^gemini-[12]\./.test(name) && !notForChat.test(name))
      .sort((a, b) => Number(preview(a)) - Number(preview(b)) || b.localeCompare(a, "en", { numeric: true }));
  } catch {
    return null;
  }
}
