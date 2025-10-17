import clsx from "clsx";
import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  elevation?: "none" | "sm" | "md" | "lg";
};

export function Card({ children, className, padding = true, elevation = "md" }: CardProps) {
  let elevationClass = "";
  if (elevation === "sm") elevationClass = "shadow-sm";
  else if (elevation === "md") elevationClass = "shadow-md";
  else if (elevation === "lg") elevationClass = "shadow-lg";
  return (
    <div
      className={clsx(
        "bg-background rounded-lg border border-border",
        padding && "p-6",
        elevationClass,
        className
      )}
    >
      {children}
    </div>
  );
}
