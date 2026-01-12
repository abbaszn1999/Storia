// Video Model Selector - Rich Dropdown with Model Info
// ═══════════════════════════════════════════════════════════════════════════

import { motion } from "framer-motion";
import { Video, Check, Clock, Maximize, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  VIDEO_MODELS, 
  getVideoModelConfig, 
  VIDEO_RESOLUTION_LABELS, 
  getVideoModelsByAspectRatio,
  requiresMatchingDimensions,
  isImageModelCompatibleWithVideoModel,
  getVideoDimensionsForImageGeneration,
  type VideoModelConfig 
} from "@/constants/video-models";

interface VideoModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  selectedModelInfo: VideoModelConfig;
  aspectRatio?: string; // Filter models by aspect ratio
  imageModel?: string; // Image model ID for compatibility checking
  videoResolution?: string; // Video resolution for dimension matching
}

export function VideoModelSelector({ value, onChange, selectedModelInfo, aspectRatio, imageModel, videoResolution }: VideoModelSelectorProps) {
  // Get models filtered by aspect ratio if provided
  let availableModels = aspectRatio 
    ? getVideoModelsByAspectRatio(aspectRatio)
    : VIDEO_MODELS;
  
  // Further filter by image model compatibility if both imageModel and videoResolution are provided
  if (imageModel && videoResolution && aspectRatio) {
    availableModels = availableModels.filter(model => {
      // If model doesn't require matching dimensions, it's always compatible
      if (!requiresMatchingDimensions(model.value)) {
        return true;
      }
      // Check if image model supports the required dimensions
      return isImageModelCompatibleWithVideoModel(imageModel, model.value, aspectRatio, videoResolution);
    });
  }
  
  // Check if current model is compatible with aspect ratio
  const isCurrentModelCompatible = !aspectRatio || 
    (selectedModelInfo && selectedModelInfo.aspectRatios.includes(aspectRatio));

  // Fallback if model info is not found
  if (!selectedModelInfo) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground/80">
          Video Model
        </label>
        <div className="text-sm text-red-400">Model not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground/80">
          Video Model
        </label>
        {aspectRatio && (
          <span className="text-[10px] text-muted-foreground/60">
            {availableModels.length} models for {aspectRatio}
          </span>
        )}
      </div>

      {/* Warning if current model is not compatible */}
      {!isCurrentModelCompatible && (
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px]">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Current model doesn't support {aspectRatio}. Please select another.</span>
        </div>
      )}

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className={cn(
            "w-full h-auto py-2.5 px-3",
            "bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-border",
            "hover:bg-muted dark:hover:bg-white/[0.05] hover:border-[#e5e7eb] dark:hover:border-border",
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
              "border border-[#e5e7eb] dark:border-border"
            )}>
              <Video className="h-3.5 w-3.5 text-primary" />
            </div>

            {/* Model Info */}
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs font-medium text-foreground truncate">
                {selectedModelInfo.label}
              </div>
              <div className="text-[10px] text-muted-foreground/70 truncate">
                {selectedModelInfo.provider}
              </div>
            </div>

            {/* Badge */}
            {selectedModelInfo.badge && (
              <div className={cn(
                "flex-shrink-0 px-1.5 py-0.5 rounded",
                "bg-primary/20 border border-[#e5e7eb] dark:border-border",
                "flex items-center gap-1"
              )}>
                <span className="text-[9px] font-medium text-primary">{selectedModelInfo.badge}</span>
              </div>
            )}
          </div>
        </SelectTrigger>

        <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-[#e5e7eb] dark:border-border max-h-[400px]">
          {/* Show compatible models first, then incompatible ones grayed out */}
          {availableModels.map((model) => {
            const isCompatible = !aspectRatio || model.aspectRatios.includes(aspectRatio);
            
            return (
              <SelectItem
                key={model.value}
                value={model.value}
                disabled={!isCompatible}
                className={cn(
                  "py-3 px-3 cursor-pointer",
                  "focus:bg-muted/50 dark:focus:bg-white/[0.06]",
                  "data-[state=checked]:bg-primary/10",
                  !isCompatible && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className="flex items-start gap-3 w-full">
                  {/* Model Badge */}
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-lg mt-0.5",
                    "bg-gradient-to-br",
                    model.value === value 
                      ? "from-primary/30 to-purple-500/30 border-primary" 
                      : "from-muted/30 to-muted/50 dark:from-white/5 dark:to-white/10 border-[#e5e7eb] dark:border-border",
                    "flex items-center justify-center",
                    "border"
                  )}>
                    <Video className={cn(
                      "h-4 w-4",
                      model.value === value ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>

                  {/* Model Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {model.label}
                      </span>
                      {model.default && isCompatible && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                          Default
                        </span>
                      )}
                      {model.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 dark:bg-white/10 text-muted-foreground">
                          {model.badge}
                        </span>
                      )}
                      {!isCompatible && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                          No {aspectRatio}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {model.provider}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {model.description}
                    </p>
                    
                    {/* Capabilities */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Durations */}
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Clock className="h-3 w-3" />
                        {model.durations.join(", ")}s
                      </div>
                      
                      {/* Resolutions */}
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Maximize className="h-3 w-3" />
                        {model.resolutions.join(", ")}
                      </div>

                      {/* Aspect Ratios */}
                      <div className="text-[10px] text-muted-foreground/60">
                        {model.aspectRatios.join(", ")}
                      </div>
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
            );
          })}
        </SelectContent>
      </Select>

      {/* Model Info Footer */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
        <span>{selectedModelInfo.durations.join(", ")}s</span>
        <span>•</span>
        <span>{selectedModelInfo.resolutions.join(", ")}</span>
      </div>
    </div>
  );
}

