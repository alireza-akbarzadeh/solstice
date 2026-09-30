"use client";
import { CheckIcon, GlobeIcon, Loader2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

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
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-lg border-border/60 bg-background/50 px-3 text-xs font-medium backdrop-blur-sm transition-all hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("label")}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
          ) : (
            <GlobeIcon className="size-3.5 text-muted-foreground" />
          )}
          <span className="font-mono text-xs font-semibold uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-44 rounded-xl border border-border/80 bg-popover/95 p-1.5 shadow-md backdrop-blur-md"
      >
        <div className="px-2 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
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
                className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 font-mono text-[10px] uppercase text-muted-foreground">
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