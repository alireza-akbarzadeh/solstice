import { cookies, headers } from "next/headers";
import { cache } from "react";

import { paymentsTestMode } from "./settings";

/** Test mode only: pretends the visitor connects from this country (set from the test panel). */
export const TEST_COUNTRY_COOKIE = "solstice-test-country";

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
 * Where the visitor seems to be. It only preselects a payment method: VPNs are common in Iran,
 * and Iranians abroad hold Iranian cards, so the checkout still lets them pick.
 */
export const getVisitorCountry = cache(async () => (await getSimulatedCountry()) ?? (await getDetectedCountry()));
