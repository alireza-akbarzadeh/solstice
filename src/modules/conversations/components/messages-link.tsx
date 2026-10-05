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
      className="relative inline-flex size-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-low/60 text-on-surface-variant backdrop-blur-sm transition-all hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 dark:bg-surface-container-high/40 dark:hover:bg-surface-container-highest/80"
    >
      <MessageCircleIcon className="size-4" />
      {count > 0 && (
        <span className="absolute -top-1 -end-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold text-on-primary ring-2 ring-surface shadow-xs">
          {format.number(Math.min(count, 99))}
        </span>
      )}
    </Link>
  );
}
