import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import type { PageContent } from "@/modules/pages/types";

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

export function generateWorkshopIcs(
  slug: string,
  content: PageContent,
  locale: Locale,
): string {
  const event = content.event;
  if (!event || !event.enabled || !event.startDate) return "";

  const start = new Date(event.startDate);
  const end = event.endDate
    ? new Date(event.endDate)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours default

  const title = escapeIcsText(localize(content.title, locale));
  const location = escapeIcsText(localize(event.location, locale));
  const description = escapeIcsText(
    `${localize(content.description, locale)}\n\nLocation: ${location}\nPrice: ${localize(event.priceLabel, locale)}`,
  );
  const uid = `workshop-${slug}-${start.getTime()}@arteyogastudio.com`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Arte Yoga Studio//Workshop Gathering//EN",
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
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
