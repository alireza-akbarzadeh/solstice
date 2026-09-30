"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { getPathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Stitch: the search field above the admin tables. The query lives in the URL as `q`. */
export function StudioSearch({
  basePath,
  value,
  placeholder,
  keep,
}: {
  basePath: string;
  value: string | undefined;
  placeholder: string;
  /** Params to preserve, e.g. the open view; the search always resets to page one. */
  keep?: Record<string, string>;
}) {
  const t = useTranslations("Studio");
  const router = useRouter();
  const locale = useLocale();
  const [pending, start] = useTransition();

  const go = (q: string) => {
    const query = new URLSearchParams(keep);
    if (q) query.set("q", q);
    const s = query.toString();
    start(() => router.replace(s ? `${basePath}?${s}` : basePath, { scroll: false }));
  };

  return (
    <form
      role="search"
      action={getPathname({ href: basePath, locale })}
      onSubmit={(e) => {
        e.preventDefault();
        const raw = new FormData(e.currentTarget).get("q");
        go(typeof raw === "string" ? raw.trim() : "");
      }}
      className={cn("relative flex-1 transition-opacity", pending && "opacity-70")}
    >
      <label htmlFor="studio-search" className="sr-only">
        {t("search")}
      </label>
      <SearchIcon className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
      <input
        id="studio-search"
        name="q"
        type="search"
        key={value ?? ""}
        defaultValue={value}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg bg-surface ps-10 pe-24 font-body-sm text-body-sm text-on-surface shadow-sm transition-colors placeholder:text-outline focus:ring-1 focus:ring-primary focus:outline-none"
      />
      <span className="absolute end-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {value && (
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => go("")} aria-label={t("clear")}>
            <XIcon />
          </Button>
        )}
        <Button type="submit" size="sm" variant="secondary">
          {t("search")}
        </Button>
      </span>
    </form>
  );
}
