import { and, desc, eq, gt, inArray, isNull, lte, ne, or, sql } from "drizzle-orm";
import { getFormatter, getTranslations } from "next-intl/server";

import { env } from "@/env";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { sendEmail } from "@/infrastructure/email";
import { db } from "@/server/db";
import { checkouts, memberships, user } from "@/server/db/schema";

import { renewsByHand } from "./memberships";

const DAY = 24 * 60 * 60 * 1000;
/** Members are reminded this many days before a period they have to renew by hand ends. */
export const REMINDER_DAYS = 3;

/**
 * Emails every member whose manually renewed membership (Zarinpal) ends within REMINDER_DAYS,
 * once per period: `renewalReminderFor` remembers which period end was announced, and a
 * renewal clears it. Run daily (vercel.json → /api/cron/renewal-reminders).
 */
export async function sendRenewalReminders(now = new Date()) {
  const due = await db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      provider: memberships.provider,
      status: memberships.status,
      currentPeriodEnd: memberships.currentPeriodEnd,
      email: user.email,
      name: user.name,
    })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .where(
      and(
        inArray(memberships.status, ["active", "trialing"]),
        gt(memberships.currentPeriodEnd, now),
        lte(memberships.currentPeriodEnd, new Date(now.getTime() + REMINDER_DAYS * DAY)),
        or(isNull(memberships.renewalReminderFor), ne(memberships.renewalReminderFor, memberships.currentPeriodEnd)),
      ),
    );

  let sent = 0;
  for (const row of due) {
    if (!renewsByHand(row)) continue;
    const locale = await lastLocale(row.userId);
    const [t, format] = await Promise.all([getTranslations({ locale, namespace: "Email.renewal" }), getFormatter({ locale })]);
    const url = new URL(getPathname({ href: "/profile", locale }), env.BETTER_AUTH_URL).toString();
    const date = format.dateTime(row.currentPeriodEnd, { dateStyle: "long" });
    const kind = row.status === "trialing" ? "trial" : "period";
    await sendEmail({
      to: row.email,
      subject: t(`${kind}.subject`, { date }),
      text: t(`${kind}.body`, { name: row.name, date, url }),
      actionUrl: url,
    });
    // Copied in SQL rather than from JS: a Date drops the microseconds Postgres keeps, and the
    // "already reminded" comparison above must match exactly.
    await db.update(memberships).set({ renewalReminderFor: sql`${memberships.currentPeriodEnd}` }).where(eq(memberships.id, row.id));
    sent++;
  }
  return { checked: due.length, sent };
}

/** The language the member last checked out in, so the reminder speaks it. */
async function lastLocale(userId: string): Promise<Locale> {
  const [row] = await db.select({ locale: checkouts.locale }).from(checkouts).where(eq(checkouts.userId, userId)).orderBy(desc(checkouts.createdAt)).limit(1);
  return routing.locales.find((l) => l === row?.locale) ?? routing.defaultLocale;
}
