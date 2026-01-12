// ASMR Model Selector - Rich Dropdown with Model Info

import { motion } from "framer-motion";
import { ChevronDown, Volume2, Clock, Maximize, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VIDEO_MODELS, type VideoModelConfig } from "@/constants/asmr-presets";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  selectedModelInfo: VideoModelConfig;
}

export function ModelSelector({ value, onChange, selectedModelInfo }: ModelSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground/80">
        Video Model
      </label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className={cn(
            "w-full h-auto py-2.5 px-3",
            "bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-border",
            "hover:bg-muted dark:hover:bg-white/[0.05] hover:border-primary",
            "focus:ring-1 focus:ring-primary/40",
            "transition-all duration-200"
          )}
        >
          <div className="flex items-center gap-2.5 w-full">
            {/* Model Icon/Badge */}
            <div className={cn(
              "flex-shrink-0 w-7 h-7 rounded-md",
              "bg-gradient-to-br from-primary/20 to-purple-500/20",
              "flex items-center justify-center",
              "border border-primary/20"
            )}>
              <span className="text-[10px] font-bold text-primary">
                {selectedModelInfo.label.charAt(0)}
              </span>
            </div>

            {/* Model Info */}
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs font-medium text-foreground truncate">
                {selectedModelInfo.label}
              </div>
              <div className="text-[10px] text-muted-foreground/70 truncate">
                {selectedModelInfo.description}
              </div>
            </div>

            {/* Audio Badge */}
            {selectedModelInfo.generatesAudio && (
              <div className={cn(
                "flex-shrink-0 px-1.5 py-0.5 rounded",
                "bg-emerald-500/20 border border-emerald-500/30",
                "flex items-center gap-1"
              )}>
                <Volume2 className="h-2.5 w-2.5 text-emerald-400" />
                <span className="text-[9px] font-medium text-emerald-400">Audio</span>
              </div>
            )}
          </div>
        </SelectTrigger>

        <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-[#e5e7eb] dark:border-border">
          {VIDEO_MODELS.map((model) => (
            <SelectItem
              key={model.value}
              value={model.value}
              className={cn(
                "py-3 px-3 cursor-pointer",
                "focus:bg-muted/50 dark:focus:bg-white/[0.06]",
                "data-[state=checked]:bg-primary/10"
              )}
            >
              <div className="flex items-start gap-3 w-full">
                {/* Model Badge */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg mt-0.5",
                  "bg-gradient-to-br",
                  model.value === value 
                    ? "from-primary/30 to-purple-500/30 border-primary/30" 
                    : "from-muted/30 to-muted/50 dark:from-white/5 dark:to-white/10 border-[#e5e7eb] dark:border-border",
                  "flex items-center justify-center",
                  "border"
                )}>
                  <span className={cn(
                    "text-xs font-bold",
                    model.value === value ? "text-primary" : "text-muted-foreground"
                  )}>
                    {model.label.charAt(0)}
                  </span>
                </div>

                {/* Model Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {model.label}
                    </span>
                    {model.default && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {model.description}
                  </p>
                  
                  {/* Capabilities */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {/* Duration Options */}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                      <Clock className="h-3 w-3" />
                      {model.durations.join(", ")}s
                    </div>
                    
                    {/* Resolutions */}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                      <Maximize className="h-3 w-3" />
                      {model.resolutions.join(", ")}
                    </div>

                    {/* Audio */}
                    {model.generatesAudio && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <Volume2 className="h-3 w-3" />
                        Native Audio
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Check */}
                {model.value === value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Audio Indicator */}
      {selectedModelInfo.generatesAudio && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
        >
          <Volume2 className="h-4 w-4 text-emerald-400" />
          <span className="text-xs text-emerald-400">
            This model generates audio automatically
          </span>
        </motion.div>
      )}
    </div>
  );
}

