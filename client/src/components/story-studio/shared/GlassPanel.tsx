// Glass Panel - Reusable Glassmorphism Container
// ═══════════════════════════════════════════════════════════════════════════

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  /** Panel variant */
  variant?: "default" | "subtle" | "solid";
  /** Add glow effect on hover */
  glowOnHover?: boolean;
  /** Custom glow color */
  glowColor?: string;
  /** No padding */
  noPadding?: boolean;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ 
    className, 
    variant = "default", 
    glowOnHover = false,
    glowColor = "primary",
    noPadding = false,
    children,
    ...props 
  }, ref) => {
    const variants = {
      default: "bg-card/80 dark:bg-black/40 backdrop-blur-xl border-[#e5e7eb] dark:border-border",
      subtle: "bg-muted/60 dark:bg-black/20 backdrop-blur-lg border-[#e5e7eb] dark:border-border",
      solid: "bg-card dark:bg-[#111111] border-[#e5e7eb] dark:border-border",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-2xl border overflow-hidden",
          variants[variant],
          !noPadding && "p-5",
          glowOnHover && "transition-shadow duration-300 hover:shadow-lg",
          glowOnHover && glowColor === "primary" && "hover:shadow-primary/20",
          glowOnHover && glowColor === "orange" && "hover:shadow-orange-500/20",
          glowOnHover && glowColor === "violet" && "hover:shadow-violet-500/20",
          glowOnHover && glowColor === "blue" && "hover:shadow-blue-500/20",
          glowOnHover && glowColor === "rose" && "hover:shadow-rose-500/20",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassPanel.displayName = "GlassPanel";

