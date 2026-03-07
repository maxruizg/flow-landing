import { cn } from "~/lib/utils";
import { useMagneticEffect } from "~/hooks/useMagneticEffect";
import type { ButtonHTMLAttributes } from "react";

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number;
}

export function MagneticButton({
  children,
  className,
  strength = 0.3,
  ...props
}: MagneticButtonProps) {
  const { ref, handleMouseMove, handleMouseLeave } = useMagneticEffect(strength);

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "inline-flex items-center justify-center font-display font-medium tracking-wide uppercase transition-colors duration-300",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
