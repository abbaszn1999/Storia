// ASMR / Sensory Video Generator - Immersive Split Screen UI

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  useASMRGenerator, 
  ControlPanel, 
  Viewport 
} from "@/components/asmr";

// Category color mapping for ambient effects
const categoryColors: Record<string, string> = {
  food: "from-orange-500 to-amber-500",
  triggers: "from-violet-500 to-purple-500",
  nature: "from-emerald-500 to-green-500",
  crafts: "from-pink-500 to-rose-500",
  unboxing: "from-sky-500 to-blue-500",
};

export default function ASMRGenerator() {
  const [state, actions] = useASMRGenerator();

  const categoryColor = state.selectedCategory 
    ? categoryColors[state.selectedCategory.id] || "from-primary to-purple-500"
    : "from-primary to-purple-500";

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Ambient Background Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orb */}
        <motion.div
          key={state.selectedCategory?.id || "default"}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 1 }}
          className={cn(
            "absolute top-1/4 right-1/4 w-[600px] h-[600px]",
            "rounded-full blur-[120px]",
            "bg-gradient-to-br",
            categoryColor
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
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
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
      <div className="flex-1 relative flex flex-col">
        {/* Top Bar */}
        <div className="flex-shrink-0 h-14 px-6 flex items-center justify-between border-b border-[#e5e7eb] dark:border-border">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Preview</span>
            {state.selectedCategory && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  "bg-gradient-to-r",
                  categoryColor,
                  "bg-opacity-20",
                  "border border-[#e5e7eb] dark:border-border"
                )}
                style={{ 
                  background: `linear-gradient(135deg, ${categoryColor.includes('orange') ? 'rgba(249,115,22,0.2)' : 'rgba(139,92,246,0.2)'}, transparent)`,
                }}
              >
                {state.selectedCategory.name}
              </motion.span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
            <span>{state.aspectRatio}</span>
            <span>•</span>
            <span>{state.resolution}</span>
            <span>•</span>
            <span>{state.duration}s</span>
          </div>
        </div>

        {/* Viewport */}
        <Viewport
          aspectRatio={state.aspectRatio}
          isGenerating={state.isGenerating}
          generationStatus={state.generationStatus}
          generationProgress={state.generationProgress}
          generatedVideoUrl={state.generatedVideoUrl}
          generatedAudioUrl={state.generatedAudioUrl}
          audioSource={state.audioSource}
          referenceImage={state.referenceImage}
          isGeneratingImage={state.isGeneratingImage}
          categoryColor={categoryColor}
        />

        {/* Bottom Bar - Tips */}
        <div className="flex-shrink-0 h-12 px-6 flex items-center justify-center border-t border-[#e5e7eb] dark:border-border">
          <p className="text-xs text-muted-foreground/40 text-center">
            {state.isGenerating 
              ? "AI is crafting your ASMR video. This may take a few moments..."
              : state.generatedVideoUrl
                ? "Your video is ready! Click Export to save or share."
                : "Select a style, customize your settings, and generate your ASMR video"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
