"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useSanctuaryStore } from "./sanctuary-store";
import { IntentionsStream } from "./intentions-stream";
import { InquiriesStream } from "./inquiries-stream";

export function SanghaHub({ joinUrl }: { joinUrl?: string }) {
  const t = useTranslations("LiveClasses");
  const activeTab = useSanctuaryStore((state) => state.activeTab);
  const setActiveTab = useSanctuaryStore((state) => state.setActiveTab);

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col h-[700px]">
      {/* Tab Navigation Switcher */}
      <div className="bg-surface-container-low p-1.5 m-3 rounded-xl flex items-center gap-1">
        <button
          onClick={() => setActiveTab("intentions")}
          className={cn(
            "flex-1 py-2 rounded-lg font-label-md text-label-md tracking-wider uppercase transition-all",
            activeTab === "intentions"
              ? "bg-surface text-primary shadow-xs font-semibold"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          {t("intentionsTab")}
        </button>
        <button
          onClick={() => setActiveTab("inquiries")}
          className={cn(
            "flex-1 py-2 rounded-lg font-label-md text-label-md tracking-wider uppercase transition-all",
            activeTab === "inquiries"
              ? "bg-surface text-primary shadow-xs font-semibold"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          {t("inquiriesTab")}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "intentions" ? (
        <IntentionsStream />
      ) : (
        <InquiriesStream joinUrl={joinUrl} />
      )}
    </div>
  );
}
