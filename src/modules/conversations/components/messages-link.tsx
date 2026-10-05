import { MessageCircleIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** Header shortcut to conversations, with a count of what's waiting (replies, or the studio's queue). */
export async function MessagesLink({ href, count }: { href: string; count: number }) {
  const [t, format] = await Promise.all([getTranslations("Conversations"), getFormatter()]);
  const label = count ? t("headerLinkCount", { count }) : t("headerLink");
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative flex size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
    >
      <MessageCircleIcon className="size-5" />
      {count > 0 && (
        <span className="absolute end-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-clay px-1 font-label-sm text-[10px] leading-4 text-on-primary">
          {format.number(Math.min(count, 99))}
        </span>
      )}
    </Link>
  );
}
