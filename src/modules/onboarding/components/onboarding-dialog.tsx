"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import type { MemberOnboarding } from "../types";
import { OnboardingForm } from "./onboarding-form";

export function OnboardingDialog({
  initialData,
  trigger,
  defaultOpen = false,
}: {
  initialData?: MemberOnboarding | null;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const t = useTranslations("Onboarding");
  const [open, setOpen] = useState(defaultOpen);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      ) : (
        <ResponsiveDialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <SparklesIcon className="size-3.5 text-secondary" />
            <span>{t("beginCta")}</span>
          </Button>
        </ResponsiveDialogTrigger>
      )}

      <ResponsiveDialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="font-headline-sm text-headline-sm">
            {t("dialogTitle")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="font-body-sm text-body-sm text-on-surface-variant">
            {t("dialogDesc")}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="py-2">
          <OnboardingForm
            initialData={initialData}
            onComplete={() => setOpen(false)}
          />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
