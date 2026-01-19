// Social Commerce Studio Background - Gradient orbs with commerce theme
// ═══════════════════════════════════════════════════════════════════════════

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SocialCommerceStudioBackgroundProps {
  showSecondaryOrb?: boolean;
}

export function SocialCommerceStudioBackground({ 
  showSecondaryOrb = true 
}: SocialCommerceStudioBackgroundProps) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Primary Gradient Orb - Emerald/Teal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.12, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={cn(
          "absolute top-1/4 right-1/4 w-[700px] h-[700px]",
          "rounded-full blur-[150px]",
          "bg-gradient-to-br from-emerald-500 to-teal-600"
        )}
      />
      
      {/* Secondary Orb - Teal */}
      {showSecondaryOrb && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] bg-teal-600/40"
        />
      )}

      {/* Tertiary Accent - Emerald */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ delay: 0.8, duration: 1 }}
        className={cn(
          "absolute top-3/4 right-1/3 w-[300px] h-[300px]",
          "rounded-full blur-[100px]",
          "bg-gradient-to-br from-emerald-400 to-teal-500"
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

