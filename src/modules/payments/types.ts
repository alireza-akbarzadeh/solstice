import type { GatewayId, GatewayMode } from "@/infrastructure/payment/gateways";

// How the studio takes payments, edited at /instructor/settings → Payments and stored as the
// "payments" row of solstice_setting. Keys live beside it, encrypted (server/settings.ts).

export const stripeCurrencies = ["USD", "EUR", "GBP"] as const;
export type StripeCurrency = (typeof stripeCurrencies)[number];

export type PaymentSettings = {
  zarinpal: { enabled: boolean; mode: GatewayMode };
  stripe: { enabled: boolean; mode: GatewayMode; currency: StripeCurrency };
  /** Preselected for visitors from anywhere but Iran. */
  defaultGateway: GatewayId;
  /** Preselected for visitors whose connection comes from Iran. */
  iranGateway: GatewayId;
};

/**
 * Out of the box both gateways run in test mode: Iranian visitors get Zarinpal, everyone else
 * Stripe. A gateway is only offered for plans priced in its currency, so a studio that prices
 * in dollars alone sees Stripe alone until it adds toman prices.
 */
export const defaultPaymentSettings: PaymentSettings = {
  zarinpal: { enabled: true, mode: "test" },
  stripe: { enabled: true, mode: "test", currency: "USD" },
  defaultGateway: "stripe",
  iranGateway: "zarinpal",
};

/** What the studio sees of a stored key: never the key itself. */
export type CredentialStatus = {
  /** Last four characters, for recognising which key is in use. */
  last4: string | null;
  /** Set by an environment variable, which wins over (and can't be edited from) the studio. */
  fromEnv: boolean;
};

export type PaymentSettingsView = {
  settings: PaymentSettings;
  credentials: Record<GatewayId, Record<string, CredentialStatus>>;
  /** Modes each gateway can run in today (test always; sandbox/live once integrated). */
  supported: Record<GatewayId, GatewayMode[]>;
};

/** ISO country code for Iran, as Vercel's x-vercel-ip-country reports it. */
export const IRAN = "IR";

/** User's explicit choice of currency (IRT vs USD/EUR) saved from the currency switcher. */
export const USER_CURRENCY_COOKIE = "solstice-currency";

/** User's explicit choice of gateway (zarinpal vs stripe) saved from the payment switcher. */
export const USER_GATEWAY_COOKIE = "solstice-gateway";

