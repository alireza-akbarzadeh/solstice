"use client";

import { useTranslations } from "next-intl";
import { SparklesIcon } from "lucide-react";
import type { MemberOnboarding } from "../types";
import { OnboardingForm } from "./onboarding-form";

export function ProfileOnboardingSection({
  onboarding,
}: {
  onboarding?: MemberOnboarding | null;
}) {
  const t = useTranslations("Onboarding");

  return (
    <section className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm border border-outline-variant/30">
      <div className="flex items-center gap-2">
        <SparklesIcon className="size-4 text-primary" />
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          {t("profileSectionTitle")}
        </h2>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("profileSectionDesc")}
      </p>

      <div className="pt-2">
        <OnboardingForm initialData={onboarding} />
      </div>
    </section>
  );
}
