"use client";

import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import * as React from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * Switch toggle for the AccountMenu avatar dropdown.
 * Toggles immediately between dark and light with a satisfying switch.
 */
export function AccountThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const t = useTranslations("Account");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-10 items-center justify-between rounded-lg px-2.5 py-2 font-label-md text-label-md text-on-surface-variant">
        <span className="flex items-center gap-2.5">
          <MoonIcon className="size-4 opacity-50" />
          <span>{t("darkMode")}</span>
        </span>
        <div className="h-[18.4px] w-[32px] rounded-full bg-input/40" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        setTheme(isDark ? "light" : "dark");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setTheme(isDark ? "light" : "dark");
        }
      }}
      className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container select-none focus-visible:bg-surface-container focus-visible:outline-none"
    >
      <span className="flex items-center gap-2.5">
        {isDark ? (
          <MoonIcon className="size-4 text-clay" />
        ) : (
          <SunIcon className="size-4 text-on-surface-variant" />
        )}
        <span>{t("darkMode")}</span>
      </span>
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label={t("darkMode")}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/**
 * Full Appearance & Theme configuration section for the /profile page.
 * Offers visual cards for Light / Dark / System and an interactive quick toggle.
 */
export function ProfileAppearanceSection() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const t = useTranslations("Profile.appearance");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const options = [
    {
      id: "light",
      label: t("light"),
      desc: t("lightDesc"),
      icon: SunIcon,
    },
    {
      id: "dark",
      label: t("dark"),
      desc: t("darkDesc"),
      icon: MoonIcon,
    },
    {
      id: "system",
      label: t("system"),
      desc: t("systemDesc"),
      icon: LaptopIcon,
    },
  ] as const;

  const currentTheme = mounted ? theme ?? "system" : "system";
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="space-y-space-md">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("title")}
          </h2>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            {t("body")}
          </p>
        </div>

        {mounted && (
          <div className="flex items-center gap-3 self-start rounded-lg bg-surface-container-low px-3.5 py-2 sm:self-auto">
            <span className="font-label-md text-label-md text-on-surface">
              {t("quickToggle")}
            </span>
            <Switch
              checked={isDark}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              aria-label={t("quickToggle")}
            />
          </div>
        )}
      </div>

      <fieldset>
        <legend className="sr-only">{t("themeLabel")}</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {options.map(({ id, label, desc, icon: Icon }) => {
            const active = currentTheme === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(id)}
                className={cn(
                  "flex flex-col items-start rounded-xl p-4 text-start transition-all",
                  active
                    ? "bg-primary text-on-primary shadow-sm ring-2 ring-primary/30"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container",
                )}
              >
                <div
                  className={cn(
                    "mb-2.5 flex size-9 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-on-primary/15 text-on-primary"
                      : "bg-surface-container text-clay",
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span className="font-label-lg text-label-lg font-medium leading-tight">
                  {label}
                </span>
                <span
                  className={cn(
                    "mt-1 font-body-sm text-body-sm leading-relaxed",
                    active ? "text-on-primary/80" : "text-on-surface-variant",
                  )}
                >
                  {desc}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

/**
 * Compact icon button toggle for headers or mobile drawers.
 */
export function ThemeToggleCompact() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const t = useTranslations("Account");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="size-9 rounded-full bg-surface-container-low" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t("darkMode")}
      className="flex size-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      {isDark ? <MoonIcon className="size-4 text-clay" /> : <SunIcon className="size-4" />}
    </button>
  );
}
