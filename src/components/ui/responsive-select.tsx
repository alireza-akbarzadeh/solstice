"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import * as React from "react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type ResponsiveSelectOption = { value: string; label: string; description?: string };

/**
 * A dropdown on desktop, a bottom sheet of full-width rows on phones — where a popover list is
 * fiddly and a sheet is what a native app would show. Options are passed as data rather than
 * children so both branches render from one source.
 */
export function ResponsiveSelect({
  value,
  onValueChange,
  options,
  label,
  placeholder,
  id,
  className,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly ResponsiveSelectOption[];
  /** Names the control for assistive tech, and titles the sheet on phones. */
  label: string;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id} aria-label={label} className={cn("w-full bg-surface-container/60 border-outline-variant/40", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        id={id}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-outline-variant/40 bg-surface px-3 text-start font-body-sm text-body-sm text-on-surface shadow-xs transition-colors disabled:opacity-50",
          className,
        )}
      >
        <span className={cn("truncate", !selected && "text-outline")}>{selected?.label ?? placeholder ?? label}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-on-surface-variant" />
      </DrawerTrigger>
      <DrawerContent className="pb-safe">
        <DrawerHeader className="text-start border-b border-outline-variant/20 pb-3">
          <DrawerTitle className="font-headline-sm text-headline-sm">{label}</DrawerTitle>
        </DrawerHeader>
        <ul className="max-h-[50svh] overflow-y-auto overscroll-contain p-2 space-y-1">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start transition-colors",
                    active ? "bg-primary-fixed/40 text-primary font-medium" : "text-on-surface active:bg-surface-container",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-body-md text-body-md">{option.label}</span>
                    {option.description && <span className="block truncate font-body-sm text-body-sm text-on-surface-variant">{option.description}</span>}
                  </span>
                  {active && <CheckIcon className="size-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}
