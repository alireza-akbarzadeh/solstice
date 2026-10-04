import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { telHref, type StudioContact } from "../types";

const linkStyle =
  "break-all transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

/** Email, phone and address as a compact list (footer); renders nothing when none is set. */
export async function ContactList({ contact, locale, className }: { contact: StudioContact; locale: Locale; className?: string }) {
  const t = await getTranslations("Contact");
  const address = contact.address[locale];
  if (!contact.email && !contact.phone && !address) return null;
  return (
    <ul className={cn("flex flex-col gap-3 text-sm text-on-surface-variant", className)}>
      {contact.email && (
        <li className="flex items-start gap-2.5">
          <MailIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-clay" />
          <a href={`mailto:${contact.email}`} className={linkStyle}>
            <span className="sr-only">{t("email")}: </span>
            {contact.email}
          </a>
        </li>
      )}
      {contact.phone && (
        <li className="flex items-start gap-2.5">
          <PhoneIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-clay" />
          <a href={telHref(contact.phone)} className={linkStyle}>
            <span className="sr-only">{t("phone")}: </span>
            <bdi dir="ltr">{contact.phone}</bdi>
          </a>
        </li>
      )}
      {address && (
        <li className="flex items-start gap-2.5">
          <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-clay" />
          <address className="whitespace-pre-line not-italic">
            <span className="sr-only">{t("address")}: </span>
            {address}
          </address>
        </li>
      )}
    </ul>
  );
}
