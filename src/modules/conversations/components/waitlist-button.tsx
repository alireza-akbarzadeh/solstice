"use client";

import { BellRingIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";

import { notifyWaitlist } from "../studio-actions";

/** Tells a plan's waitlist that a place opened (push + email to each, once). */
export function WaitlistButton({ planId, count }: { planId: string; count: number }) {
  const t = useTranslations("Studio.inbox.places");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending || count === 0}
      onClick={() =>
        startTransition(async () => {
          const result = await notifyWaitlist(planId);
          if (result.ok) toast.success(t("notified", { count: result.notified }));
          router.refresh();
        })
      }
      className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
    >
      <BellRingIcon className="size-3.5" />
      {t("notify", { count })}
    </button>
  );
}
