import { z } from "zod";

import { billingIntervals, currencies } from "./plans";

const localized = (max: number) =>
  z.object({ en: z.string().trim().max(max), fa: z.string().trim().max(max) });
const required = (max: number) =>
  z.object({
    en: z.string().trim().min(1).max(max),
    fa: z.string().trim().min(1).max(max),
  });

const price = z.number().finite().min(0).max(1_000_000_000).multipleOf(0.01);
const trialDays = z.number().int().min(0).max(90);
const guidancePlaces = z.number().int().min(0).max(10_000);

const planFieldsObject = z.object({
  status: z.enum(["active", "hidden"]),
  featured: z.boolean(),
  name: required(80),
  description: localized(400),
  badge: localized(40),
  features: z.array(required(160)).max(12),
  price,
  /** Prices in other currencies; the site currency's is `price`. Absent = not sold in it. */
  prices: z.partialRecord(z.enum(currencies), price),
  intervalMonths: z
    .number()
    .int()
    .refine((n) => (billingIntervals as readonly number[]).includes(n)),
  trialDays,
  guidance: z.boolean(),
  guidancePlaces,
});

/** A hidden plan can't be the recommended one. */
const hiddenIsNotFeatured = <T extends { status: string; featured: boolean }>(
  fields: T,
) => (fields.status === "hidden" ? { ...fields, featured: false } : fields);

/** What the server accepts for a plan; the studio's actions validate with this. */
export const planFieldsSchema = planFieldsObject.transform(hiddenIsNotFeatured);
export type PlanFields = z.output<typeof planFieldsSchema>;

/** A new plan in the studio editor: monthly, no trial, on sale. */
export const blankPlanFields = (): PlanFields => ({
  status: "active",
  featured: false,
  name: { en: "", fa: "" },
  description: { en: "", fa: "" },
  badge: { en: "", fa: "" },
  features: [],
  price: 0,
  prices: {},
  intervalMonths: 1,
  trialDays: 0,
  guidance: false,
  guidancePlaces: 0,
});

// Persian keyboards type ۰–۹ and "٫" for the decimal point; the studio accepts either.
const toLatin = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace("٫", ".")
    .replace(/[,\s٬]/g, "");
const numberText = <T extends z.ZodType<number, number>>(schema: T) =>
  z
    .string()
    .trim()
    .min(1)
    .transform((value) => Number(toLatin(value)))
    .pipe(schema);

/** Other-currency prices as typed: a blank box means the plan isn't sold in that currency. */
const optionalPrices = z
  .partialRecord(z.enum(currencies), z.string().trim())
  .transform((typed, ctx) => {
    const prices: Partial<Record<(typeof currencies)[number], number>> = {};
    for (const [code, value] of Object.entries(typed) as [(typeof currencies)[number], string][]) {
      if (!value) continue;
      const parsed = price.safeParse(Number(toLatin(value)));
      if (parsed.success) prices[code] = parsed.data;
      else ctx.addIssue({ code: "custom", path: [code], message: "price" });
    }
    return prices;
  });

/**
 * The studio editor's form: the same rules, but price and trial are typed as text so a
 * half-typed "24." doesn't jump, and are parsed to numbers on submit.
 */
export const planFormSchema = planFieldsObject
  .extend({
    price: numberText(price),
    prices: optionalPrices,
    trialDays: numberText(trialDays),
    guidancePlaces: numberText(guidancePlaces),
  })
  .transform(hiddenIsNotFeatured);
export type PlanFormValues = z.input<typeof planFormSchema>;
