import { z } from "zod";

import {
  MAX_SOCIAL_LINKS,
  socialNetworks,
  type SocialNetwork,
} from "./types";

// Persian keyboards type ۰–۹ (and Arabic ٠–٩); store Latin digits so links and `tel:` work.
const toLatinDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

/** Where a bare handle ("@arteyoga" or "arteyoga") points on each network. */
const profileBase: Partial<Record<SocialNetwork, string>> = {
  instagram: "https://www.instagram.com/",
  telegram: "https://t.me/",
  youtube: "https://www.youtube.com/@",
  aparat: "https://www.aparat.com/",
  x: "https://x.com/",
  facebook: "https://www.facebook.com/",
  tiktok: "https://www.tiktok.com/@",
  linkedin: "https://www.linkedin.com/in/",
  pinterest: "https://www.pinterest.com/",
  threads: "https://www.threads.net/@",
};

function webAddress(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password || !url.hostname.includes(".")) return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Turns what the instructor typed into a full link: a URL as-is, a handle onto the network's
 * profile address, a WhatsApp number (international format) onto wa.me, or a bare domain
 * onto https. Returns null when it can't tell what was meant.
 */
export function socialUrl(network: SocialNetwork, input: string) {
  const value = toLatinDigits(input.trim());
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return webAddress(value);
  if (network === "whatsapp") {
    const digits = value.replace(/[\s()+-]/g, "");
    // A leading 0 is a local number, which wa.me can't route; ask for the country code.
    if (/^\d+$/.test(digits))
      return /^[1-9]\d{6,14}$/.test(digits) ? `https://wa.me/${digits}` : null;
  }
  const base = profileBase[network];
  const handle = value.replace(/^@/, "");
  if (base && /^[\w.-]{1,64}$/.test(handle)) return base + handle;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value))
    return webAddress(`https://${value}`);
  return null;
}

const socialLinkSchema = z
  .object({ network: z.enum(socialNetworks), url: z.string().max(400) })
  .transform((link, ctx) => {
    const url = socialUrl(link.network, link.url);
    if (!url) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "url" });
      return z.NEVER;
    }
    return { network: link.network, url };
  });

const email = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || z.email().safeParse(v).success);

const phone = z
  .string()
  .trim()
  .max(40)
  .transform(toLatinDigits)
  .refine(
    (v) =>
      v === "" ||
      (/^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, "").length >= 5),
  );

// An address is shown in the visitor's language, so it needs both or neither.
const address = z
  .object({ en: z.string().trim().max(300), fa: z.string().trim().max(300) })
  .refine((v) => !v.en === !v.fa);

/** The studio's contact form (react-hook-form + zodResolver) and its action share this. */
export const contactSchema = z.object({
  email,
  phone,
  address,
  socials: z.array(socialLinkSchema).max(MAX_SOCIAL_LINKS),
});
export type ContactFormValues = z.input<typeof contactSchema>;
