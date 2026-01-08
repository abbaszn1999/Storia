// Logo Animation Generator - Simple Single-Page UI

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  useLogoGenerator, 
  ControlPanel, 
  Viewport 
} from "@/components/logo-animation";

export default function LogoAnimation() {
  const [state, actions] = useLogoGenerator();

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0a0a0a]">
      {/* Ambient Background Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 1 }}
          className={cn(
            "absolute top-1/4 right-1/4 w-[600px] h-[600px]",
            "rounded-full blur-[120px]",
            "bg-gradient-to-br from-primary to-purple-600"
          )}
        />
        
        {/* Secondary Orb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full blur-[100px] bg-primary/30"
        />

        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Noise Texture */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Left Panel - Controls */}
      <ControlPanel state={state} actions={actions} />

      {/* Right Panel - Viewport */}
      <Viewport
        aspectRatio={state.aspectRatio}
        isGenerating={state.isGenerating}
        generationStatus={state.generationStatus}
        generationProgress={state.generationProgress}
        generatedVideoUrl={state.generatedVideoUrl}
        referenceImage={state.referenceImage}
      />
    </div>
  );
}

