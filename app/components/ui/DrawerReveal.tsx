import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "~/lib/utils";

interface DrawerRevealContainerProps {
  children: React.ReactNode;
}

export function DrawerRevealContainer({ children }: DrawerRevealContainerProps) {
  return <div className="relative">{children}</div>;
}

interface DrawerRevealSectionProps {
  children: React.ReactNode;
  index: number;
  total: number;
}

export function DrawerRevealSection({
  children,
  index,
  total,
}: DrawerRevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const borderRadius = useTransform(scrollYProgress, [0, 1], [0, 16]);
  const brightness = useTransform(scrollYProgress, [0, 1], [1, 0.6]);

  const isLast = index === total - 1;

  return (
    <div ref={ref} className={cn(isLast ? "h-screen" : "h-[200vh]", "relative", index > 0 && "-mt-[100vh]")} style={{ zIndex: index + 1 }}>
      <motion.div
        className="sticky top-0 h-screen w-full overflow-hidden origin-center"
        style={
          isLast
            ? undefined
            : {
                scale,
                borderRadius,
                filter: useTransform(brightness, (v) => `brightness(${v})`),
              }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
