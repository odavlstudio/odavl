import clsx from "clsx";
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "block w-full rounded-lg border bg-background px-3 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50 disabled:pointer-events-none",
        error ? "border-red-500 focus:ring-red-500" : "border-border",
        className
      )}
      aria-invalid={error}
      {...props}
    />
  )
);
Input.displayName = "Input";
