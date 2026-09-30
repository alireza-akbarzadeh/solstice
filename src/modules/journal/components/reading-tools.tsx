"use client";

import { PrinterIcon } from "lucide-react";
import { useEffect, useState } from "react";

/** Thin bar under the header that fills as the essay is read. */
export function ReadingProgress({ label }: { label: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const article = document.getElementById("essay");
      if (!article) return;
      const { top, height } = article.getBoundingClientRect();
      const read = Math.min(Math.max(-top / Math.max(height - window.innerHeight, 1), 0), 1);
      setProgress(Math.round(read * 100));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      className="fixed inset-x-0 top-16 z-40 h-[3px] bg-surface-variant/40 lg:top-20 print:hidden"
    >
      <div className="h-full origin-left bg-primary transition-transform duration-150 ease-out rtl:origin-right" style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}

export function PrintButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <PrinterIcon className="size-4" />
      <span>{label}</span>
    </button>
  );
}
