"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  BookOpenIcon,
  CreditCardIcon,
  EyeIcon,
  EyeOffIcon,
  Flower2Icon,
  MessageSquareQuoteIcon,
  RotateCcwIcon,
  SaveIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";
import type { HomeSectionConfig, HomeSectionId } from "@/modules/home/sections";
import {
  resetHomeSectionsAction,
  saveHomeSectionsAction,
} from "@/modules/instructor/home-actions";

const SECTION_ICONS: Record<HomeSectionId, React.ComponentType<{ className?: string }>> = {
  hero: SparklesIcon,
  featuredPractices: Flower2Icon,
  featuredPrograms: BookOpenIcon,
  instructor: UserIcon,
  testimonials: MessageSquareQuoteIcon,
  membership: CreditCardIcon,
};

export function HomeSectionsEditor({ initialSections }: { initialSections: HomeSectionConfig[] }) {
  const t = useTranslations("Studio.homeSections");
  const router = useRouter();
  const [sections, setSections] = useState<HomeSectionConfig[]>(initialSections);
  const [isSaving, startSaving] = useTransition();
  const [isResetting, startResetting] = useTransition();

  const handleToggle = (id: HomeSectionId, checked: boolean) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: checked } : s)));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    setSections((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const current = next[index];
      const target = next[targetIndex];
      if (!current || !target) return prev;
      next[index] = target;
      next[targetIndex] = current;
      return next;
    });
  };

  const handleSave = () => {
    startSaving(async () => {
      const result = await saveHomeSectionsAction(sections);
      if (!result.ok) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      toast.success(t("saved"));
      setSections(result.sections);
      router.refresh();
    });
  };

  const handleReset = () => {
    if (!window.confirm(t("resetConfirm"))) return;
    startResetting(async () => {
      const result = await resetHomeSectionsAction();
      if (!result.ok) {
        toast.error(t("errors.resetFailed"));
        return;
      }
      toast.success(t("resetSuccess"));
      setSections(result.sections);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-space-md rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-space-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-space-sm">
        <div>
          <h3 className="font-label-lg text-label-lg text-on-surface font-semibold">{t("title")}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{t("description")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isResetting || isSaving}
            onClick={handleReset}
            className="text-xs text-on-surface-variant hover:text-error gap-1.5"
          >
            {isResetting ? <Spinner className="size-3.5" /> : <RotateCcwIcon className="size-3.5" />}
            {t("reset")}
          </Button>

          <Button
            type="button"
            disabled={isSaving || isResetting}
            onClick={handleSave}
            className="gap-2 bg-primary text-on-primary hover:bg-primary-container"
          >
            {isSaving ? <Spinner className="size-4" /> : <SaveIcon className="size-4" />}
            {t("save")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {sections.map((section, index) => {
          const Icon = SECTION_ICONS[section.id] ?? SparklesIcon;
          const isFirst = index === 0;
          const isLast = index === sections.length - 1;

          return (
            <div
              key={section.id}
              className={`flex items-center justify-between gap-4 rounded-xl border p-3.5 transition-all ${
                section.enabled
                  ? "border-outline-variant/40 bg-surface shadow-xs"
                  : "border-outline-variant/20 bg-surface-container-lowest/60 opacity-60"
              }`}
            >
              {/* Left Side: Order pill, Icon, Title and Description */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-container font-mono text-xs font-semibold text-on-surface-variant">
                  {index + 1}
                </span>

                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4.5" />
                </span>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                      {t(`sections.${section.id}.title`)}
                    </span>
                    {section.enabled ? (
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 gap-1 text-[11px] py-0">
                        <EyeIcon className="size-3" />
                        {t("visible")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-outline-variant/50 text-outline gap-1 text-[11px] py-0">
                        <EyeOffIcon className="size-3" />
                        {t("hidden")}
                      </Badge>
                    )}
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
                    {t(`sections.${section.id}.description`)}
                  </p>
                </div>
              </div>

              {/* Right Side: Reorder arrows & Visibility switch */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-0.5 rounded-lg border border-outline-variant/30 bg-surface-container-low p-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={isFirst}
                    onClick={() => handleMove(index, "up")}
                    title={t("moveUp")}
                    aria-label={t("moveUp")}
                    className="size-7"
                  >
                    <ArrowUpIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={isLast}
                    onClick={() => handleMove(index, "down")}
                    title={t("moveDown")}
                    aria-label={t("moveDown")}
                    className="size-7"
                  >
                    <ArrowDownIcon className="size-3.5" />
                  </Button>
                </div>

                <div className="ps-2">
                  <Switch
                    checked={section.enabled}
                    onCheckedChange={(checked) => handleToggle(section.id, checked)}
                    aria-label={t(`sections.${section.id}.title`)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
