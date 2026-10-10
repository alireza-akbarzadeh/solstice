import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

import { env } from "@/env";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { sendEmail } from "@/infrastructure/email";
import { notifyUser } from "@/modules/notifications/server/send";
import { db } from "@/server/db";
import {
  checkouts,
  memberships,
  practiceCompletions,
  practiceReminders,
  pushSubscriptions,
  user,
} from "@/server/db/schema";

const DAY = 24 * 60 * 60 * 1000;
export const NUDGE_COOLDOWN_DAYS = 7;

export type QuietMember = {
  id: string;
  name: string;
  email: string;
  status: "active" | "trialing";
  trialEndsAt: Date | null;
  joinedAt: Date;
  lastPracticeAt: Date | null;
  daysInactive: number;
  lastReminderAt: Date | null;
  canRemind: boolean;
};

/**
 * Identify members who have not practiced in at least 7 days (or joined 7+ days ago with no practice),
 * coupled with their historical reminder timestamps to prevent over-contacting.
 */
export async function getQuietMembersForReminders(
  now = new Date(),
  minDaysInactive = 7,
): Promise<QuietMember[]> {
  const staleBefore = new Date(now.getTime() - minDaysInactive * DAY);
  const lastPractice = sql<Date | null>`(select max(${practiceCompletions.completedAt}) from ${practiceCompletions} where ${practiceCompletions.userId} = ${user.id})`;
  const lastReminder = sql<Date | null>`(select max(${practiceReminders.sentAt}) from ${practiceReminders} where ${practiceReminders.userId} = ${user.id})`;

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      status: memberships.status,
      trialEndsAt: memberships.trialEndsAt,
      joinedAt: memberships.createdAt,
      lastPracticeAt: lastPractice,
      lastReminderAt: lastReminder,
    })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .where(
      and(
        eq(user.role, "member"),
        inArray(memberships.status, ["trialing", "active"]),
        sql`${memberships.currentPeriodEnd} >= ${now.toISOString()}::timestamptz`,
        sql`coalesce(${lastPractice}, ${memberships.createdAt}) < ${staleBefore.toISOString()}::timestamptz`,
      ),
    )
    .orderBy(
      sql`case when ${memberships.status} = 'trialing' then 0 else 1 end`,
      sql`coalesce(${lastPractice}, ${memberships.createdAt}) asc`,
    )
    .limit(100);

  return rows.map((r) => {
    const referenceDate = r.lastPracticeAt ?? r.joinedAt;
    const daysInactive = Math.max(
      0,
      Math.floor((now.getTime() - referenceDate.getTime()) / DAY),
    );
    const lastRemDate = r.lastReminderAt ? new Date(r.lastReminderAt) : null;
    const canRemind =
      !lastRemDate ||
      now.getTime() - lastRemDate.getTime() >= NUDGE_COOLDOWN_DAYS * DAY;

    return {
      id: r.id,
      name: r.name,
      email: r.email,
      status: r.status as "active" | "trialing",
      trialEndsAt: r.trialEndsAt ? new Date(r.trialEndsAt) : null,
      joinedAt: new Date(r.joinedAt),
      lastPracticeAt: r.lastPracticeAt ? new Date(r.lastPracticeAt) : null,
      daysInactive,
      lastReminderAt: lastRemDate,
      canRemind,
    };
  });
}

/** Determines best locale for the member based on checkout and push subscription logs. */
export async function getMemberLocale(userId: string): Promise<Locale> {
  const [checkout] = await db
    .select({ locale: checkouts.locale })
    .from(checkouts)
    .where(eq(checkouts.userId, userId))
    .orderBy(desc(checkouts.createdAt))
    .limit(1);

  if (checkout?.locale && routing.locales.includes(checkout.locale as Locale)) {
    return checkout.locale as Locale;
  }

  const [push] = await db
    .select({ locale: pushSubscriptions.locale })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .orderBy(desc(pushSubscriptions.createdAt))
    .limit(1);

  if (push?.locale && routing.locales.includes(push.locale as Locale)) {
    return push.locale as Locale;
  }

  return routing.defaultLocale;
}

