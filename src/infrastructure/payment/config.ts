import { eq } from "drizzle-orm";

import { env } from "@/env";
import { open } from "@/lib/secret-box";
import { db } from "@/server/db";
import { settings } from "@/server/db/schema";

import { gatewayModes, gateways, type GatewayId, type GatewayMode } from "./gateways";

// What a gateway's provider needs at call time: the mode the studio chose and its keys. Read
// from the "payments" settings row (written by modules/payments), keys decrypted here and
// overridden by environment variables, so providers never depend on the studio module.

export type GatewayConfig = { mode: GatewayMode; credentials: Record<string, string | undefined> };

/** The environment variables that may hold gateway keys (gateways.ts names them). */
const keyVariables: Record<string, string | undefined> = {
  ZARINPAL_MERCHANT_ID: env.ZARINPAL_MERCHANT_ID,
  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
};
export const gatewayKeyFromEnv = (name: string) => keyVariables[name];

type StoredRow = Partial<Record<GatewayId, { mode?: unknown }>> & {
  secrets?: Partial<Record<GatewayId, Record<string, { sealed?: string }>>>;
};

export async function loadGatewayConfig(id: GatewayId): Promise<GatewayConfig> {
  let row: StoredRow = {};
  try {
    const [found] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "payments")).limit(1);
    row = found?.value ?? {};
  } catch {
    // No settings table yet: defaults below.
  }
  const mode = gatewayModes.find((m) => m === row[id]?.mode) ?? "test";
  const credentials = Object.fromEntries(
    gateways[id].credentials.map(({ key, env: name }) => {
      const fromEnv = gatewayKeyFromEnv(name);
      const sealed = row.secrets?.[id]?.[key]?.sealed;
      return [key, fromEnv ?? (sealed ? (open(sealed) ?? undefined) : undefined)];
    }),
  );
  return { mode, credentials };
}
