import { cn } from "~/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-display font-medium tracking-wide uppercase transition-all duration-300",
        {
          "bg-white text-flow-black hover:bg-flow-200": variant === "primary",
          "bg-flow-800 text-white hover:bg-flow-700": variant === "secondary",
          "border border-flow-400 text-flow-100 hover:bg-white hover:text-flow-black":
            variant === "outline",
        },
        {
          "px-4 py-2 text-xs": size === "sm",
          "px-6 py-3 text-sm": size === "md",
          "px-8 py-4 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
