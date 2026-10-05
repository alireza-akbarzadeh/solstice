import { z } from "zod";

import { gatewayIds, gatewayModes, gateways } from "@/infrastructure/payment/gateways";

import { stripeCurrencies } from "./types";

/** A newly pasted key; empty keeps the stored one. Checked against the gateway's key shape. */
const credential = (pattern: RegExp) =>
  z
    .string()
    .trim()
    .max(300)
    .refine((value) => value === "" || pattern.test(value), "shape");

const [merchantId] = gateways.zarinpal.credentials;
const [secretKey, webhookSecret] = gateways.stripe.credentials;

/**
 * The payments form. At least one gateway stays on, and the gateways preselected by country
 * must be switched on. The server also checks each mode is supported and live has its keys.
 */
export const paymentSettingsSchema = z
  .object({
    zarinpal: z.object({ enabled: z.boolean(), mode: z.enum(gatewayModes) }),
    stripe: z.object({ enabled: z.boolean(), mode: z.enum(gatewayModes), currency: z.enum(stripeCurrencies) }),
    defaultGateway: z.enum(gatewayIds),
    iranGateway: z.enum(gatewayIds),
    credentials: z.object({
      zarinpal: z.object({ merchantId: credential(merchantId!.pattern) }),
      stripe: z.object({ secretKey: credential(secretKey!.pattern), webhookSecret: credential(webhookSecret!.pattern) }),
    }),
    /** Stored keys to forget, as "gateway.key". */
    clear: z.array(z.string().max(60)).max(10),
  })
  .superRefine((value, ctx) => {
    if (!value.zarinpal.enabled && !value.stripe.enabled) {
      ctx.addIssue({ code: "custom", path: ["stripe", "enabled"], message: "oneEnabled" });
    }
    for (const key of ["defaultGateway", "iranGateway"] as const) {
      if (!value[value[key]].enabled) ctx.addIssue({ code: "custom", path: [key], message: "disabled" });
    }
  });

export type PaymentSettingsInput = z.output<typeof paymentSettingsSchema>;
export type PaymentSettingsFormValues = z.input<typeof paymentSettingsSchema>;
