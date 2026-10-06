"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckIcon, Loader2Icon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ExperienceLevel, MemberOnboarding, PrimaryGoal, TimeAvailable } from "../types";
import { experienceLevels, primaryGoalsList, timeAvailableList } from "../schemas";
import { saveOnboardingAction } from "../server/actions";

export function OnboardingForm({
  initialData,
  onComplete,
}: {
  initialData?: MemberOnboarding | null;
  onComplete?: () => void;
}) {
  const t = useTranslations("Onboarding");
  const [isPending, startTransition] = useTransition();

  const [level, setLevel] = useState<ExperienceLevel>(
    initialData?.experienceLevel ?? "beginner",
  );
  const [goals, setGoals] = useState<PrimaryGoal[]>(
    initialData?.primaryGoals ?? ["flexibility", "stress_relief"],
  );
  const [time, setTime] = useState<TimeAvailable>(
    initialData?.timeAvailable ?? "30_mins",
  );
  const [injuries, setInjuries] = useState<string>(
    initialData?.injuriesAndLimits ?? "",
  );

  const toggleGoal = (g: PrimaryGoal) => {
    if (goals.includes(g)) {
      if (goals.length > 1) {
        setGoals(goals.filter((item) => item !== g));
      }
    } else {
      setGoals([...goals, g]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveOnboardingAction({
        experienceLevel: level,
        primaryGoals: goals,
        timeAvailable: time,
        injuriesAndLimits: injuries,
      });

      if (res.ok) {
        toast.success(t("savedSuccess"));
        onComplete?.();
      } else {
        toast.error(t("saveError"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-space-md">
      {/* 1. Experience Level */}
      <div className="space-y-2">
        <label className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
          {t("levelLabel")}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {experienceLevels.map((lvl) => (
            <button
              type="button"
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={cn(
                "py-2.5 px-3 rounded-xl border text-center transition-all font-label-md text-label-md",
                level === lvl
                  ? "bg-primary text-on-primary border-primary font-semibold shadow-xs"
                  : "bg-surface-container-low border-outline-variant/40 text-on-surface hover:bg-surface-container",
              )}
            >
              {t(`levels.${lvl}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Primary Intentions & Goals */}
      <div className="space-y-2">
        <label className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
          {t("goalsLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {primaryGoalsList.map((g) => {
            const isSelected = goals.includes(g);
            return (
              <button
                type="button"
                key={g}
                onClick={() => toggleGoal(g)}
                className={cn(
                  "inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full border text-xs transition-all font-label-md",
                  isSelected
                    ? "bg-secondary-container text-on-secondary-container border-secondary/40 font-medium"
                    : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:text-on-surface",
                )}
              >
                {isSelected && <CheckIcon className="size-3 text-secondary shrink-0" />}
                <span>{t(`goals.${g}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Session Duration Pace */}
      <div className="space-y-2">
        <label className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
          {t("timeLabel")}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {timeAvailableList.map((tm) => (
            <button
              type="button"
              key={tm}
              onClick={() => setTime(tm)}
              className={cn(
                "py-2 px-3 rounded-xl border text-center transition-all font-label-sm text-label-sm",
                time === tm
                  ? "bg-surface-container-high border-primary text-primary font-bold shadow-xs"
                  : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:bg-surface-container",
              )}
            >
              {t(`times.${tm}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Physical Sensitivities & Limits */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
            {t("injuriesLabel")}
          </label>
          <span className="text-xs text-outline">{t("optional")}</span>
        </div>
        <Textarea
          value={injuries}
          onChange={(e) => setInjuries(e.target.value)}
          placeholder={t("injuriesPlaceholder")}
          rows={3}
          className="resize-none text-body-sm font-body-sm bg-surface-container-low border-outline-variant/40"
        />
        <p className="font-body-sm text-xs text-on-surface-variant/80">
          {t("injuriesHint")}
        </p>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <Loader2Icon className="size-4 animate-spin me-2" />
        ) : (
          <SparklesIcon className="size-4 me-2" />
        )}
        <span>{t("saveButton")}</span>
      </Button>
    </form>
  );
}
