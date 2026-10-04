import { env } from "@/env";

import { mockPaymentProvider } from "./providers/mock";
import type { PaymentProvider } from "./types";

export type * from "./types";

// Every provider the code knows. A membership remembers the provider that manages it, so
// cancel/resume/refund always go to the right one even after the studio switches providers.
const providers: Record<string, PaymentProvider> = {
  mock: mockPaymentProvider,
};

/** The provider that manages a membership or payment; undefined for "studio" (comped) and unknown ids. */
export function providerFor(id: string | null | undefined): PaymentProvider | undefined {
  return id ? providers[id] : undefined;
}

/** The provider new checkouts use. Studio settings choose it in 13b; until then, the env default. */
export async function getCheckoutProvider(): Promise<PaymentProvider> {
  return providers[env.PAYMENT_PROVIDER] ?? mockPaymentProvider;
}
