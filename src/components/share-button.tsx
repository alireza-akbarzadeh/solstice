"use client";

import { Share2Icon } from "lucide-react";
import { toast } from "sonner";

// Native share sheet where available (phones), clipboard copy elsewhere.
export function ShareButton({
  title,
  label,
  copiedLabel,
  className,
}: {
  title: string;
  label: string;
  copiedLabel: string;
  className?: string;
}) {
  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // Dismissed by the user.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success(copiedLabel);
  };

  return (
    <button type="button" onClick={share} aria-label={label} title={label} className={className}>
      <Share2Icon className="size-5" />
    </button>
  );
}
