import type { AiProvider } from "../types";

// Test mode: a canned reply that echoes the question, so the chat, labels and notifications can
// be tried without a key or any request leaving the server.

export const testProvider: AiProvider = {
  id: "test",
  model: "test",
  testMode: true,
  async reply({ turns, locale }) {
    const asked = turns.at(-1)?.text.slice(0, 120) ?? "";
    const text =
      locale === "fa"
        ? `(پاسخ آزمایشی) دستیار در حالت آزمایشی است و هنوز به هوش مصنوعی وصل نیست. پرسیدید: «${asked}»`
        : `(Test reply) The assistant is in test mode and not connected to an AI yet. You asked: “${asked}”`;
    return { text, model: "test" };
  },
};
