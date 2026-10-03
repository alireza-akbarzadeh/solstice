import { count, desc, eq, ilike } from "drizzle-orm";

import { db } from "@/server/db";
import { newsletterSubscribers } from "@/server/db/schema";

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

const matching = (q: string | undefined) =>
  q ? ilike(newsletterSubscribers.email, `%${q.replace(/[\\%_]/g, "\\$&")}%`) : undefined;

/** Newest first; the studio list is capped, the CSV export is not. */
export async function listSubscribers({ q, limit }: { q?: string; limit?: number } = {}) {
  const query = db
    .select()
    .from(newsletterSubscribers)
    .where(matching(q))
    .orderBy(desc(newsletterSubscribers.createdAt));
  return limit ? query.limit(limit) : query;
}

export async function getSubscriberStats() {
  const rows = await db
    .select({ locale: newsletterSubscribers.locale, total: count() })
    .from(newsletterSubscribers)
    .groupBy(newsletterSubscribers.locale);
  const byLocale = Object.fromEntries(rows.map((row) => [row.locale, row.total]));
  return {
    total: rows.reduce((sum, row) => sum + row.total, 0),
    en: byLocale.en ?? 0,
    fa: byLocale.fa ?? 0,
  };
}

export async function deleteSubscriber(id: number) {
  const removed = await db
    .delete(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, id))
    .returning({ id: newsletterSubscribers.id });
  return removed.length > 0;
}

/** RFC 4180 CSV with a BOM so Excel opens Persian text and dates correctly. */
export function subscribersToCsv(rows: NewsletterSubscriber[]) {
  const cell = (value: string) => {
    // Guard against spreadsheet formula injection from a hostile address.
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
  };
  const lines = [
    ["email", "language", "source", "subscribed_at"],
    ...rows.map((row) => [row.email, row.locale, row.source, row.createdAt.toISOString()]),
  ];
  return `﻿${lines.map((line) => line.map(cell).join(",")).join("\r\n")}\r\n`;
}
