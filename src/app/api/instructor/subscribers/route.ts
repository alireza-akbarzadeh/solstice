import { NextResponse } from "next/server";

import { listSubscribers, subscribersToCsv } from "@/modules/newsletter/server/subscribers";
import { getSession } from "@/server/better-auth/server";

// The studio's "Export CSV" link. A download needs a real HTTP response, so this is a route
// handler rather than a server action; it answers 404 to anyone but the instructor.
export async function GET() {
  const session = await getSession();
  if (session?.user.role !== "instructor") return new NextResponse(null, { status: 404 });

  const csv = subscribersToCsv(await listSubscribers());
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
