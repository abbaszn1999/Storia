import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Film, Link as LinkIcon, Video, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NarrativeModeSelectorProps {
  onSelectMode: (mode: "image-reference" | "start-end") => void;
  title?: string;
  description?: string;
  onBack?: () => void;
  isCreating?: boolean;
}

export function NarrativeModeSelector({ 
  onSelectMode, 
  title = "Narrative Mode",
  description = "Choose how to generate your video animations",
  onBack,
  isCreating = false
}: NarrativeModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<"image-reference" | "start-end" | null>(null);

  return (
    <div className="min-h-screen w-full relative overflow-auto bg-gradient-to-br from-[#0a1628] via-[#0d1b2a] to-[#1b263b]">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Content - Centered and Scrollable */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-8 py-6">
          {/* Header with animated icon */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-3 md:space-y-4"
          >
            {/* Video Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2
              }}
              className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-xl"
            >
              <Video className="w-7 h-7 md:w-8 md:h-8 text-purple-400" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-1.5 md:space-y-2"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                {title}
              </h1>
              <p className="text-white/50 text-sm sm:text-base max-w-2xl mx-auto px-4">
                {description}
              </p>
            </motion.div>
          </motion.div>

          {/* Mode Cards */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-5 px-2">
            {/* Image-Reference Mode */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              onHoverStart={() => setHoveredMode("image-reference")}
              onHoverEnd={() => setHoveredMode(null)}
            >
              <Card 
                className={cn(
                  "h-full bg-[#1a2332]/80 backdrop-blur-xl border transition-all duration-300",
                  hoveredMode === "image-reference" 
                    ? "border-purple-500/50 shadow-2xl shadow-purple-500/20 scale-[1.02]" 
                    : "border-[#2d3c52]/50"
                )}
              >
                <CardContent className="p-5 md:p-6 space-y-4 md:space-y-5 h-full flex flex-col">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className="p-2.5 md:p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                      <Film className="h-7 w-7 md:h-8 md:w-8 text-purple-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2 md:space-y-2.5 flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-white">
                      Image Reference Mode
                    </h3>
                    <p className="text-white/60 leading-relaxed text-xs md:text-sm">
                      Generate video from a single reference image. The AI will animate the scene based on your motion prompts
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2.5 text-xs md:text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                      <span className="text-white/70">Single image input</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs md:text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                      <span className="text-white/70">Natural animation</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs md:text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                      <span className="text-white/70">Simpler workflow</span>
                    </div>
                  </div>

                  {/* Button */}
                  <Button 
                    className="w-full h-10 md:h-11 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 border-0"
                    onClick={() => onSelectMode("image-reference")} 
                    data-testid="button-select-image-reference"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span>Use Image Reference</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Start-End Frame Mode */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              onHoverStart={() => setHoveredMode("start-end")}
              onHoverEnd={() => setHoveredMode(null)}
            >
              <Card 
                className={cn(
                  "h-full bg-[#1a2332]/80 backdrop-blur-xl border transition-all duration-300",
                  hoveredMode === "start-end" 
                    ? "border-pink-500/50 shadow-2xl shadow-pink-500/20 scale-[1.02]" 
                    : "border-[#2d3c52]/50"
                )}
              >
                <CardContent className="p-5 md:p-6 space-y-4 md:space-y-5 h-full flex flex-col">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className="p-2.5 md:p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 border border-pink-500/30">
                      <LinkIcon className="h-7 w-7 md:h-8 md:w-8 text-pink-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2 md:space-y-2.5 flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-white">
                      Start/End Frame Mode
                    </h3>
                    <p className="text-white/60 leading-relaxed text-xs md:text-sm">
                      Define both starting and ending frames. The AI will create smooth transitions between the two states
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2.5 text-xs md:text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                      <span className="text-white/70">Two image inputs</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs md:text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                      <span className="text-white/70">Controlled transitions</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs md:text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                      <span className="text-white/70">Precise animation</span>
                    </div>
                  </div>

                  {/* Button */}
                  <Button 
                    className="w-full h-10 md:h-11 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white text-sm font-semibold transition-all shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 border-0"
                    onClick={() => onSelectMode("start-end")} 
                    data-testid="button-select-start-end"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span>Use Start/End Frames</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="text-center px-4"
          >
            <p className="text-xs md:text-sm text-white/40">
              You can't change the mode once workflow starts. Choose carefully!
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
