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
      className="relative inline-flex size-8 items-center justify-center rounded-full text-on-surface-variant transition-all hover:bg-surface-container/80 hover:text-on-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary active:scale-95 dark:hover:bg-surface-container-highest/60"
    >
      <MessageCircleIcon className="size-4" />
      {count > 0 && (
        <span className="absolute -top-0.5 -end-0.5 flex min-w-3.5 h-3.5 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold text-on-primary ring-2 ring-surface shadow-xs">
          {format.number(Math.min(count, 99))}
        </span>
      )}
    </Link>
  );
}
