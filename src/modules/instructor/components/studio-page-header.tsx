import { cn } from "@/lib/utils";

/**
 * The header every studio page opens with (Stitch: the tinted welcome panel on the admin
 * screens) — eyebrow, title, a sentence of real numbers, and an action ribbon on the end.
 */
export function StudioPageHeader({
  eyebrow,
  title,
  lede,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("relative overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg", className)}>
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -end-20 size-96 rounded-full bg-primary-container/25 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
            <span className="size-1.5 rounded-full bg-primary" />
            {eyebrow}
          </span>
          <h1 className="mt-space-xs font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface md:font-headline-lg md:text-headline-lg">
            {title}
          </h1>
          {lede && <p className="mt-1.5 font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{lede}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-space-xs">{actions}</div>}
      </div>
    </header>
  );
}
