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
import { Button } from "@/components/ui/button";
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
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={status === "on" ? t("disable") : t("enable")}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : status === "on" ? (
            <BellRingIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          ) : status === "off" ? (
            <BellIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          ) : (
            <BellOffIcon className="h-5 w-5 text-amber-500/80" />
          )}

          {/* Glowing Status Dot */}
          {status === "on" && (
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 rounded-xl p-2 shadow-lg ring-1 ring-black/5 dark:ring-white/10"
      >
        {/* Card Header with Status Summary */}
        <DropdownMenuLabel className="p-3 font-normal">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <BellIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Push Notifications
                </p>
                <p className="text-xs font-medium text-foreground">
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
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                status === "on"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : status === "off"
                  ? "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {status}
            </Badge>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="-mx-2 my-1" />

        {/* State Information / Callouts */}
        {status === "unsupported" && (
          <div className="m-1 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t("unsupported")}</p>
          </div>
        )}

        {status === "blocked" && (
          <div className="m-1 flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t("blocked")}</p>
          </div>
        )}

        {/* Action Controls */}
        <DropdownMenuGroup className="space-y-0.5">
          {status === "off" && (
            <DropdownMenuItem
              onSelect={turnOn}
              disabled={isPending}
              className="rounded-lg cursor-pointer py-2.5 text-xs font-semibold text-violet-600 focus:bg-violet-500/10 focus:text-violet-700 dark:text-violet-400 flex items-center gap-2.5"
            >
              <CheckCircle2Icon className="h-4 w-4" />
              <span>{t("enable")}</span>
            </DropdownMenuItem>
          )}

          {status === "on" && (
            <>
              <DropdownMenuItem
                onSelect={sendTest}
                disabled={isPending}
                className="rounded-lg cursor-pointer py-2 text-xs font-medium flex items-center gap-2.5"
              >
                <SendIcon className="h-4 w-4 text-muted-foreground" />
                <span>{t("sendTest")}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="-mx-2 my-1" />

              <DropdownMenuItem
                onSelect={turnOff}
                disabled={isPending}
                className="rounded-lg cursor-pointer py-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2.5"
              >
                <BellOffIcon className="h-4 w-4" />
                <span>{t("disable")}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}