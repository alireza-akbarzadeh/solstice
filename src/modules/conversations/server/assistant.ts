import { asc, eq } from "drizzle-orm";
import { getFormatter, getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { AiError, getAiProvider, readStoredAssistantSettings, type AiTurn } from "@/infrastructure/ai";
import { localize } from "@/lib/localized";
import { formatMoney, type Currency } from "@/modules/memberships/plans";
import { getAllPlans } from "@/modules/memberships/server/plans";
import { getPaymentMethods } from "@/modules/payments/server/routing";
import { db } from "@/server/db";
import { conversationMessages, type conversations } from "@/server/db/schema";

import type { AiFailure } from "../types";
import { addMessage, countAiRepliesSince } from "./conversations";
import { getGuidancePlaces, isFull } from "./guidance";
import { getChatSettings } from "./settings";

// The AI assistant: instructions built from what the site really sells (plans, prices, trials,
// payment methods, guidance places) plus the studio's own notes, and one reply per message.

type Conversation = typeof conversations.$inferSelect;

const HISTORY = 20;

/** The facts the assistant may quote, written in English (it answers in the reader's language). */
async function siteFacts(): Promise<string> {
  const [plans, places, { methods }, tBrand, format] = await Promise.all([
    getAllPlans(),
    getGuidancePlaces("en"),
    getPaymentMethods(),
    getTranslations({ locale: "en", namespace: "Brand" }),
    getFormatter({ locale: "en" }),
  ]);
  const money = (amount: number, currency: Currency) => formatMoney(format, amount, currency, "en");
  const placesBy = new Map(places.map((p) => [p.planId, p]));

  const planLines = plans
    .filter((plan) => plan.status === "active")
    .map((plan) => {
      const prices = Object.entries(plan.prices)
        .map(([currency, amount]) => money(amount!, currency as Currency))
        .join(" or ");
      const period = plan.intervalMonths === 1 ? "month" : `${plan.intervalMonths} months`;
      const parts = [
        `- ${localize(plan.name, "en")} (Persian name: ${plan.name.fa}): ${prices} every ${period}.`,
        plan.trialDays > 0 ? `${plan.trialDays}-day free trial (first membership only).` : "No free trial.",
        localize(plan.description, "en"),
        plan.features.length ? `Includes: ${plan.features.map((f) => localize(f, "en")).join("; ")}.` : "",
      ];
      const p = placesBy.get(plan.id);
      if (plan.guidance) {
        parts.push(
          p && p.places > 0
            ? isFull(p)
              ? `Includes 1:1 guidance with the instructor; all ${p.places} places are taken right now (members can join the waitlist).`
              : `Includes 1:1 guidance with the instructor; ${p.places - p.used} of ${p.places} places left.`
            : "Includes 1:1 guidance with the instructor.",
        );
      }
      return parts.filter(Boolean).join(" ");
    });

  const payLines = methods.map((m) =>
    m.cards === "iranian"
      ? "- Iranian bank cards (Zarinpal), priced in toman. These periods don't renew automatically: the member presses Renew and gets an email reminder 3 days before the end."
      : `- International cards (${m.currency}), renewing automatically until cancelled.`,
  );

  return [
    `Studio: ${tBrand("name")} ${tBrand("studio")}, an online yoga studio led by ${tBrand("instructor")}.`,
    "Members get the full practice library (video classes), programs, the journal, progress tracking and the community.",
    "Pages: /membership (plans and checkout), /practices, /programs, /journal, /about, /guidance (1:1 questions to the instructor, for plans that include it), /profile (membership, receipts, cancel or renew).",
    planLines.length ? `Plans on sale:\n${planLines.join("\n")}` : "No plans are on sale right now.",
    payLines.length ? `Ways to pay:\n${payLines.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function systemPrompt(kind: Conversation["kind"], instructions: string) {
  const tBrand = await getTranslations({ locale: "en", namespace: "Brand" });
  const rules = [
    `You are the AI assistant on the website of ${tBrand("name")} ${tBrand("studio")}. You are an AI, not ${tBrand("instructor")} and not a person; if asked, say so plainly.`,
    "Reply in the language the person writes in (usually English or Persian). Keep answers short — a few sentences, plain text, no headings or tables.",
    "Use only the facts below for plans, prices, trials, payments and places. Never invent prices, discounts, dates or promises. If you don't know, say so and suggest the \"Talk to a person\" button.",
    "You can explain yoga basics in general terms, but never diagnose, treat or give medical advice. For pain, injury, pregnancy or health conditions, suggest a doctor and the instructor's 1:1 guidance.",
    "Don't ask for passwords, card numbers or other payment details.",
  ];
  if (kind === "guidance") {
    rules.push(
      `This is a private 1:1 guidance thread with ${tBrand("instructor")}. You answer first while the member waits; say that ${tBrand("instructor")} will read the question and reply personally. Be careful and gentle; don't give exercise prescriptions for injuries.`,
    );
  }
  return [rules.join("\n"), `Facts:\n${await siteFacts()}`, instructions ? `Notes from the studio (follow these):\n${instructions}` : ""]
    .filter(Boolean)
    .join("\n\n");
}

