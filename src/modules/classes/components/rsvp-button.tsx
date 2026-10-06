"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckIcon, CalendarPlusIcon, Loader2Icon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { rsvpAction } from "../server/actions";

export function RsvpButton({
  classId,
  classSlug,
  initialRsvpd = false,
  initialCount = 0,
  capacity = null,
  access: _access = "members_only",
  userRole: _userRole,
  isLive: _isLive = false,
  className,
}: {
  classId: number;
  classSlug: string;
  initialRsvpd?: boolean;
  initialCount?: number;
  capacity?: number | null;
  access?: "members_only" | "open";
  userRole?: string | null;
  isLive?: boolean;
  className?: string;
}) {
  const t = useTranslations("LiveClasses");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rsvpd, setRsvpd] = useState(initialRsvpd);
  const [count, setCount] = useState(initialCount);

  const isFull = capacity !== null && count >= capacity && !rsvpd;

  const handleToggle = () => {
    startTransition(async () => {
      const res = await rsvpAction(classId);
      if (res.ok) {
        setRsvpd(res.rsvpd);
        setCount(res.rsvpCount);
        toast.success(res.rsvpd ? t("rsvpSuccess") : t("cancelRsvpSuccess"));
        router.refresh();
      } else {
        if (res.error === "unauthenticated") {
          toast.error(t("unauthenticatedError"));
          router.push(`/sign-in?next=/classes/${classSlug}`);
        } else if (res.error === "membership_required") {
          toast.error(t("membershipRequiredError"));
          router.push(`/membership?next=/classes/${classSlug}`);
        } else if (res.error === "class_full") {
          toast.error(t("classFullError"));
        } else {
          toast.error("An unexpected error occurred");
        }
      }
    });
  };

  return (
    <Button
      variant={rsvpd ? "outline" : "default"}
      size="default"
      disabled={isPending || (isFull && !rsvpd)}
      onClick={handleToggle}
      className={className}
    >
      {isPending ? (
        <Loader2Icon className="size-4 animate-spin me-2" />
      ) : rsvpd ? (
        <CheckIcon className="size-4 text-primary me-2" />
      ) : isFull ? (
        <SparklesIcon className="size-4 text-outline me-2" />
      ) : (
        <CalendarPlusIcon className="size-4 me-2" />
      )}
      <span>{rsvpd ? t("rsvpd") : isFull ? t("classFullError") : t("rsvp")}</span>
    </Button>
  );
}
