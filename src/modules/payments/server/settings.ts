import { eq } from "drizzle-orm";
import { cache } from "react";

import { gatewayIds, gatewayKeyFromEnv, gatewayModes, gateways, gatewaySupports, type GatewayId } from "@/infrastructure/payment";
import { seal } from "@/lib/secret-box";
import { db } from "@/server/db";
import { settings as settingsTable } from "@/server/db/schema";

import type { PaymentSettingsInput } from "../schemas";
import { defaultPaymentSettings, stripeCurrencies, type PaymentSettings, type PaymentSettingsView } from "../types";

const KEY = "payments";

/** A key as stored: sealed with lib/secret-box, plus its last four characters for display. */
type StoredSecret = { sealed: string; last4: string };
type Stored = PaymentSettings & { secrets: Partial<Record<GatewayId, Record<string, StoredSecret>>> };

const oneOf = <T extends string>(list: readonly T[], value: unknown, fallback: T): T =>
  list.includes(value as T) ? (value as T) : fallback;

/** Reads the stored row defensively: anything missing or malformed falls back to the defaults. */
function normalize(raw: Record<string, unknown> | undefined): Stored {
  const d = defaultPaymentSettings;
  const zp = (raw?.zarinpal ?? {}) as Record<string, unknown>;
  const st = (raw?.stripe ?? {}) as Record<string, unknown>;
  const value: Stored = {
    zarinpal: { enabled: typeof zp.enabled === "boolean" ? zp.enabled : d.zarinpal.enabled, mode: oneOf(gatewayModes, zp.mode, "test") },
    stripe: {
      enabled: typeof st.enabled === "boolean" ? st.enabled : d.stripe.enabled,
      mode: oneOf(gatewayModes, st.mode, "test"),
      currency: oneOf(stripeCurrencies, st.currency, d.stripe.currency),
    },
    defaultGateway: oneOf(gatewayIds, raw?.defaultGateway, d.defaultGateway),
    iranGateway: oneOf(gatewayIds, raw?.iranGateway, d.iranGateway),
    // Only ever written by savePaymentSettings, which stores { gateway: { key: StoredSecret } }.
    secrets: raw?.secrets && typeof raw.secrets === "object" ? raw.secrets : {},
  };
  // A mode the code can't run (say, live before the integration exists) falls back to test.
  for (const id of gatewayIds) if (!gatewaySupports(id, value[id].mode)) value[id].mode = "test";
  // Never leave the site without a way to pay, nor preselect a gateway that is off.
  if (!value.zarinpal.enabled && !value.stripe.enabled) value.stripe.enabled = true;
  const firstOn = gatewayIds.find((id) => value[id].enabled)!;
  if (!value[value.defaultGateway].enabled) value.defaultGateway = firstOn;
  if (!value[value.iranGateway].enabled) value.iranGateway = firstOn;
  return value;
}

const getStored = cache(async (): Promise<Stored> => {
  try {
    const [row] = await db.select({ value: settingsTable.value }).from(settingsTable).where(eq(settingsTable.key, KEY)).limit(1);
    return normalize(row?.value);
  } catch {
    return normalize(undefined);
  }
});

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const { zarinpal, stripe, defaultGateway, iranGateway } = await getStored();
  return { zarinpal, stripe, defaultGateway, iranGateway };
}

/** Test mode (the floating test panel, the test checkout, mocked revenue) lasts until a gateway is live. */
export async function paymentsTestMode() {
  const settings = await getPaymentSettings();
  return !gatewayIds.some((id) => settings[id].enabled && settings[id].mode === "live");
}

const envValue = gatewayKeyFromEnv;

/** What the studio's settings page shows: the settings, and each key as "set (…1234)" or not. */
export async function getPaymentSettingsView(): Promise<PaymentSettingsView> {
  const stored = await getStored();
  const { secrets, ...settings } = stored;
  const credentials = Object.fromEntries(
    gatewayIds.map((id) => [
      id,
      Object.fromEntries(
        gateways[id].credentials.map(({ key, env: name }) => {
          const fromEnv = envValue(name);
          return [key, { fromEnv: !!fromEnv, last4: fromEnv ? fromEnv.slice(-4) : (secrets[id]?.[key]?.last4 ?? null) }];
        }),
      ),
    ]),
  ) as PaymentSettingsView["credentials"];
  const supported = Object.fromEntries(gatewayIds.map((id) => [id, gatewayModes.filter((mode) => gatewaySupports(id, mode))])) as PaymentSettingsView["supported"];
  return { settings, credentials, supported };
}

export type SaveResult = { ok: true } | { ok: false; error: "unsupported" | "missingKeys" };

export async function savePaymentSettings(input: PaymentSettingsInput): Promise<SaveResult> {
  const current = await getStored();
  const secrets: Stored["secrets"] = structuredClone(current.secrets);

  for (const id of gatewayIds) {
    const typed = input.credentials[id] as Record<string, string>;
    const kept = { ...secrets[id] };
    for (const { key } of gateways[id].credentials) {
      if (input.clear.includes(`${id}.${key}`)) delete kept[key];
      const value = typed[key]?.trim();
      if (value) kept[key] = { sealed: seal(value), last4: value.slice(-4) };
    }
    secrets[id] = kept;
  }

  for (const id of gatewayIds) {
    const { enabled, mode } = input[id];
    if (!enabled) continue;
    if (!gatewaySupports(id, mode)) return { ok: false, error: "unsupported" };
    // Sandbox and live talk to the gateway, so every key must be there (stored or from the server).
    if (mode !== "test" && gateways[id].credentials.some(({ key, env: name }) => !envValue(name) && !secrets[id]?.[key])) {
      return { ok: false, error: "missingKeys" };
    }
  }

  const value: Stored = {
    zarinpal: input.zarinpal,
    stripe: input.stripe,
    defaultGateway: input.defaultGateway,
    iranGateway: input.iranGateway,
    secrets,
  };
  await db
    .insert(settingsTable)
    .values({ key: KEY, value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
  return { ok: true };
}