export type AssistantResult = { ok: true; message: typeof conversationMessages.$inferSelect } | { ok: false; reason: AiFailure };

/**
 * Writes the assistant's reply to the latest messages of a conversation and stores it as an AI
 * message. Fails without storing anything when the assistant is off, over its daily limit, or
 * the provider refuses.
 */
export async function replyAsAssistant(row: Conversation): Promise<AssistantResult> {
  const stored = await readStoredAssistantSettings();
  const [provider, settings] = await Promise.all([getAiProvider(stored), getChatSettings(stored)]);
  if (!provider) return { ok: false, reason: "off" };
  if ((await countAiRepliesSince(new Date(Date.now() - 24 * 60 * 60 * 1000))) >= settings.dailyLimit) return { ok: false, reason: "limit" };

  const history = await db
    .select({ author: conversationMessages.author, body: conversationMessages.body })
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, row.id))
    .orderBy(asc(conversationMessages.id));
  const turns: AiTurn[] = history.slice(-HISTORY).map((m) => ({
    role: m.author === "member" ? "user" : "assistant",
    text: m.author === "instructor" ? `[The instructor replied:] ${m.body}` : m.body,
  }));
  // Gemini expects the conversation to start with the person.
  while (turns[0]?.role === "assistant") turns.shift();
  if (!turns.length) return { ok: false, reason: "unavailable" };

  try {
    const reply = await provider.reply({ system: await systemPrompt(row.kind, settings.instructions), turns, locale: row.locale as Locale });
    const message = await addMessage({ conversationId: row.id, author: "ai", body: reply.text, model: reply.model });
    return { ok: true, message };
  } catch (error) {
    if (error instanceof AiError) {
      console.error(`Assistant reply failed (${error.kind}): ${error.message}`);
      return { ok: false, reason: error.kind };
    }
    console.error("Assistant reply failed.", error);
    return { ok: false, reason: "unavailable" };
  }
}

/** For the studio's "Try it" button: one question, no conversation stored. */
export async function previewAssistant(question: string, locale: Locale): Promise<{ ok: true; text: string; model: string } | { ok: false; reason: AiFailure; detail?: string }> {
  const stored = await readStoredAssistantSettings();
  const [provider, settings] = await Promise.all([getAiProvider(stored), getChatSettings(stored)]);
  if (!provider) return { ok: false, reason: "off" };
  try {
    const reply = await provider.reply({ system: await systemPrompt("assistant", settings.instructions), turns: [{ role: "user", text: question }], locale });
    return { ok: true, text: reply.text, model: reply.model };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, reason: error.kind, detail: error.message.slice(0, 200) };
    return { ok: false, reason: "unavailable" };
  }
}
