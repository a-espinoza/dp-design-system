import * as React from "react";

import { cn } from "./utils";

type FieldProps = {
  label: string;
  htmlFor?: string;
  helper?: string;
  className?: string;
  children: React.ReactNode;
};

// Label (`text-2xs` uppercase) ABOVE the input, with optional helper text
// in ink-soft below. See docs/DESIGN.md → Component conventions.
export function Field({ label, htmlFor, helper, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-soft"
      >
        {label}
      </label>
      {children}
      {helper ? (
        <p className="text-xs text-ink-soft">{helper}</p>
      ) : null}
    </div>
  );
}

// Baseline styled input — full warm-soft border, paper bg, radius-sm.
// Pair with `<Field />` for the label + helper rhythm.
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-9 w-full rounded-sm border border-border-soft bg-paper px-3 text-sm text-foreground outline-none transition-colors duration-[120ms] ease-out placeholder:text-ink-soft focus-visible:border-dp-cyan focus-visible:ring-2 focus-visible:ring-dp-cyan/30 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
