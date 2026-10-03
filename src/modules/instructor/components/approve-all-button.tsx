"use client";

import { CheckCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { approveAllReflections } from "@/modules/community/actions";

/** Clears the review queue in one go; each approval can still be reversed by rejecting it. */
export function ApproveAllButton({ count }: { count: number }) {
  const t = useTranslations("Studio.community");
  const [pending, start] = useTransition();
  return (
    <Button
      disabled={pending || count === 0}
      onClick={() =>
        start(async () => {
          const result = await approveAllReflections();
          if (result.ok) toast.success(t("approvedAll", { count }));
          else toast.error(t("approveFailed"));
        })
      }
    >
      {pending ? <Spinner data-icon="inline-start" /> : <CheckCheckIcon data-icon="inline-start" />}
      {t("approveAll", { count })}
    </Button>
  );
}
