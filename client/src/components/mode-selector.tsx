import { Video, MessageSquare, Sparkles, Mic, ShoppingBag, Clapperboard, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const modes = [
  {
    id: "narrative",
    title: "Narrative Video",
    description: "Create story-driven videos from script to storyboard",
    icon: Video,
    available: true,
    iconColor: "text-blue-500",
  },
  {
    id: "vlog",
    title: "Character Vlog",
    description: "Create story-driven videos starring a single character",
    icon: MessageSquare,
    available: true,
    iconColor: "text-purple-500",
  },
  {
    id: "ambient",
    title: "Ambient Visual",
    description: "Mood-driven visual storytelling",
    icon: Sparkles,
    available: true,
    iconColor: "text-indigo-500",
  },
  {
    id: "commerce",
    title: "Social Commerce",
    description: "Product showcase and promotional videos",
    icon: ShoppingBag,
    available: true,
    iconColor: "text-orange-500",
  },
  {
    id: "logo",
    title: "Logo Animation",
    description: "Brand storytelling through motion",
    icon: Clapperboard,
    available: true,
    iconColor: "text-violet-500",
  },
  {
    id: "podcast",
    title: "Video Podcast",
    description: "Conversation-style content creation",
    icon: Mic,
    available: false,
    iconColor: "text-gray-400",
  },
];

interface ModeSelectorProps {
  onSelect: (modeId: string) => void;
  selectedMode?: string | null;
}

export function ModeSelector({ onSelect, selectedMode }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {modes.map((mode, index) => {
        const isSelected = selectedMode === mode.id;
        const Icon = mode.icon;
        
        return (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={cn(
              "group relative cursor-pointer rounded-2xl overflow-hidden",
              "bg-card backdrop-blur-xl",
              "border-0",
              "transition-all duration-300",
              !mode.available && "opacity-40 cursor-not-allowed"
            )}
            onClick={() => mode.available && onSelect(mode.id)}
            data-testid={`card-mode-${mode.id}`}
          >
            {/* Hover Glow */}
            {isSelected && (
              <div className="absolute -inset-0.5 rounded-2xl bg-primary/20 blur-sm" />
            )}
            
            {/* Card Header with Icon */}
            <div className={cn(
              "relative h-32 flex items-center justify-center overflow-hidden",
              "bg-muted/50"
            )}>
              {/* Floating Icon */}
              <motion.div 
                className={cn(
                  "relative z-10 w-16 h-16 rounded-2xl",
                  "bg-background",
                  "flex items-center justify-center",
                  "shadow-md border border-border/50"
                )}
                animate={isSelected ? { 
                  y: [-2, 2, -2],
                  rotate: [0, 2, -2, 0]
                } : {}}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <Icon className={cn("h-8 w-8", mode.iconColor)} />
              </motion.div>

              {/* Selection indicator */}
              {isSelected && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </div>

            {/* Card Content */}
            <div className="p-5 pt-4">
              {/* Title */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className={cn(
                  "text-lg font-bold transition-colors",
                  isSelected ? "text-foreground" : "text-foreground"
                )}>
                  {mode.title}
                </h3>
                {!mode.available && (
                  <span className="text-xs text-muted-foreground shrink-0">Coming soon</span>
                )}
              </div>
              
              {/* Description */}
              <p className={cn(
                "text-sm leading-relaxed",
                "text-muted-foreground"
              )}>
                {mode.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
