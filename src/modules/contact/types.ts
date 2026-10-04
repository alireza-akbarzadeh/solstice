import type { Localized } from "@/lib/localized";

/** Networks the studio can link to; each has an icon and a localized name. */
export const socialNetworks = [
  "instagram",
  "telegram",
  "whatsapp",
  "youtube",
  "aparat",
  "x",
  "facebook",
  "tiktok",
  "linkedin",
  "pinterest",
  "threads",
  "website",
] as const;
export type SocialNetwork = (typeof socialNetworks)[number];

export type SocialLink = { network: SocialNetwork; url: string };

/**
 * How visitors reach the studio, edited at /instructor/settings and stored as the `contact`
 * row of `solstice_setting`. Every field is optional; the footer and About show what is set.
 */
export type StudioContact = {
  email: string;
  phone: string;
  address: Localized;
  socials: SocialLink[];
};

export const MAX_SOCIAL_LINKS = 20;

export const emptyContact = (): StudioContact => ({
  email: "",
  phone: "",
  address: { en: "", fa: "" },
  socials: [],
});

export const hasContactDetails = (contact: StudioContact) =>
  !!(contact.email || contact.phone || contact.address.en || contact.address.fa);

/** `tel:` keeps only the leading plus and digits. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
