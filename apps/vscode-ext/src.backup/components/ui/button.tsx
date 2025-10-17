import { motion } from "framer-motion";
import type { MotionProps } from "framer-motion";
import clsx from "clsx";
import { forwardRef, type ButtonHTMLAttributes, type PropsWithChildren } from "react";

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-6 text-lg",
};


type Variant = keyof typeof variants;
type Size = keyof typeof sizes;
type ButtonProps = PropsWithChildren<Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps> & MotionProps> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
};


export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      loading,
      icon,
      children,
      ...props
    }: ButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>
  ) => {
    return (
      <motion.button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none gap-2",
          variants[variant as Variant],
          sizes[size as Size],
          className
        )}
        whileTap={{ scale: 0.97 }}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <span className="animate-spin mr-2 w-4 h-4 border-2 border-t-transparent border-white rounded-full"></span>
        )}
        {icon}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
