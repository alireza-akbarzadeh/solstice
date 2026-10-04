"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Link, useRouter } from "@/i18n/navigation";

const EVERY_MS = 2000;
const TRIES = 15;

/**
 * Shown while a provider's confirmation is on its way (webhooks can lag a few seconds behind
 * the member's return). Re-renders the page every two seconds; after half a minute it stops
 * and says what to do, since the membership will still start when the webhook arrives.
 */
export function PaymentPending() {
  const t = useTranslations("Membership.welcome.pending");
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (tries >= TRIES) return;
    const timer = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, EVERY_MS);
    return () => clearTimeout(timer);
  }, [tries, router]);

  const slow = tries >= TRIES;
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 text-center">
      {!slow && <LoaderCircleIcon aria-hidden className="size-8 animate-spin text-primary motion-reduce:animate-none" />}
      <h1 className="font-headline-md text-headline-md text-primary">{t(slow ? "slowTitle" : "title")}</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">{t(slow ? "slowBody" : "body")}</p>
      {slow && (
        <Link href="/profile" className="font-label-lg text-label-lg text-primary underline-offset-4 hover:underline">
          {t("profile")}
        </Link>
      )}
    </div>
  );
}
