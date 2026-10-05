"use client";
import {
  AlertCircleIcon,
  BellIcon,
  BellOffIcon,
  BellRingIcon,
  CheckCircle2Icon,
  Loader2Icon,
  SendIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { env } from "@/env";

import { sendTestNotification, subscribeToPush, unsubscribeFromPush } from "../actions";

type Status = "checking" | "unsupported" | "blocked" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          aria-label={status === "on" ? t("disable") : t("enable")}
          className="relative inline-flex size-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-low/60 text-on-surface-variant backdrop-blur-sm transition-all hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:bg-surface-container-high/40 dark:hover:bg-surface-container-highest/80"
        >
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin text-on-surface-variant" />
          ) : status === "on" ? (
            <BellRingIcon className="size-4 text-primary" />
          ) : status === "off" ? (
            <BellIcon className="size-4 text-on-surface-variant" />
          ) : (
            <BellOffIcon className="size-4 text-clay" />
          )}

          {/* Active status indicator pip */}
          {status === "on" && (
            <span className="absolute end-1.5 top-1.5 flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary ring-2 ring-surface" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 rounded-2xl border border-hairline bg-surface/95 p-2 shadow-ambient backdrop-blur-md"
      >
        {/* Card Header with Status Summary */}
        <DropdownMenuLabel className="p-3 font-normal">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-surface-container text-primary">
                <BellIcon className="size-4" />
              </div>
              <div>
                <p className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-outline">
                  Push Notifications
                </p>
                <p className="font-headline-sm text-xs font-medium text-on-surface">
                  {status === "on"
                    ? "Active Subscribed"
                    : status === "off"
                    ? "Disabled"
                    : status === "blocked"
                    ? "Access Blocked"
                    : "Not Supported"}
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                status === "on"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : status === "off"
                  ? "border-outline-variant/30 bg-surface-container text-on-surface-variant"
                  : "border-clay/30 bg-clay/10 text-clay"
              }`}
            >
              {status}
            </Badge>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="-mx-2 my-1" />

        {/* State Information / Callouts */}
        {status === "unsupported" && (
          <div className="m-1 flex items-start gap-2.5 rounded-xl border border-clay/30 bg-clay/10 p-3 text-xs text-clay">
            <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t("unsupported")}</p>
          </div>
        )}

        {status === "blocked" && (
          <div className="m-1 flex items-start gap-2.5 rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error">
            <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t("blocked")}</p>
          </div>
        )}

        {/* Action Controls */}
        <DropdownMenuGroup className="space-y-0.5">
          {status === "off" && (
            <DropdownMenuItem
              onSelect={turnOn}
              disabled={isPending}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl py-2.5 text-xs font-semibold text-primary focus:bg-primary/10 focus:text-primary"
            >
              <CheckCircle2Icon className="size-4" />
              <span>{t("enable")}</span>
            </DropdownMenuItem>
          )}

          {status === "on" && (
            <>
              <DropdownMenuItem
                onSelect={sendTest}
                disabled={isPending}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl py-2 text-xs font-medium text-on-surface focus:bg-surface-container"
              >
                <SendIcon className="size-4 text-on-surface-variant" />
                <span>{t("sendTest")}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="-mx-2 my-1" />

              <DropdownMenuItem
                onSelect={turnOff}
                disabled={isPending}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl py-2 text-xs font-medium text-error focus:bg-error/10 focus:text-error"
              >
                <BellOffIcon className="size-4" />
                <span>{t("disable")}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}