// ASMR Settings Panel - Video Format & Audio Settings

import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, 
  Volume2, 
  Repeat
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ASPECT_RATIOS,
  RESOLUTIONS,
  type VideoModelConfig,
} from "@/constants/asmr-presets";
import type { LoopMultiplier } from "@/lib/api/asmr";

interface SettingsPanelProps {
  // Video Settings
  aspectRatio: string;
  resolution: string;
  duration: number;
  loopMultiplier: LoopMultiplier;
  modelInfo: VideoModelConfig;
  onAspectRatioChange: (value: string) => void;
  onResolutionChange: (value: string) => void;
  onDurationChange: (value: number) => void;
  onLoopMultiplierChange: (value: LoopMultiplier) => void;
  
  // Audio Settings (only when model doesn't generate audio)
  showAudioSettings: boolean;
  soundIntensity: number;
  onSoundIntensityChange: (value: number) => void;
}

const LOOP_OPTIONS: { value: LoopMultiplier; label: string }[] = [
  { value: 1, label: "Off" },
  { value: 2, label: "x2" },
  { value: 4, label: "x4" },
  { value: 6, label: "x6" },
];

export function SettingsPanel({
  aspectRatio,
  resolution,
  duration,
  loopMultiplier,
  modelInfo,
  onAspectRatioChange,
  onResolutionChange,
  onDurationChange,
  onLoopMultiplierChange,
  showAudioSettings,
  soundIntensity,
  onSoundIntensityChange,
}: SettingsPanelProps) {
  // Filter options based on model capabilities
  const availableAspectRatios = ASPECT_RATIOS.filter(ar => 
    modelInfo.aspectRatios.includes(ar.value)
  );
  const availableResolutions = RESOLUTIONS.filter(r => 
    modelInfo.resolutions.includes(r.value)
  );
  const availableDurations = modelInfo.durations;

  const getSoundIntensityLabel = () => {
    if (soundIntensity < 33) return "Subtle";
    if (soundIntensity < 66) return "Moderate";
    return "Pronounced";
  };

  return (
    <div className="space-y-6">
      {/* Video Format Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground/80">Video Format</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Aspect</Label>
            <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
              <SelectTrigger className="h-9 bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-border text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-[#e5e7eb] dark:border-border">
                {availableAspectRatios.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    <span className="text-xs">{ratio.value}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resolution */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Quality</Label>
            <Select value={resolution} onValueChange={onResolutionChange}>
              <SelectTrigger className="h-9 bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-border text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-[#e5e7eb] dark:border-border">
                {availableResolutions.map((res) => (
                  <SelectItem key={res.value} value={res.value}>
                    <span className="text-xs">{res.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Duration</Label>
            <Select 
              value={String(duration)} 
              onValueChange={(v) => onDurationChange(Number(v))}
            >
              <SelectTrigger className="h-9 bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-border text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-[#e5e7eb] dark:border-border">
                {availableDurations.map((dur) => (
                  <SelectItem key={dur} value={String(dur)}>
                    <span className="text-xs">{dur}s</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loop Multiplier - Button Group */}
        <div className={cn(
          "flex items-center justify-between p-2 rounded-lg",
          "bg-muted/50 dark:bg-white/[0.02] border border-[#e5e7eb] dark:border-border"
        )}>
          <div className="flex items-center gap-2">
            <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs">Seamless Loop</span>
          </div>
          
          <div className="flex items-center gap-1">
            {LOOP_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onLoopMultiplierChange(option.value)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-medium rounded transition-all",
                  loopMultiplier === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 dark:bg-white/[0.05] text-muted-foreground hover:bg-muted dark:hover:bg-white/[0.1] hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audio Settings Section (Conditional) */}
      <AnimatePresence>
        {showAudioSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-medium text-foreground/80">Audio</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                Manual
              </span>
            </div>

            {/* Sound Intensity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-muted-foreground">Intensity</Label>
                <span className="text-[10px] text-foreground/50">{getSoundIntensityLabel()}</span>
              </div>
              <Slider
                value={[soundIntensity]}
                onValueChange={([v]) => onSoundIntensityChange(v)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
