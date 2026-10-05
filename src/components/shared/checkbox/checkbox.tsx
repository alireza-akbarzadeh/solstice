"use client";

import * as React from "react";

import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface SharedCheckboxProps
  extends Omit<React.ComponentProps<typeof ShadcnCheckbox>, "checked" | "onCheckedChange" | "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (checked: boolean) => void;
  invalid?: boolean;
  children?: React.ReactNode;
  labelClassName?: string;
  containerClassName?: string;
}

export function SharedCheckbox({
  id: idProp,
  checked,
  onCheckedChange,
  onChange,
  invalid,
  children,
  className,
  labelClassName,
  containerClassName,
  disabled,
  ...props
}: SharedCheckboxProps) {
  const generatedId = React.useId();
  const id = idProp ?? (children ? generatedId : undefined);

  const handleCheckedChange = React.useCallback(
    (nextVal: boolean | "indeterminate") => {
      const boolVal = nextVal === true;
      onCheckedChange?.(boolVal);
      onChange?.(boolVal);
    },
    [onCheckedChange, onChange],
  );

  const checkboxNode = (
    <ShadcnCheckbox
      id={id}
      checked={checked}
      onCheckedChange={handleCheckedChange}
      disabled={disabled}
      aria-invalid={invalid ? true : undefined}
      className={cn(
        "mt-0.5 shrink-0",
        invalid && "border-error ring-2 ring-error/40",
        className,
      )}
      {...props}
    />
  );

  if (!children) {
    return checkboxNode;
  }

  return (
    <label
      htmlFor={id}
      className={cn(
        "group flex cursor-pointer items-start gap-3 select-none",
        disabled && "cursor-not-allowed opacity-60",
        containerClassName,
      )}
    >
      {checkboxNode}
      <span
        className={cn(
          "font-body-sm text-body-sm text-on-surface-variant transition-colors group-hover:text-on-surface",
          invalid && "text-error",
          labelClassName,
        )}
      >
        {children}
      </span>
    </label>
  );
}

export { SharedCheckbox as Checkbox };
