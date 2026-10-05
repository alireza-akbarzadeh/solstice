import { desc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

import { routing, type Locale } from "@/i18n/routing";
import { getEmailProvider } from "@/infrastructure/email";
import type { Localized } from "@/lib/localized";
import { db } from "@/server/db";
import { newsletterIssues, newsletterSubscribers } from "@/server/db/schema";

import { oneClickUrl, unsubscribePageUrl } from "./unsubscribe";

export type NewsletterIssue = typeof newsletterIssues.$inferSelect;

export async function listIssues(limit = 10): Promise<NewsletterIssue[]> {
  try {
    return await db.select().from(newsletterIssues).orderBy(desc(newsletterIssues.createdAt)).limit(limit);
  } catch (error) {
    console.error("Newsletter issues could not be read — run `pnpm db:seed:newsletter`.", error);
    return [];
  }
}

/** A subscriber's language when that version was written, otherwise the other one. */
const pick = (text: Localized, locale: Locale) => text[locale].trim() || text[locale === "fa" ? "en" : "fa"].trim();

/**
 * Sends an issue to every subscriber, one message each (their own unsubscribe link), and
 * records how many went out. A failed address is counted and skipped, never retried here.
 */
export async function sendIssue(issue: { subject: Localized; body: Localized }) {
  const [created] = await db.insert(newsletterIssues).values({ subject: issue.subject, body: issue.body }).returning({ id: newsletterIssues.id });
  const [provider, subscribers] = await Promise.all([getEmailProvider(), db.select().from(newsletterSubscribers)]);
  const footers = Object.fromEntries(
    await Promise.all(routing.locales.map(async (l) => [l, await getTranslations({ locale: l, namespace: "Newsletter.email" })] as const)),
  );

  let recipients = 0;
  let failed = 0;
  for (const subscriber of subscribers) {
    const locale = routing.locales.find((l) => l === subscriber.locale) ?? routing.defaultLocale;
    try {
      await provider.send({
        to: subscriber.email,
        subject: pick(issue.subject, locale),
        text: `${pick(issue.body, locale)}\n\n—\n${footers[locale]!("footer", { url: unsubscribePageUrl(subscriber.email, locale) })}`,
        unsubscribeUrl: oneClickUrl(subscriber.email),
      });
      recipients++;
    } catch (error) {
      failed++;
      console.error(`Newsletter to ${subscriber.email} failed.`, error);
    }
  }
  await db.update(newsletterIssues).set({ recipients, failed, sentAt: new Date() }).where(eq(newsletterIssues.id, created!.id));
  return { recipients, failed, mailbox: provider.testMode };
}
