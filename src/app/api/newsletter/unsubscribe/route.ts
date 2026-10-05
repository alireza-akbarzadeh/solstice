import { NextResponse } from "next/server";

import { unsubscribe, verifyUnsubscribe } from "@/modules/newsletter/server/unsubscribe";

// One-click unsubscribe (RFC 8058): mail clients POST here from the List-Unsubscribe header,
// without opening a page. The signed address in the link is the only proof needed.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const email = verifyUnsubscribe(url.searchParams.get("e"), url.searchParams.get("t"));
  if (!email) return new NextResponse(null, { status: 400 });
  await unsubscribe(email);
  return new NextResponse(null, { status: 200 });
}
