// Concept Step - Topic input and script generation
// ═══════════════════════════════════════════════════════════════════════════

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassPanel } from "../shared/GlassPanel";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Sparkles, 
  FileText, 
  Clock, 
  Ratio,
  Wand2,
  RefreshCw,
  Lightbulb
} from "lucide-react";
import { StoryStudioState, StoryTemplate } from "../types";

interface ConceptStepProps {
  template: StoryTemplate;
  topic: string;
  generatedScript: string;
  aspectRatio: string;
  duration: number;
  imageMode: 'none' | 'transition' | 'image' | 'image-to-video';
  voiceoverEnabled: boolean;
  isGenerating: boolean;
  onTopicChange: (topic: string) => void;
  onScriptChange: (script: string) => void;
  onAspectRatioChange: (ratio: string) => void;
  onDurationChange: (duration: number) => void;
  onImageModeChange: (mode: 'none' | 'transition' | 'image' | 'image-to-video') => void;
  onVoiceoverChange: (enabled: boolean) => void;
  onGenerateIdea: () => void;
  onGenerateScript: () => void;
  accentColor?: string;
}

const ASPECT_RATIOS = [
  { value: '9:16', label: 'Vertical', desc: 'TikTok, Reels' },
  { value: '16:9', label: 'Horizontal', desc: 'YouTube' },
  { value: '1:1', label: 'Square', desc: 'Instagram' },
  { value: '4:5', label: 'Portrait', desc: 'Feed Posts' },
];

const DURATIONS = [15, 30, 45, 60];

const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  'problem-solution': [
    "How to stop procrastinating in 3 steps",
    "The secret to waking up early",
    "Why your productivity hacks aren't working",
  ],
  'tease-reveal': [
    "This one habit changed my life",
    "The ingredient restaurants don't want you to know",
    "I tried this for 30 days and...",
  ],
  'before-after': [
    "My room transformation journey",
    "How I learned coding in 6 months",
    "From zero followers to 100K",
  ],
  'myth-busting': [
    "Drinking 8 glasses of water - necessary?",
    "Breakfast is NOT the most important meal",
    "5 fitness myths debunked",
  ],
};

export function ConceptStep({
  template,
  topic,
  generatedScript,
  aspectRatio,
  duration,
  imageMode,
  voiceoverEnabled,
  isGenerating,
  onTopicChange,
  onScriptChange,
  onAspectRatioChange,
  onDurationChange,
  onImageModeChange,
  onVoiceoverChange,
  onGenerateIdea,
  onGenerateScript,
  accentColor = "primary"
}: ConceptStepProps) {
  const suggestions = TOPIC_SUGGESTIONS[template.id] || TOPIC_SUGGESTIONS['problem-solution'];

  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 items-start">
      {/* Left Column - Settings */}
      <div className="flex flex-col h-full">
        {/* Format & Duration Settings */}
        <GlassPanel className="flex-1">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Ratio className="w-4 h-4 text-white/60" />
              <span className="font-medium text-sm">Format & Duration</span>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs text-white/50">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio.value}
                    onClick={() => onAspectRatioChange(ratio.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl",
                      "border transition-all duration-200",
                      aspectRatio === ratio.value 
                        ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "rounded border border-white/30",
                      ratio.value === '9:16' && "w-4 h-6",
                      ratio.value === '16:9' && "w-6 h-4",
                      ratio.value === '1:1' && "w-5 h-5",
                      ratio.value === '4:5' && "w-4 h-5",
                    )} />
                    <span className="text-xs font-medium">{ratio.label}</span>
                    <span className="text-[10px] text-white/40">{ratio.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/50 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Duration
                </label>
                <span className="text-sm font-semibold">{duration}s</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => onDurationChange(d)}
                    className={cn(
                      "py-2 rounded-lg text-sm font-medium",
                      "border transition-all duration-200",
                      duration === d
                        ? cn("bg-gradient-to-br border-white/20", accentClasses)
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Voiceover Toggle */}
            <div className="space-y-2">
              <label className="text-xs text-white/50">Voiceover</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onVoiceoverChange(true)}
                  className={cn(
                    "py-2 rounded-lg text-sm font-medium border transition-all duration-200",
                    voiceoverEnabled
                      ? cn("bg-gradient-to-br border-white/20", accentClasses)
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  On
                </button>
                <button
                  onClick={() => onVoiceoverChange(false)}
                  className={cn(
                    "py-2 rounded-lg text-sm font-medium border transition-all duration-200",
                    !voiceoverEnabled
                      ? cn("bg-gradient-to-br border-white/20", accentClasses)
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  Off
                </button>
              </div>
            </div>

            {/* Image Mode */}
            <div className="space-y-2">
              <label className="text-xs text-white/50">Image Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'none', label: 'None' },
                  { value: 'transition', label: 'Transition' },
                  { value: 'image', label: 'Image' },
                  { value: 'image-to-video', label: 'Image to Video' },
                ].map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => onImageModeChange(mode.value as any)}
                    className={cn(
                      "py-2 rounded-lg text-sm font-medium border transition-all duration-200",
                      imageMode === mode.value
                        ? cn("bg-gradient-to-br border-white/20", accentClasses)
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Right Column - Idea Input Only */}
      <GlassPanel className="h-full flex flex-col">
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg bg-gradient-to-br",
                accentClasses
              )}>
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Your Idea</h3>
                <p className="text-xs text-white/50">What's your video about?</p>
              </div>
            </div>
            <Button
              size="sm"
              disabled={!topic.trim() || isGenerating}
              onClick={onGenerateIdea}
              className={cn(
                "gap-2",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  IDS AI
                </>
              )}
            </Button>
          </div>

          <Textarea
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder={`e.g., "${suggestions[0]}"`}
            disabled={isGenerating}
            className={cn(
              "flex-1 min-h-[480px] bg-white/5 border-white/10",
              "focus:border-white/20 resize-none",
              "placeholder:text-white/30",
              "text-sm leading-relaxed"
            )}
          />

          {/* Suggestions */}
          <div className="space-y-2">
            <span className="text-xs text-white/40 font-medium">Try these:</span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, i) => (
                <motion.button
                  key={i}
                  onClick={() => onTopicChange(suggestion)}
                  disabled={isGenerating}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg",
                    "bg-white/5 hover:bg-white/10",
                    "border border-white/10 hover:border-white/20",
                    "transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  whileHover={{ scale: isGenerating ? 1 : 1.02 }}
                  whileTap={{ scale: isGenerating ? 1 : 0.98 }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

