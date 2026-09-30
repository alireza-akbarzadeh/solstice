import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * One tile of the studio's metric bento (Stitch: studio-admin-*). `note` and `hint` are the
 * two footer ends; `children` takes an optional visual such as a bar row or a meter.
 */
export function StatCard({
  label,
  value,
  delta,
  note,
  hint,
  icon: Icon,
  children,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  note?: string;
  hint?: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-between rounded-xl bg-surface-container-low p-space-md shadow-sm transition-shadow hover:shadow-md", className)}>
      <div className="mb-space-sm flex items-start justify-between gap-2">
        <span className="font-label-md text-label-md tracking-wider text-clay uppercase">{label}</span>
        <Icon className="size-5 shrink-0 text-primary-container" />
      </div>
      <div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-headline-md text-headline-md text-on-surface">{value}</span>
          {delta && <span className="font-label-sm text-label-sm font-semibold text-primary">{delta}</span>}
        </div>
        {(note ?? hint) !== undefined && (
          <div className="mt-space-xs flex items-center justify-between gap-2 font-body-sm text-body-sm text-on-surface-variant">
            {note && <span>{note}</span>}
            {hint && <span className="text-outline">{hint}</span>}
          </div>
        )}
      </div>
      {children && <div className="mt-space-md">{children}</div>}
    </div>
  );
}

/** A labelled meter, used under a stat to show a share of a whole. */
export function StatMeter({ percent, caption }: { percent: number; caption: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
      <span className="font-label-sm text-label-sm whitespace-nowrap text-on-surface-variant">{caption}</span>
    </div>
  );
}

/** The small bar row from the Stitch stat tiles: a coarse shape of recent movement. */
export function StatBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const last = values.length - 1;
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden>
      {values.map((v, i) => (
        <div
          key={i}
          className={cn("w-full rounded-t-sm", i === last ? "bg-primary" : "bg-primary-container/50")}
          style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
