import { NextResponse } from "next/server";

import { providerFor } from "@/infrastructure/payment";
import { applyPaymentEvents } from "@/modules/memberships/server/billing";

// Providers that confirm by webhook (Stripe-style) post here. The provider verifies its own
// signature; anything unsigned or malformed is refused before it can touch a membership.
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const provider = providerFor((await params).provider);
  if (!provider?.parseWebhook) return new NextResponse(null, { status: 404 });

  const body = await request.text();
  let events;
  try {
    events = await provider.parseWebhook(body, request.headers);
  } catch {
    return NextResponse.json({ error: "invalid signature or payload" }, { status: 400 });
  }
  try {
    await applyPaymentEvents(provider.id, events);
  } catch (error) {
    // A 5xx makes the provider retry later; events already applied are skipped then.
    console.error("Payment webhook could not be applied.", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ received: events.length });
}
