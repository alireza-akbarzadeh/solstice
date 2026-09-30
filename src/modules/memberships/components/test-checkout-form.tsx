"use client";

import { CreditCardIcon, LoaderCircleIcon, LockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { completeTestCheckout } from "../test-actions";

const groups = (digits: string) => digits.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

function PayButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-label-lg text-label-lg text-on-primary shadow-md transition-colors hover:bg-primary-container disabled:opacity-80"
    >
      {pending ? <LoaderCircleIcon className="size-4 animate-spin" /> : <LockIcon className="size-4" />}
      {label}
    </button>
  );
}

export function TestCheckoutForm({
  plan,
  success,
  cancel,
  cards,
  payLabel,
}: {
  plan: string;
  success: string;
  cancel: string;
  cards: { approved: string; declined: string };
  payLabel: string;
}) {
  const t = useTranslations("TestMode.checkout");
  const [card, setCard] = useState(groups(cards.approved));

  const presets = [
    { id: "approved", number: cards.approved },
    { id: "declined", number: cards.declined },
  ] as const;

  return (
    <form action={completeTestCheckout} className="flex flex-col gap-5">
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="success" value={success} />
      <input type="hidden" name="cancel" value={cancel} />

      <div className="space-y-2">
        <p className="font-label-md text-label-md tracking-widest text-clay uppercase">{t("cardsTitle")}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {presets.map((preset) => {
            const active = card.replace(/\s/g, "") === preset.number;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setCard(groups(preset.number))}
                aria-pressed={active}
                className={cn(
                  "rounded-lg p-3 text-start transition-colors",
                  active ? "bg-primary-fixed ring-1 ring-primary" : "bg-surface-container-low hover:bg-surface-container",
                )}
              >
                <span className="block font-label-lg text-label-lg text-on-surface">{t(`cards.${preset.id}`)}</span>
                <span dir="ltr" className="block font-body-sm text-body-sm text-on-surface-variant tabular-nums">
                  {groups(preset.number)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="block space-y-1.5">
        <span className="font-label-md text-label-md text-on-surface">{t("cardNumber")}</span>
        <span className="relative block">
          <CreditCardIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-outline" />
          <Input
            name="card"
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            value={card}
            onChange={(e) => setCard(groups(e.target.value))}
            className="h-11 ps-9 tabular-nums"
            required
          />
        </span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="font-label-md text-label-md text-on-surface">{t("expiry")}</span>
          <Input dir="ltr" defaultValue="12 / 34" autoComplete="off" className="h-11" />
        </label>
        <label className="block space-y-1.5">
          <span className="font-label-md text-label-md text-on-surface">{t("cvc")}</span>
          <Input dir="ltr" defaultValue="123" autoComplete="off" className="h-11" />
        </label>
      </div>

      <PayButton label={payLabel} />
      <a href={cancel} className="text-center font-label-md text-label-md text-on-surface-variant underline-offset-4 hover:text-primary hover:underline">
        {t("cancel")}
      </a>
    </form>
  );
}
