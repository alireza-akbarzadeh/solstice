"use client";

import { LoaderCircleIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { usePwaUpdate } from "./pwa-update-provider";

/**
 * A quiet card above the bottom tab bar, not a modal: the member keeps whatever they were
 * doing until they choose to switch. Renders nothing until a new version is genuinely waiting,
 * so it costs no markup on the server and cannot differ between server and client.
 */
export function PwaUpdatePrompt() {
  const t = useTranslations("Pwa.update");
  const pwa = usePwaUpdate();

  if (!pwa?.updateReady) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px))] z-50 px-margin-mobile pb-space-sm lg:inset-x-auto lg:end-4 lg:bottom-4 lg:px-0"
    >
      <div className="mx-auto flex max-w-md flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-lg ring-1 ring-hairline lg:w-80">
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-container/40 text-primary">
            <SparklesIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-label-lg text-label-lg text-on-surface">{t("title")}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t("body")}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-space-xs">
          <Button variant="ghost" size="sm" onClick={pwa.dismiss} disabled={pwa.isUpdating}>
            {t("later")}
          </Button>
          <Button size="sm" onClick={pwa.update} disabled={pwa.isUpdating}>
            {pwa.isUpdating && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
            {pwa.isUpdating ? t("updating") : t("update")}
          </Button>
        </div>
      </div>
    </div>
  );
}
