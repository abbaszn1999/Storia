// Image Model Selector - Rich Dropdown with Model Info
// ═══════════════════════════════════════════════════════════════════════════

import { motion } from "framer-motion";
import { ChevronDown, Image as ImageIcon, Sparkles, Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IMAGE_MODELS, getImageModelConfig, RESOLUTION_LABELS, type ImageModelConfig } from "@/constants/image-models";

interface ImageModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  selectedModelInfo: ImageModelConfig;
}

export function ImageModelSelector({ value, onChange, selectedModelInfo }: ImageModelSelectorProps) {
  // Fallback if model info is not found
  if (!selectedModelInfo) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground/80">
          Image Model
        </label>
        <div className="text-sm text-red-400">Model not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground/80">
        Image Model
      </label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className={cn(
            "w-full h-auto py-2.5 px-3",
            "bg-white/[0.03] border-[#e5e7eb] dark:border-border",
            "hover:bg-white/[0.05] hover:border-[#e5e7eb] dark:hover:border-border",
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
              <ImageIcon className="h-3.5 w-3.5 text-primary" />
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
                "bg-primary/20 border border-[#e5e7eb]",
                "flex items-center gap-1"
              )}>
                <Sparkles className="h-2.5 w-2.5 text-primary" />
                <span className="text-[9px] font-medium text-primary">{selectedModelInfo.badge}</span>
              </div>
            )}
          </div>
        </SelectTrigger>

        <SelectContent className="bg-[#1a1a1a] border-border max-h-[400px]">
          {IMAGE_MODELS.map((model) => (
            <SelectItem
              key={model.value}
              value={model.value}
              className={cn(
                "py-3 px-3 cursor-pointer",
                "focus:bg-white/[0.06]",
                "data-[state=checked]:bg-primary/10"
              )}
            >
              <div className="flex items-start gap-3 w-full">
                {/* Model Badge */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg mt-0.5",
                  "bg-gradient-to-br",
                  model.value === value 
                    ? "from-primary/30 to-purple-500/30 border-primary" 
                    : "from-white/5 to-white/10 border-[#e5e7eb]",
                  "flex items-center justify-center",
                  "border"
                )}>
                  <ImageIcon className={cn(
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
                    {model.default && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                        Default
                      </span>
                    )}
                    {model.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground">
                        {model.badge}
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
                    {/* Resolutions */}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                      <Zap className="h-3 w-3" />
                      {model.resolutions.map(r => RESOLUTION_LABELS[r] || r).join(", ")}
                    </div>
                    
                    {/* Aspect Ratios Count */}
                    <div className="text-[10px] text-muted-foreground/60">
                      {model.aspectRatios.length} ratios
                    </div>

                    {/* Max Prompt */}
                    <div className="text-[10px] text-muted-foreground/60">
                      {model.maxPromptLength >= 10000 ? '10K+' : `${Math.floor(model.maxPromptLength / 1000)}K`} chars
                    </div>

                    {/* Negative Prompt */}
                    {model.supportsNegativePrompt && (
                      <div className="text-[10px] text-emerald-400">
                        Negative Prompt
                      </div>
                    )}
                    
                    {/* Seed */}
                    {model.supportsSeed && (
                      <div className="text-[10px] text-blue-400">
                        Seed
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

      {/* Model Info Footer */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
        <span>{selectedModelInfo.aspectRatios.length} aspect ratios</span>
        <span>•</span>
        <span>{selectedModelInfo.resolutions.join(", ")}</span>
        {selectedModelInfo.supportsNegativePrompt && (
          <>
            <span>•</span>
            <span className="text-emerald-400">Negative prompt</span>
          </>
        )}
      </div>
    </div>
  );
}

