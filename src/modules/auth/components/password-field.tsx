"use client";

import { EyeIcon, EyeOffIcon, KeyRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/lib/utils";

// 0–4: length, then variety of character classes.
function strengthOf(password: string) {
  if (password.length < 8) return 0;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  return Math.min(4, Math.max(1, classes + (password.length >= 12 ? 1 : 0) - 1)) as 1 | 2 | 3 | 4;
}

const barTone = ["bg-error", "bg-tertiary-container", "bg-secondary-fixed-dim", "bg-primary-container", "bg-primary"];

export function PasswordField({
  id,
  name = "password",
  label,
  autoComplete,
  showStrength = false,
  trailing,
}: {
  id: string;
  /** Form field name; defaults to "password". */
  name?: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  showStrength?: boolean;
  /** Rendered beside the label, e.g. a "forgot password" link. */
  trailing?: React.ReactNode;
}) {
  const t = useTranslations("Auth");
  const tSignUp = useTranslations("Auth.signUp");
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const strength = strengthOf(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block font-label-md text-label-md text-on-surface">
          {label}
        </label>
        {trailing}
      </div>
      <div className="relative rounded-lg bg-surface-container transition-all duration-200 focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/20">
        <KeyRoundIcon aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={8}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby={showStrength ? `${id}-strength` : undefined}
          className="w-full rounded-lg bg-transparent py-3.5 ps-11 pe-11 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          aria-pressed={visible}
          className="absolute end-3.5 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-on-surface"
        >
          {visible ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
        </button>
      </div>
      {showStrength && (
        <div id={`${id}-strength`} className="mt-1 flex items-center justify-between gap-3" aria-live="polite">
          <div className="flex w-2/3 items-center gap-1.5" aria-hidden>
            {[1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-300",
                  value && strength >= bar ? barTone[strength] : "bg-surface-variant",
                  value && strength === 0 && bar === 1 && barTone[0],
                )}
              />
            ))}
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {value ? tSignUp(`strength.${strength}`) : tSignUp("passwordHint")}
          </span>
        </div>
      )}
    </div>
  );
}
