import { cookies, headers } from "next/headers";
import { cache } from "react";

import { paymentsTestMode } from "./settings";
import { USER_CURRENCY_COOKIE, USER_GATEWAY_COOKIE } from "../types";

/** Test mode only: pretends the visitor connects from this country (set from the test panel). */
export const TEST_COUNTRY_COOKIE = "solstice-test-country";

export { USER_CURRENCY_COOKIE, USER_GATEWAY_COOKIE };

const code = (value: string | null | undefined) => {
  const upper = value?.trim().toUpperCase();
  return upper && /^[A-Z]{2}$/.test(upper) ? upper : null;
};

/** The country the request comes from, as the host reports it (Vercel, then Cloudflare). */
export const getDetectedCountry = cache(async () => {
  const h = await headers();
  return code(h.get("x-vercel-ip-country")) ?? code(h.get("cf-ipcountry"));
});

export const getSimulatedCountry = cache(async () => {
  if (!(await paymentsTestMode())) return null;
  return code((await cookies()).get(TEST_COUNTRY_COOKIE)?.value);
});

/**
 * Where the visitor seems to be. Checks:
 * 1. Explicit user currency / gateway choice (cookie).
 * 2. Simulated country from test panel (in test mode).
 * 3. Real detected country from Geo-IP headers (Vercel / Cloudflare).
 * 4. Locale / accept-language fallback if Geo-IP is unavailable (e.g. localhost, local dev).
 */
export const getVisitorCountry = cache(async (locale?: string) => {
  const cookieStore = await cookies();

  // 1. User's chosen gateway or currency overrides geo-location
  const gatewayCookie = cookieStore.get(USER_GATEWAY_COOKIE)?.value?.toLowerCase();
  if (gatewayCookie === "zarinpal") return "IR";
  if (gatewayCookie === "stripe") return "US";

  const currencyCookie = cookieStore.get(USER_CURRENCY_COOKIE)?.value?.toUpperCase();
  if (currencyCookie === "IRT") return "IR";
  if (currencyCookie === "USD" || currencyCookie === "EUR") return "US";

  // 2. Simulated country from instructor test panel
  const simulated = await getSimulatedCountry();
  if (simulated) return simulated;

  // 3. Detected country from reverse proxy / CDN
  const detected = await getDetectedCountry();
  if (detected) return detected;

  // 4. Fallback when Geo-IP header is not present (e.g. localhost, dev server):
  // Visitors browsing the Persian locale (/fa) default to Iranian currency (IRT / Zarinpal).
  if (locale === "fa") return "IR";

  try {
    const h = await headers();
    const referer = h.get("referer");
    if (referer && (referer.includes("/fa/") || referer.endsWith("/fa"))) return "IR";
  } catch {}

  return null;
});
