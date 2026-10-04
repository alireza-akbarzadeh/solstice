import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";

import type { SocialLink } from "../types";
import { SocialIcon } from "./social-icon";

/** The studio's social profiles as round icon links (footer, About). */
export async function SocialLinks({ links, className }: { links: SocialLink[]; className?: string }) {
  const t = await getTranslations("Contact.networks");
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {links.map((link, index) => (
        <li key={`${index}:${link.url}`}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(link.network)}
            title={t(link.network)}
            className="flex size-11 items-center justify-center rounded-full border border-primary/15 transition-colors hover:bg-primary hover:text-on-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <SocialIcon network={link.network} className="size-4.5" />
          </a>
        </li>
      ))}
    </ul>
  );
}
