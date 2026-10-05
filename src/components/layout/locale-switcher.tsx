"use client";
import { CheckIcon, GlobeIcon, Loader2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  function onSelect(next: string) {
    if (next === locale) return;

    startTransition(() => {
      router.replace(
        // @ts-expect-error -- params always match the current pathname
        { pathname, params },
        { locale: next as Locale },
      );
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          aria-label={t("label")}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container-low/60 px-3 font-mono text-xs font-semibold uppercase text-on-surface-variant backdrop-blur-sm transition-all hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:bg-surface-container-high/40 dark:hover:bg-surface-container-highest/80"
        >
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin text-on-surface-variant" />
          ) : (
            <GlobeIcon className="size-4 text-on-surface-variant" />
          )}
          <span>{locale}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-44 rounded-2xl border border-hairline bg-surface/95 p-1.5 shadow-ambient backdrop-blur-md"
      >
        <div className="px-2.5 py-1.5 font-label-sm text-[10px] font-semibold tracking-wider text-outline uppercase">
          {t("label") ?? "Language"}
        </div>

        <div className="space-y-0.5">
          {routing.locales.map((l) => {
            const isSelected = l === locale;

            return (
              <DropdownMenuItem
                key={l}
                onSelect={() => onSelect(l)}
                disabled={isPending}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 font-label-md text-xs transition-colors",
                  isSelected
                    ? "bg-primary-container/20 font-semibold text-primary"
                    : "text-on-surface hover:bg-surface-container",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 font-mono text-[10px] uppercase text-outline">
                    {l}
                  </span>
                  <span>{t(l)}</span>
                </div>

                {isSelected && <CheckIcon className="size-3.5 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}