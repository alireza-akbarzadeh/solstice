import { z } from "zod";

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "codeTooShort")
      .max(30, "codeTooLong")
      .regex(/^[A-Za-z0-9_-]+$/, "codeInvalidChars")
      .transform((val) => val.toUpperCase()),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.coerce.number().positive("valueMustBePositive"),
    duration: z.enum(["once", "repeating"]).default("once"),
    planId: z.string().nullable().optional(),
    maxUses: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
      z.number().int().positive().nullable().optional(),
    ),
    expiresAt: z.string().nullable().optional(),
    active: z.boolean().default(true),
    description: z.string().max(250).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.discountType === "percent" && data.discountValue > 100) {
        return false;
      }
      return true;
    },
    {
      message: "percentMax100",
      path: ["discountValue"],
    },
  );

export type CouponFormValues = z.input<typeof couponFormSchema>;

export const applyCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .transform((val) => val.toUpperCase()),
  planId: z.string().min(1),
  baseAmount: z.coerce.number().nonnegative(),
});

export const purchaseGiftSchema = z.object({
  months: z.number().int().refine((val) => [1, 3, 6, 12].includes(val), "invalidDuration"),
  planId: z.string().min(1, "planRequired"),
  purchaserEmail: z.string().trim().email("invalidEmail"),
  purchaserName: z.string().trim().max(100).optional().nullable(),
  recipientEmail: z
    .string()
    .trim()
    .email("invalidEmail")
    .optional()
    .or(z.literal(""))
    .nullable(),
  recipientName: z.string().trim().max(100).optional().nullable(),
  personalMessage: z.string().trim().max(500).optional().nullable(),
});

export type PurchaseGiftValues = z.infer<typeof purchaseGiftSchema>;

export const redeemGiftSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "codeRequired")
    .max(50)
    .transform((val) => val.toUpperCase()),
});

export type RedeemGiftValues = z.infer<typeof redeemGiftSchema>;
