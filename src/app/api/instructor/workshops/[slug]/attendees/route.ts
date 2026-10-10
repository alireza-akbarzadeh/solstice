import { notFound } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/modules/memberships/server/viewer";
import { getPublishedCustomPage } from "@/modules/pages/server/library";
import {
  getWorkshopRegistrations,
  workshopAttendeesToCsv,
} from "@/modules/workshops/server/registrations";
import { localize } from "@/lib/localized";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const viewer = await getViewer();
  if (viewer.user?.role !== "instructor") {
    notFound();
  }

  const { slug } = await params;
  const page = await getPublishedCustomPage(slug);
  const rows = await getWorkshopRegistrations(slug);

  const title = page?.publishedContent
    ? localize(page.publishedContent.title, "en")
    : slug;

  const csv = workshopAttendeesToCsv(rows, title);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="workshop-attendees-${slug}-${date}.csv"`,
      "Cache-Control": "private, no-cache, no-store",
    },
  });
}
