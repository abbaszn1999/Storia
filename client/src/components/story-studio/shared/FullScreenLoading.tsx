// Full Screen Loading Overlay
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Mic, Film, Sparkles } from "lucide-react";

interface FullScreenLoadingProps {
  isVisible: boolean;
  title: string;
  description?: string;
  progress?: number;
  currentStep?: string;
  totalSteps?: number;
  icon?: 'mic' | 'film' | 'sparkles';
  accentColor?: string;
}

export function FullScreenLoading({
  isVisible,
  title,
  description,
  progress = 0,
  currentStep,
  totalSteps,
  icon = 'mic',
  accentColor = 'primary',
}: FullScreenLoadingProps) {
  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  const IconComponent = {
    mic: Mic,
    film: Film,
    sparkles: Sparkles,
  }[icon];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center"
        >
          <div className="text-center space-y-8 max-w-md px-6">
            {/* Animated Icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={cn(
                "w-24 h-24 mx-auto rounded-full",
                "bg-gradient-to-br flex items-center justify-center",
                "shadow-2xl",
                accentClasses
              )}
            >
              <IconComponent className="w-12 h-12 text-white" />
            </motion.div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">
                {title}
              </h2>
              {description && (
                <p className="text-white/60 text-lg">
                  {description}
                </p>
              )}
              {currentStep && totalSteps && (
                <p className="text-white/50 text-sm">
                  Step {currentStep}/{totalSteps}
                </p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full space-y-3">
              <Progress 
                value={progress} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">
                  {Math.round(progress)}% complete
                </span>
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-white/60"
                >
                  Please wait...
                </motion.span>
              </div>
            </div>

            {/* Animated Dots */}
            <motion.div
              className="flex items-center justify-center gap-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    "bg-gradient-to-r",
                    accentClasses
                  )}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

