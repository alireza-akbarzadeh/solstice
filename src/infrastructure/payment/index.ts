import { gateways, type GatewayId, type GatewayMode } from "./gateways";
import { createTestProvider, mockPaymentProvider } from "./providers/mock";
import { stripeProvider } from "./providers/stripe";
import { zarinpalProvider } from "./providers/zarinpal";
import type { PaymentProvider } from "./types";

export type * from "./types";
export * from "./gateways";
export { gatewayKeyFromEnv, loadGatewayConfig, type GatewayConfig } from "./config";
export { RefundUnsupportedError } from "./errors";

// Every provider the code knows. A membership remembers the provider that manages it, so
// cancel/resume/refund always go to the right one even after the studio switches providers.
const providers: Record<string, PaymentProvider> = {
  mock: mockPaymentProvider,
  "test-zarinpal": createTestProvider("test-zarinpal", gateways.zarinpal.recurring),
  "test-stripe": createTestProvider("test-stripe", gateways.stripe.recurring),
  zarinpal: zarinpalProvider,
  stripe: stripeProvider,
};

/** The provider that manages a membership or payment; undefined for "studio" (comped) and unknown ids. */
export function providerFor(id: string | null | undefined): PaymentProvider | undefined {
  return id ? providers[id] : undefined;
}

/**
 * Whether a gateway can run in a mode. Test mode always works; sandbox and live need the
 * gateway's own provider, which arrives with its integration (Zarinpal 13c, Stripe 13d).
 */
export function gatewaySupports(gateway: GatewayId, mode: GatewayMode) {
  return mode === "test" || !!providers[gateway];
}

/** The provider that takes new checkouts for a gateway in a mode, if that combination works. */
export function gatewayProvider(gateway: GatewayId, mode: GatewayMode): PaymentProvider | undefined {
  return mode === "test" ? providers[`test-${gateway}`] : providers[gateway];
}

/** Which gateway a provider id belongs to ("test-stripe" → stripe); undefined for the legacy mock. */
export function gatewayOf(providerId: string | null | undefined): GatewayId | undefined {
  const id = providerId?.replace(/^test-/, "");
  return id === "zarinpal" || id === "stripe" ? id : undefined;
}
