import { Video, MessageSquare, Sparkles, Mic, ShoppingBag, Clapperboard, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const modes = [
  {
    id: "narrative",
    title: "Narrative Video",
    description: "Create story-driven videos from script to storyboard",
    icon: Video,
    available: true,
  },
  {
    id: "vlog",
    title: "Character Vlog",
    description: "Create story-driven videos starring a single character",
    icon: MessageSquare,
    available: true,
  },
  {
    id: "ambient",
    title: "Ambient Visual",
    description: "Mood-driven visual storytelling",
    icon: Sparkles,
    available: true,
  },
  {
    id: "commerce",
    title: "Social Commerce",
    description: "Product showcase and promotional videos",
    icon: ShoppingBag,
    available: true,
  },
  {
    id: "logo",
    title: "Logo Animation",
    description: "Brand storytelling through motion",
    icon: Clapperboard,
    available: true,
  },
  {
    id: "podcast",
    title: "Video Podcast",
    description: "Conversation-style content creation",
    icon: Mic,
    available: false,
  },
];

interface ModeSelectorProps {
  onSelect: (modeId: string) => void;
  selectedMode?: string | null;
}

export function ModeSelector({ onSelect, selectedMode }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {modes.map((mode) => {
        const isSelected = selectedMode === mode.id;
        
        return (
          <div
            key={mode.id}
            className={cn(
              "group relative cursor-pointer rounded-xl border p-4 transition-all",
              mode.available
                ? isSelected
                  ? "border-primary bg-primary/10"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                : "opacity-40 cursor-not-allowed border-white/5 bg-white/[0.01]"
            )}
            onClick={() => mode.available && onSelect(mode.id)}
            data-testid={`card-mode-${mode.id}`}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            
            {/* Icon and Title Row */}
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "p-2.5 rounded-xl transition-colors",
                mode.available
                  ? isSelected
                    ? "bg-primary text-white"
                    : "bg-primary/20 text-primary group-hover:bg-primary/30"
                  : "bg-white/5 text-white/30"
              )}>
                <mode.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className={cn(
                  "font-semibold transition-colors",
                  isSelected ? "text-white" : "text-white/90"
                )}>
                  {mode.title}
                </h3>
                {!mode.available && (
                  <span className="text-xs text-white/40">Coming soon</span>
                )}
              </div>
            </div>
            
            {/* Description */}
            <p className={cn(
              "text-sm leading-relaxed",
              isSelected ? "text-white/70" : "text-white/50"
            )}>
              {mode.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
