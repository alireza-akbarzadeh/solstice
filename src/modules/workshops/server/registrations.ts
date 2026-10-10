import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { eventRegistrations } from "@/server/db/schema";
import { getPublishedCustomPage } from "@/modules/pages/server/library";
import { sendEmail } from "@/infrastructure/email";
import { localize } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import { env } from "@/env";
import type {
  WorkshopAttendeeStats,
  WorkshopRegistration,
  WorkshopRegistrationInput,
  WorkshopRegistrationStatus,
} from "../types";

export async function getWorkshopRegistrations(
  pageSlug: string,
): Promise<WorkshopRegistration[]> {
  const rows = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.pageSlug, pageSlug))
    .orderBy(desc(eventRegistrations.createdAt));

  return rows.map((r) => ({
    id: r.id,
    pageSlug: r.pageSlug,
    userId: r.userId,
    name: r.name,
    email: r.email,
    phone: r.phone,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getWorkshopAttendeeStats(
  pageSlug: string,
  capacity?: number | null,
): Promise<WorkshopAttendeeStats> {
  const counts = await db
    .select({
      status: eventRegistrations.status,
      count: sql<number>`count(*)::int`,
    })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.pageSlug, pageSlug))
    .groupBy(eventRegistrations.status);

  let registered = 0;
  let confirmed = 0;
  let waitlist = 0;
  let canceled = 0;

  for (const row of counts) {
    if (row.status === "registered") registered = row.count;
    else if (row.status === "confirmed") confirmed = row.count;
    else if (row.status === "waitlist") waitlist = row.count;
    else if (row.status === "canceled") canceled = row.count;
  }

  const active = registered + confirmed;
  const total = active + waitlist + canceled;
  const cap = capacity && capacity > 0 ? capacity : null;
  const spotsRemaining = cap ? Math.max(0, cap - active) : null;
  const isFull = cap !== null && active >= cap;

  return {
    total,
    registered,
    confirmed,
    waitlist,
    canceled,
    capacity: cap,
    spotsRemaining,
    isFull,
  };
}

export type RegisterResult =
  | { ok: true; status: WorkshopRegistrationStatus; alreadyRegistered?: boolean }
  | { ok: false; error: "closed" | "notFound" | "failed" };

export async function registerForWorkshop(
  input: WorkshopRegistrationInput,
  locale: Locale,
  userId?: string,
): Promise<RegisterResult> {
  const page = await getPublishedCustomPage(input.pageSlug);
  if (!page?.publishedContent) {
    return { ok: false, error: "notFound" };
  }

  const content = page.publishedContent;
  const event = content.event;
  if (!event || !event.enabled || !event.registrationOpen) {
    return { ok: false, error: "closed" };
  }

  // Check if this email is already registered on this workshop
  const existing = await db
    .select()
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.pageSlug, input.pageSlug),
        eq(eventRegistrations.email, input.email.toLowerCase().trim()),
      ),
    )
    .limit(1);

  if (existing[0]) {
    return {
      ok: true,
      status: existing[0].status,
      alreadyRegistered: true,
    };
  }

  // Determine whether they are registered or placed on waitlist
  const stats = await getWorkshopAttendeeStats(input.pageSlug, event.capacity);
  const status: WorkshopRegistrationStatus = stats.isFull
    ? "waitlist"
    : "registered";

  const inserted = await db
    .insert(eventRegistrations)
    .values({
      pageSlug: input.pageSlug,
      userId: userId || null,
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      phone: input.phone.trim(),
      status,
      notes: input.notes?.trim() || null,
    })
    .returning();

  if (!inserted[0]) {
    return { ok: false, error: "failed" };
  }

  // Send email confirmation
  try {
    const title = localize(content.title, locale);
    const location = localize(event.location, locale);
    const isFa = locale === "fa";
    const calendarUrl = `${env.BETTER_AUTH_URL}/api/workshops/${input.pageSlug}/calendar?locale=${locale}`;

    if (status === "registered") {
      const subject = isFa
        ? `[استودیو یوگای آرته] تأیید رزرو: ${title}`
        : `[Arte Yoga Studio] Space Reserved: ${title}`;

      const paymentText = event.paymentInstructions
        ? localize(event.paymentInstructions, locale)
        : "";

      const text = isFa
        ? `درود ${input.name} گرامی،\n\nجایگاه شما برای شرکت در "${title}" با موفقیت رزرو شد.\n\nزمان: ${event.startDate}\nمکان: ${location}\nراهنمای پرداخت: ${paymentText || "پرداخت مستقیم / حضوری"}\n\nدانلود رویداد تقویم:\n${calendarUrl}\n\nبا آرامش و مهر،\nاستودیو یوگای آرته`
        : `Dear ${input.name},\n\nYour space has been reserved for "${title}".\n\nDate: ${event.startDate}\nLocation: ${location}\nPayment Guidance: ${paymentText || "Direct / On-site"}\n\nAdd to your calendar:\n${calendarUrl}\n\nWith warmth,\nArte Yoga Studio`;

      await sendEmail({
        to: input.email.trim(),
        subject,
        text,
        actionUrl: calendarUrl,
      });
    } else {
      const subject = isFa
        ? `[استودیو یوگای آرته] ثبت در فهرست انتظار: ${title}`
        : `[Arte Yoga Studio] Waitlist Confirmation: ${title}`;

      const text = isFa
        ? `درود ${input.name} گرامی،\n\nنام شما در فهرست انتظار "${title}" ثبت شد.\nبه محض باز شدن ظرفیت، فوراً با شما تماس خواهیم گرفت.\n\nبا مهر،\nاستودیو یوگای آرته`
        : `Dear ${input.name},\n\nYou have been placed on the waitlist for "${title}".\nWe will notify you immediately if a spot opens up.\n\nWith warmth,\nArte Yoga Studio`;

      await sendEmail({
        to: input.email.trim(),
        subject,
        text,
      });
    }
  } catch (err) {
    console.error("Failed to send workshop confirmation email:", err);
  }

  return { ok: true, status };
}

export async function updateRegistrationStatus(
  id: number,
  status: WorkshopRegistrationStatus,
): Promise<boolean> {
  const result = await db
    .update(eventRegistrations)
    .set({ status, updatedAt: new Date() })
    .where(eq(eventRegistrations.id, id))
    .returning({ id: eventRegistrations.id });

  return result.length > 0;
}

export async function removeRegistration(id: number): Promise<boolean> {
  const result = await db
    .delete(eventRegistrations)
    .where(eq(eventRegistrations.id, id))
    .returning({ id: eventRegistrations.id });

  return result.length > 0;
}

export { workshopAttendeesToCsv } from "../csv";
