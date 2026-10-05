// The payment companies the studio can switch on from /instructor/settings → Payments. Each
// runs in one of three modes: "test" goes through the in-app test checkout (no account, no
// money), "sandbox" uses the company's own test environment, "live" takes real payments.

export const gatewayIds = ["zarinpal", "stripe"] as const;
export type GatewayId = (typeof gatewayIds)[number];
export const isGatewayId = (value: unknown): value is GatewayId => gatewayIds.includes(value as GatewayId);

export const gatewayModes = ["test", "sandbox", "live"] as const;
export type GatewayMode = (typeof gatewayModes)[number];

/** A key the studio pastes in. Secret ones are stored encrypted and never shown again. */
export type GatewayCredential = {
  key: string;
  /** Environment variable that overrides the stored value. */
  env: string;
  /** Rough shape check, so a key pasted into the wrong box is caught on save. */
  pattern: RegExp;
};

export type GatewayInfo = {
  id: GatewayId;
  /** Currencies it charges in ("IRT" is the toman). The first is its default. */
  currencies: readonly string[];
  /** Renews by itself; without it members pay again each period. */
  recurring: boolean;
  /** Which cards it takes, shown to visitors when both gateways apply. */
  cards: "iranian" | "international";
  credentials: readonly GatewayCredential[];
};

export const gateways: Record<GatewayId, GatewayInfo> = {
  zarinpal: {
    id: "zarinpal",
    currencies: ["IRT"],
    recurring: false,
    cards: "iranian",
    credentials: [{ key: "merchantId", env: "ZARINPAL_MERCHANT_ID", pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i }],
  },
  stripe: {
    id: "stripe",
    currencies: ["USD", "EUR", "GBP"],
    recurring: true,
    cards: "international",
    credentials: [
      { key: "secretKey", env: "STRIPE_SECRET_KEY", pattern: /^(sk|rk)_(test|live)_[0-9A-Za-z]{10,}$/ },
      { key: "webhookSecret", env: "STRIPE_WEBHOOK_SECRET", pattern: /^whsec_[0-9A-Za-z]{10,}$/ },
    ],
  },
};
