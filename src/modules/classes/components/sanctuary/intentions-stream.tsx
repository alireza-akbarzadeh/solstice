"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowUpIcon, HeartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSanctuaryStore } from "./sanctuary-store";

export function IntentionsStream() {
  const locale = useLocale();
  const t = useTranslations("LiveClasses");

  const intentions = useSanctuaryStore((state) => state.intentions);
  const userHearts = useSanctuaryStore((state) => state.userHearts);
  const newIntentionText = useSanctuaryStore((state) => state.newIntentionText);
  const setNewIntentionText = useSanctuaryStore((state) => state.setNewIntentionText);
  const addIntention = useSanctuaryStore((state) => state.addIntention);
  const toggleHeart = useSanctuaryStore((state) => state.toggleHeart);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const author = locale === "fa" ? "شما" : "You";
    const location = locale === "fa" ? "مت خانگی" : "Home Mat";
    addIntention(author, location);
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden p-4 pt-1">
      {/* Scrollable Feed */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pe-1 scroll-smooth">
        {/* Holding Silence Notice */}
        <div className="text-center py-2 px-3 bg-surface-container-low rounded-xl">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary block font-semibold">
            {t("holdingSilence")}
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
            {locale === "fa"
              ? "سپاسگزاری‌ها، بازتاب‌های تنفسی و نیت‌های آرام را به اشتراک بگذارید."
              : "Share mindful gratitude, breath check-ins, or subtle impressions."}
          </p>
        </div>

        {intentions.map((item) => (
          <div
            key={item.id}
            className={cn(
              "p-3.5 rounded-xl space-y-1.5 transition-colors",
              item.isPin
                ? "bg-primary/5 border-s-2 border-primary"
                : "bg-surface-container-low",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-6 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-label-sm text-label-sm font-bold">
                  {item.author[0]}
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  {item.author}
                </span>
                <span className="font-label-sm text-label-sm text-outline">
                  {item.location}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline">
                {item.time}
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
              {item.body}
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs text-on-surface-variant">
              <button
                onClick={() => toggleHeart(item.id)}
                className={cn(
                  "inline-flex items-center gap-1 transition-colors",
                  userHearts[item.id] ? "text-primary font-medium" : "hover:text-primary",
                )}
                aria-label={t("heldInHeart", { count: item.hearts })}
              >
                <HeartIcon
                  className={cn(
                    "size-3.5",
                    userHearts[item.id] && "fill-current text-primary",
                  )}
                />
                <span>{t("heldInHeart", { count: item.hearts })}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Intention Input Composer */}
      <form onSubmit={handleSubmit} className="pt-3 space-y-2 border-t border-outline-variant/30">
        <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-xl">
          <input
            type="text"
            value={newIntentionText}
            onChange={(e) => setNewIntentionText(e.target.value)}
            placeholder={t("reflectionPrompt")}
            className="flex-1 bg-transparent border-none text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:outline-none py-2"
          />
          <button
            type="submit"
            disabled={!newIntentionText.trim()}
            className="text-primary hover:text-primary-container disabled:opacity-40 transition-colors p-1"
            aria-label="Submit reflection"
          >
            <ArrowUpIcon className="size-4" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-outline px-1">
          <span>{t("holdSpaceGently")}</span>
          <span>{t("pressEnterToOffer")}</span>
        </div>
      </form>
    </div>
  );
}
