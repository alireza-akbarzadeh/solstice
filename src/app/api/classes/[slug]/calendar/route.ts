import { notFound } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";

import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { generateIcsCalendar } from "@/modules/classes/server/calendar";
import { getLiveClassBySlug } from "@/modules/classes/server/classes";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const requestedLocale = url.searchParams.get("locale") ?? routing.defaultLocale;
  const locale: Locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  const liveClass = await getLiveClassBySlug(slug);
  if (!liveClass) notFound();

  const icsData = generateIcsCalendar(liveClass, locale);

  return new NextResponse(icsData, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${liveClass.slug}.ics"`,
      "Cache-Control": "private, no-cache, no-store",
    },
  });
}
