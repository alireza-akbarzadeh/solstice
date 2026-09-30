"use client";

import { BellIcon, BellOffIcon, BellRingIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { env } from "@/env";

import { sendTestNotification, subscribeToPush, unsubscribeFromPush } from "../actions";

type Status = "checking" | "unsupported" | "blocked" | "off" | "on";

// VAPID public keys are URL-safe base64; PushManager wants raw bytes.
function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function isSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function PushToggle() {
  const t = useTranslations("Notifications");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("checking");
  const [isPending, startTransition] = useTransition();
  const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey || !isSupported()) return setStatus("unsupported");
    if (Notification.permission === "denied") return setStatus("blocked");
    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setStatus(subscription ? "on" : "off"));
  }, [publicKey]);

  const turnOn = () =>
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey!),
        });
        const result = await subscribeToPush({ subscription: subscription.toJSON(), locale });
        if (!result.ok) {
          await subscription.unsubscribe();
          throw new Error(result.error);
        }
        setStatus("on");
        toast.success(t("enabled"));
      } catch {
        if (Notification.permission === "denied") {
          setStatus("blocked");
          toast.error(t("blocked"));
        } else {
          toast.error(t("failed"));
        }
      }
    });

  const turnOff = () =>
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await unsubscribeFromPush(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setStatus("off");
        toast(t("disabledToast"));
      } catch {
        toast.error(t("failed"));
      }
    });

  const sendTest = () =>
    startTransition(async () => {
      const result = await sendTestNotification();
      if (result.ok) toast.success(t("testSent"));
      else toast.error(t("failed"));
    });

  if (status === "checking") return null;

  const Icon = status === "on" ? BellRingIcon : status === "off" ? BellIcon : BellOffIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="rounded-full" aria-label={status === "on" ? t("disable") : t("enable")} disabled={isPending}>
          <Icon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {status === "unsupported" && <DropdownMenuLabel className="font-normal whitespace-normal">{t("unsupported")}</DropdownMenuLabel>}
        {status === "blocked" && <DropdownMenuLabel className="font-normal whitespace-normal">{t("blocked")}</DropdownMenuLabel>}
        {status === "off" && <DropdownMenuItem onSelect={turnOn}>{t("enable")}</DropdownMenuItem>}
        {status === "on" && (
          <>
            <DropdownMenuLabel className="font-normal whitespace-normal">{t("enabled")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={sendTest}>{t("sendTest")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={turnOff}>{t("disable")}</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
