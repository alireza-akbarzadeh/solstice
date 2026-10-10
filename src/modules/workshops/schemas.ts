import { z } from "zod";

const text = (max: number) =>
  z.object({ en: z.string().trim().max(max), fa: z.string().trim().max(max) });

export const workshopRegistrationSchema = z.object({
  pageSlug: z.string().min(1),
  name: z.string().trim().min(2, "nameRequired").max(100),
  email: z.string().trim().email("emailInvalid").max(200),
  phone: z.string().trim().min(5, "phoneRequired").max(40),
  notes: z.string().trim().max(1000),
});

export const workshopEventSchema = z.object({
  enabled: z.boolean().default(false),
  startDate: z.string().trim().max(100).default(""),
  endDate: z.string().trim().max(100).optional().default(""),
  timezone: z.string().trim().max(100).default("Asia/Tehran"),
  locationType: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  location: text(300).default({ en: "", fa: "" }),
  capacity: z.number().int().min(0).max(10000).nullable().optional(),
  priceLabel: text(200).default({ en: "", fa: "" }),
  paymentInstructions: text(2000).default({ en: "", fa: "" }),
  registrationOpen: z.boolean().default(true),
});

export type WorkshopRegistrationFormValues = {
  pageSlug: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
};
