// Ambient Background - Gradient Orbs, Grid Pattern, Noise Texture
// ═══════════════════════════════════════════════════════════════════════════

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AmbientBackgroundProps {
  /** Gradient color class (e.g., "from-amber-500 to-orange-600") */
  accentColor?: string;
  /** Show secondary orb */
  showSecondaryOrb?: boolean;
}

export function AmbientBackground({ 
  accentColor = "from-primary to-purple-500",
  showSecondaryOrb = true 
}: AmbientBackgroundProps) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Primary Gradient Orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.08, 0.12] }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={cn(
          "absolute top-1/4 right-1/4 w-[700px] h-[700px]",
          "rounded-full blur-[150px]",
          "bg-gradient-to-br",
          accentColor,
          "opacity-[0.08] dark:opacity-[0.12]"
        )}
      />
      
      {/* Secondary Orb */}
      {showSecondaryOrb && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.04, 0.08] }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] bg-primary/20 dark:bg-primary/40 opacity-[0.04] dark:opacity-[0.08]"
        />
      )}

      {/* Tertiary Accent */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.03, 0.05] }}
        transition={{ delay: 0.8, duration: 1 }}
        className={cn(
          "absolute top-3/4 right-1/3 w-[300px] h-[300px]",
          "rounded-full blur-[100px]",
          "bg-gradient-to-br",
          accentColor,
          "opacity-[0.03] dark:opacity-[0.05]"
        )}
      />

      {/* Grid Pattern Overlay - Adaptive to theme */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette Effect - Only in dark mode */}
      <div 
        className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, hsl(var(--background) / 0.4) 100%)'
        }}
      />
    </div>
  );
}

