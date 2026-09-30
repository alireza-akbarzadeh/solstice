import { cn } from "@/lib/utils";

// Eyebrow label + serif title + optional lede, as used across the Stitch marketing pages.
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", className)}>
      <span className="mb-2 block font-label-md text-label-md tracking-widest text-clay uppercase">{eyebrow}</span>
      <h2 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
        {title}
      </h2>
      {description && <p className="mt-3 font-body-md text-body-md text-on-surface-variant">{description}</p>}
    </div>
  );
}
