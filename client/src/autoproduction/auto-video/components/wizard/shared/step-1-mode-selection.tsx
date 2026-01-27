import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Video, MessageSquare, Sparkles, ShoppingBag, Clapperboard, Mic } from "lucide-react";
import type { VideoMode } from "../../../types";
import { VIDEO_MODES } from "../../../types";

// Map icon strings to actual icon components
const ICON_MAP = {
  Video,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Clapperboard,
  Mic,
};

interface Step1ModeSelectionProps {
  value: VideoMode;
  onChange: (mode: VideoMode) => void;
}

export function Step1ModeSelection({ value, onChange }: Step1ModeSelectionProps) {
  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.div
            className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Video className="h-8 w-8 text-violet-500" />
          </motion.div>
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-pink-500"
        >
          Choose Your Video Mode
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-xl mx-auto"
        >
          Select the type of video you want to create. Each mode has different settings and workflows.
        </motion.p>
      </div>

      {/* Mode Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {VIDEO_MODES.map((mode, index) => {
          const isSelected = value === mode.id;
          const Icon = ICON_MAP[mode.icon as keyof typeof ICON_MAP] || Sparkles;

          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              whileHover={mode.available ? { y: -4, transition: { duration: 0.2 } } : undefined}
              className={cn(
                "group relative cursor-pointer rounded-2xl overflow-hidden",
                "bg-card backdrop-blur-xl",
                "border-2 transition-all duration-300",
                isSelected && "border-primary shadow-lg shadow-primary/20",
                !isSelected && mode.available && "border-transparent hover:border-primary/30",
                !mode.available && "opacity-50 cursor-not-allowed border-transparent"
              )}
              onClick={() => mode.available && onChange(mode.id)}
            >
              {/* Selection glow effect */}
              {isSelected && (
                <div className="absolute -inset-0.5 rounded-2xl bg-primary/20 blur-sm" />
              )}

              {/* Card Header with Icon */}
              <div
                className={cn(
                  "relative h-28 flex items-center justify-center overflow-hidden",
                  "bg-muted/50"
                )}
              >
                {/* Floating Icon */}
                <motion.div
                  className={cn(
                    "relative z-10 w-14 h-14 rounded-xl",
                    "bg-background",
                    "flex items-center justify-center",
                    "shadow-md border border-border/50"
                  )}
                  animate={
                    isSelected
                      ? {
                          y: [-2, 2, -2],
                          rotate: [0, 2, -2, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Icon className={cn("h-7 w-7", mode.iconColor)} />
                </motion.div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </motion.div>
                )}

                {/* Coming Soon Badge */}
                {!mode.available && (
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    Coming Soon
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="relative p-4 pt-3">
                {/* Title */}
                <h3
                  className={cn(
                    "text-base font-bold transition-colors mb-1",
                    isSelected ? "text-foreground" : "text-foreground"
                  )}
                >
                  {mode.title}
                </h3>

                {/* Description */}
                <p className={cn("text-sm leading-relaxed", "text-muted-foreground")}>
                  {mode.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-2xl mx-auto"
      >
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">Ambient Visual</span> is currently available. 
            More video modes are coming soon!
          </p>
        </div>
      </motion.div>
    </div>
  );
}
