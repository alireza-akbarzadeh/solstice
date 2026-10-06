import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import type { LiveClass } from "../types";

function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateIcsCalendar(liveClass: LiveClass, locale: Locale): string {
  const start = new Date(liveClass.scheduledAt);
  const end = new Date(start.getTime() + liveClass.durationMinutes * 60 * 1000);

  const title = escapeIcsText(localize(liveClass.title, locale));
  const description = escapeIcsText(
    `${localize(liveClass.description, locale)}\n\nTeacher: ${localize(liveClass.instructorName, locale)}\nLocation: ${localize(liveClass.locationName, locale)}\nJoin Link: ${liveClass.joinUrl}`,
  );
  const location = escapeIcsText(localize(liveClass.locationName, locale));
  const uid = `${liveClass.slug}-${start.getTime()}@arteyogastudio.com`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Arte Yoga Studio//Live Sanctuary Gathering//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `URL:${liveClass.joinUrl}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
