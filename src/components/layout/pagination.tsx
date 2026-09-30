import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getFormatter } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
  labels: { nav: string; previous: string; next: string; page: (page: number) => string };
};

// 1 … current±1 … last, e.g. [1, "gap", 4, 5, 6, "gap", 24].
function pageItems(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1]! > 1 ? ["gap" as const, p] : [p]));
}

const cell = "flex size-10 items-center justify-center rounded-lg font-label-md text-label-md transition-colors";

export async function Pagination({ page, pageCount, hrefForPage, labels }: Props) {
  const format = await getFormatter();
  if (pageCount <= 1) return null;

  const arrow = (target: number, label: string, Icon: typeof ChevronLeftIcon) =>
    target < 1 || target > pageCount ? (
      <span aria-hidden className={cn(cell, "cursor-not-allowed bg-surface-container text-outline")}>
        <Icon className="size-5 rtl:rotate-180" />
      </span>
    ) : (
      <Link href={hrefForPage(target)} aria-label={label} className={cn(cell, "bg-surface-container text-on-surface hover:bg-surface-container-high")}>
        <Icon className="size-5 rtl:rotate-180" />
      </Link>
    );

  return (
    <nav aria-label={labels.nav} className="flex items-center gap-2">
      {arrow(page - 1, labels.previous, ChevronLeftIcon)}
      {pageItems(page, pageCount).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} aria-hidden className="px-2 font-label-sm text-label-sm text-outline">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefForPage(item)}
            aria-label={labels.page(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              cell,
              item === page ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-high",
            )}
          >
            {format.number(item)}
          </Link>
        ),
      )}
      {arrow(page + 1, labels.next, ChevronRightIcon)}
    </nav>
  );
}
