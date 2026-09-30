import { cn } from "@/lib/utils";

// The Stitch page frame: 1320px max, 3rem side margins on desktop, 1.25rem on mobile.
export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-content px-margin-mobile md:px-margin", className)}
      {...props}
    />
  );
}
