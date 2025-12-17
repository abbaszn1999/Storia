// Narrative Studio Background - Purple/Pink Gradient Orbs, Grid Pattern, Noise Texture
// ═══════════════════════════════════════════════════════════════════════════

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NarrativeStudioBackgroundProps {
  /** Show secondary orb */
  showSecondaryOrb?: boolean;
}

export function NarrativeStudioBackground({ 
  showSecondaryOrb = true 
}: NarrativeStudioBackgroundProps) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Primary Gradient Orb - Purple/Pink */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.12, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={cn(
          "absolute top-1/4 right-1/4 w-[700px] h-[700px]",
          "rounded-full blur-[150px]",
          "bg-gradient-to-br from-purple-500 to-pink-500"
        )}
      />
      
      {/* Secondary Orb - Pink */}
      {showSecondaryOrb && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] bg-pink-500/40"
        />
      )}

      {/* Tertiary Accent - Purple */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ delay: 0.8, duration: 1 }}
        className={cn(
          "absolute top-3/4 right-1/3 w-[300px] h-[300px]",
          "rounded-full blur-[100px]",
          "bg-gradient-to-br from-pink-500 to-purple-400"
        )}
      />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette Effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
        }}
      />
    </div>
  );
}

