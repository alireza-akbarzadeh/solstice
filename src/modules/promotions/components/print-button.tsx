"use client";

import { PrinterIcon } from "lucide-react";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-label-md text-label-md text-on-primary shadow-xs hover:bg-primary/90 transition-colors"
    >
      <PrinterIcon className="size-4" />
      {label}
    </button>
  );
}
