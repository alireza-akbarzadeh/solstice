import { notFound } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import { hasLocale } from "next-intl";

import { routing, type Locale } from "@/i18n/routing";
import { getPublishedCustomPage } from "@/modules/pages/server/library";
import { generateWorkshopIcs } from "@/modules/workshops/server/calendar";

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

  const page = await getPublishedCustomPage(slug);
  if (!page?.publishedContent?.event?.enabled) {
    notFound();
  }

  const icsData = generateWorkshopIcs(slug, page.publishedContent, locale);
  if (!icsData) {
    notFound();
  }

  return new NextResponse(icsData, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-workshop.ics"`,
      "Cache-Control": "private, no-cache, no-store",
    },
  });
}
