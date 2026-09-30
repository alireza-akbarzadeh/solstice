import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Stitch: the filter pill row above the admin tables. Server-rendered links, so the view
 * stays in the URL and survives a reload or a shared link.
 */
export function StudioFilterPills({
  basePath,
  param,
  active,
  options,
  keep,
}: {
  basePath: string;
  param: string;
  active: string;
  options: readonly { value: string; label: string; count?: number }[];
  /** Other search params to carry across, e.g. the practice being edited. */
  keep?: Record<string, string>;
}) {
  const href = (value: string) => {
    const query = new URLSearchParams(keep);
    // The first option is the default view, so it needs no parameter.
    if (value !== options[0]?.value) query.set(param, value);
    const s = query.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="-mx-margin-mobile flex gap-1.5 overflow-x-auto px-margin-mobile pb-1 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
      {options.map((option) => {
        const isActive = option.value === active;
        return (
          <Link
            key={option.value}
            href={href(option.value)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-label-sm text-label-sm whitespace-nowrap shadow-sm transition-colors",
              isActive ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn("font-label-sm text-label-sm", isActive ? "text-on-primary/70" : "text-outline")}>{option.count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
