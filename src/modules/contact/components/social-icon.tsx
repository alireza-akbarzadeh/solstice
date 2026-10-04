import { GlobeIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { SocialNetwork } from "../types";
import { brandPaths } from "./brand-paths";

/** The network's mark; a plain globe for a website. Decorative — label the link instead. */
export function SocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
  if (network === "website") return <GlobeIcon aria-hidden className={cn("size-4", className)} />;
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("size-4 fill-current", className)}>
      <path d={brandPaths[network]} />
    </svg>
  );
}