export type NudgeResult =
  | { ok: true; channel: "email" | "push" | "both" }
  | { ok: false; error: "notFound" | "cooldown" | "failed" };

/**
 * Delivers a peaceful, mindful nudge via email and web push notification,
 * then persists the reminder timestamp.
 */
export async function sendGentlePracticeNudge({
  userId,
  type,
  customMessage,
  force = false,
}: {
  userId: string;
  type: "inactivity_7d" | "inactivity_14d" | "manual_checkin";
  customMessage?: string;
  force?: boolean;
}): Promise<NudgeResult> {
  const [member] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!member) {
    return { ok: false, error: "notFound" };
  }

  const now = new Date();

  // Guard cooldown unless forced by instructor manual action
  if (!force) {
    const [latest] = await db
      .select({ sentAt: practiceReminders.sentAt })
      .from(practiceReminders)
      .where(eq(practiceReminders.userId, userId))
      .orderBy(desc(practiceReminders.sentAt))
      .limit(1);

    if (
      latest &&
      now.getTime() - new Date(latest.sentAt).getTime() <
        NUDGE_COOLDOWN_DAYS * DAY
    ) {
      return { ok: false, error: "cooldown" };
    }
  }

  const locale = await getMemberLocale(userId);
  const t = await getTranslations({ locale, namespace: "Reminders" });
  const dashboardPath = getPathname({ href: "/dashboard", locale });
  const targetUrl = new URL(dashboardPath, env.BETTER_AUTH_URL).toString();

  const name = member.name || (locale === "fa" ? "همراه گرامی" : "Friend");
  const subject = t("emailSubject");
  const bodyText = customMessage
    ? `${customMessage}\n\n${targetUrl}`
    : t("emailBody", { name, url: targetUrl });

  // 1. Send gentle email
  let emailSent = false;
  try {
    await sendEmail({
      to: member.email,
      subject,
      text: bodyText,
      actionUrl: targetUrl,
    });
    emailSent = true;
  } catch (err) {
    console.error(`[Reminders] Failed to send email to ${member.email}:`, err);
  }

  // 2. Deliver Web Push if subscribed
  let pushSent = false;
  try {
    const pushResult = await notifyUser(userId, {
      en: {
        title: "Your mat is waiting for you",
        body: customMessage || "Take a gentle moment today to breathe and reconnect.",
        url: targetUrl,
      },
      fa: {
        title: "تشک شما در انتظار شماست",
        body: customMessage || "امروز لحظه‌ای کوتاه برای آرامش و تمرین خود اختصاص دهید.",
        url: targetUrl,
      },
    });
    if (pushResult.sent > 0) pushSent = true;
  } catch (err) {
    console.warn(`[Reminders] Push delivery failed for ${userId}:`, err);
  }

  const channel: "email" | "push" | "both" =
    emailSent && pushSent ? "both" : pushSent ? "push" : "email";

  // 3. Record reminder row in DB
  await db.insert(practiceReminders).values({
    userId,
    type,
    channel,
    sentAt: now,
    notes: customMessage ? `Custom note: ${customMessage.slice(0, 200)}` : null,
  });

  return { ok: true, channel };
}

/**
 * Automated cron runner called by /api/cron/practice-reminders.
 */
export async function runPracticeRemindersCron(now = new Date()): Promise<{
  checked: number;
  nudged: number;
  skipped: number;
}> {
  const quietMembers = await getQuietMembersForReminders(now, 7);
  let nudged = 0;
  let skipped = 0;

  for (const m of quietMembers) {
    if (!m.canRemind) {
      skipped++;
      continue;
    }

    const type = m.daysInactive >= 14 ? "inactivity_14d" : "inactivity_7d";
    const res = await sendGentlePracticeNudge({
      userId: m.id,
      type,
      force: false,
    });

    if (res.ok) {
      nudged++;
    } else {
      skipped++;
    }
  }

  return { checked: quietMembers.length, nudged, skipped };
}
