import { NextResponse } from "next/server";

import { env } from "@/env";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { providerFor } from "@/infrastructure/payment";
import { applyPaymentEvents, getCheckout } from "@/modules/memberships/server/billing";

// The member comes back from the provider's page here. Providers that confirm on return
// (Zarinpal-style) verify the payment server to server before anything is granted; for the
// others the webhook does that, and the welcome page waits for it.
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const provider = providerFor((await params).provider);
  const url = new URL(request.url);
  const checkout = await getCheckout(url.searchParams.get("checkout") ?? "");
  if (!provider || checkout?.provider !== provider.id) return new NextResponse(null, { status: 404 });

  const locale: Locale = (routing.locales as readonly string[]).includes(checkout.locale) ? (checkout.locale as Locale) : routing.defaultLocale;
  if (provider.confirmReturn && checkout.status === "open") {
    try {
      const events = await provider.confirmReturn(
        { id: checkout.id, amount: checkout.amount, currency: checkout.currency, providerReference: checkout.providerReference },
        url.searchParams,
      );
      await applyPaymentEvents(provider.id, events);
    } catch (error) {
      console.error("Payment could not be confirmed on return.", error);
    }
  }
  const welcome = getPathname({ href: { pathname: "/membership/welcome", query: { checkout: checkout.id } }, locale });
  return NextResponse.redirect(new URL(welcome, env.BETTER_AUTH_URL), { status: 303 });
}
