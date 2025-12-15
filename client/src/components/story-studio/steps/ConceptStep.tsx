// Concept Step - Redesigned Layout
// ═══════════════════════════════════════════════════════════════════════════

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassPanel } from "../shared/GlassPanel";
import { ImageModelSelector } from "../shared/ImageModelSelector";
import { VideoModelSelector } from "../shared/VideoModelSelector";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getImageModelConfig, getDefaultImageModel } from "@/constants/image-models";
import { getVideoModelConfig, getDefaultVideoModel } from "@/constants/video-models";
import { 
  Ratio,
  Clock,
  Mic,
  Palette,
  Image as ImageIcon,
  Video,
  MonitorPlay,
  Wand2,
  RefreshCw,
  Lightbulb,
  Sparkles,
  Zap,
  AlignLeft,
  Settings2
} from "lucide-react";
import { StoryStudioState, StoryTemplate } from "../types";

interface ConceptStepProps {
  template: StoryTemplate;
  // State
  topic: string;
  aiPrompt: string;
  aspectRatio: string;
  duration: number;
  voiceoverEnabled: boolean;
  language: 'ar' | 'en';
  textOverlayEnabled: boolean;
  textOverlay: 'minimal' | 'key-points' | 'full';
  textOverlayStyle: 'modern' | 'cinematic' | 'bold';
  pacing: 'slow' | 'medium' | 'fast';
  hookStyle: 'question' | 'statement' | 'statistic';
  imageModel: string;
  imageResolution: string;
  animationMode: 'off' | 'transition' | 'video';
  videoModel: string;
  videoResolution: string;
  
  isGenerating: boolean;
  
  // Handlers
  onTopicChange: (topic: string) => void;
  onAiPromptChange: (prompt: string) => void;
  onAspectRatioChange: (ratio: string) => void;
  onDurationChange: (duration: number) => void;
  onVoiceoverChange: (enabled: boolean) => void;
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onPacingChange: (pacing: 'slow' | 'medium' | 'fast') => void;
  onHookStyleChange: (style: 'question' | 'statement' | 'statistic') => void;
  onTextOverlayEnabledChange: (enabled: boolean) => void;
  onTextOverlayChange: (overlay: 'minimal' | 'key-points' | 'full') => void;
  onTextOverlayStyleChange: (style: 'modern' | 'cinematic' | 'bold') => void;
  onImageModelChange: (model: string) => void;
  onImageResolutionChange: (res: string) => void;
  onAnimationModeChange: (mode: 'off' | 'transition' | 'video') => void;
  onVideoModelChange: (model: string) => void;
  onVideoResolutionChange: (res: string) => void;
  
  onGenerateIdea: () => void;
  onGenerateScript: () => void; // Used by "Go to Script" button in parent
  accentColor?: string;
}

const ASPECT_RATIOS = [
  { value: '9:16', label: 'Vertical', desc: 'TikTok, Reels', icon: '📱' },
  { value: '16:9', label: 'Horizontal', desc: 'YouTube', icon: '💻' },
  { value: '1:1', label: 'Square', desc: 'Instagram', icon: '🔲' },
  { value: '4:5', label: 'Portrait', desc: 'Feed Posts', icon: '🖼️' },
];

const DURATIONS = [15, 30, 45, 60];

const TEXT_OVERLAY_STYLES = [
  { value: 'modern', label: 'Modern' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'bold', label: 'Bold' },
];

const PACING_OPTIONS = [
  { value: 'slow', label: 'Slow', emoji: '🐢' },
  { value: 'medium', label: 'Medium', emoji: '⚡' },
  { value: 'fast', label: 'Fast', emoji: '🚀' },
];

const IMAGE_MODELS = [
  { value: 'runware:nano-banana', label: 'Nano Banana' },
  { value: 'runware:photon', label: 'Photon' },
];

export function ConceptStep({
  template,
  topic,
  aiPrompt,
  aspectRatio,
  duration,
  voiceoverEnabled,
  language,
  textOverlayEnabled,
  textOverlay,
  textOverlayStyle,
  pacing,
  hookStyle,
  imageModel,
  imageResolution,
  animationMode,
  videoModel,
  videoResolution,
  isGenerating,
  
  onTopicChange,
  onAiPromptChange,
  onAspectRatioChange,
  onDurationChange,
  onVoiceoverChange,
  onLanguageChange,
  onPacingChange,
  onHookStyleChange,
  onTextOverlayEnabledChange,
  onTextOverlayChange,
  onTextOverlayStyleChange,
  onImageModelChange,
  onImageResolutionChange,
  onAnimationModeChange,
  onVideoModelChange,
  onVideoResolutionChange,
  
  onGenerateIdea,
  accentColor = "primary"
}: ConceptStepProps) {

  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  // Get current image model config with fallback to default
  const selectedImageModel = getImageModelConfig(imageModel) || getDefaultImageModel();
  
  // Get current video model config with fallback to default
  const selectedVideoModel = getVideoModelConfig(videoModel) || getDefaultVideoModel();

  return (
    <div className="flex w-full h-[calc(100vh-12rem)] gap-0 overflow-hidden">
      {/* 
        LEFT COLUMN: SETTINGS (40% width like ASMR)
      */}
      <div className={cn(
        "w-[40%] min-w-[400px] max-w-[600px] flex-shrink-0 h-full",
        "bg-black/40 backdrop-blur-xl",
        "border-r border-white/[0.06]",
        "flex flex-col overflow-hidden"
      )}>
        {/* Scrollable Content */}
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-6 pb-12">
        
        {/* BOX 1: Image Model + Aspect Ratio + Resolution */}
        <GlassPanel>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Image Settings</h3>
          </div>
          
          <div className="space-y-6">
            {/* Image Model Selector */}
            {selectedImageModel && (
              <ImageModelSelector
                value={imageModel}
                onChange={onImageModelChange}
                selectedModelInfo={selectedImageModel}
              />
            )}

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-3">
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio.value}
                    onClick={() => onAspectRatioChange(ratio.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200",
                      aspectRatio === ratio.value 
                        ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "rounded border border-white/30 transition-all",
                      ratio.value === '9:16' && "w-3 h-5",
                      ratio.value === '16:9' && "w-5 h-3",
                      ratio.value === '1:1' && "w-4 h-4",
                      ratio.value === '4:5' && "w-3.5 h-4.5",
                      aspectRatio === ratio.value && "border-white bg-white/20"
                    )} />
                    <div className="text-center">
                      <span className="block text-xs font-medium text-white">{ratio.label}</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">{ratio.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution - Always show if model has resolutions */}
            {selectedImageModel && selectedImageModel.resolutions.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Resolution</label>
                <div className={cn(
                  "grid gap-3",
                  selectedImageModel.resolutions.length === 1 ? "grid-cols-1" :
                  selectedImageModel.resolutions.length === 2 ? "grid-cols-2" :
                  selectedImageModel.resolutions.length === 3 ? "grid-cols-3" :
                  "grid-cols-4"
                )}>
                  {selectedImageModel.resolutions.map(res => {
                    const labels: Record<string, string> = {
                      "1k": "1K",
                      "2k": "2K",
                      "4k": "4K",
                      "custom": "Auto",
                    };
                    return (
                      <button
                        key={res}
                        onClick={() => onImageResolutionChange(res)}
                        className={cn(
                          "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200",
                          imageResolution === res 
                            ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        <span className="text-sm font-medium text-white">{labels[res] || res}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* BOX 2: Duration + Pacing */}
        <GlassPanel>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Duration & Pacing</h3>
          </div>
          
          <div className="space-y-6">
            {/* Duration */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Duration</label>
                <span className="text-xs font-mono text-white/70 bg-white/10 px-2 py-0.5 rounded">{duration}s</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => onDurationChange(d)}
                    className={cn(
                      "py-2.5 rounded-lg text-sm font-medium border transition-all duration-200",
                      duration === d
                        ? cn("bg-gradient-to-br border-white/20 shadow-lg", accentClasses)
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Pacing */}
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Pacing</label>
              <div className="grid grid-cols-3 gap-3">
                {PACING_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => onPacingChange(option.value as any)}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200",
                      pacing === option.value
                        ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <span className="text-base">{option.emoji}</span>
                    <span className="text-sm font-medium text-white">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* BOX 3: Voiceover */}
        <GlassPanel>
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Voiceover</h3>
          </div>
          
          <div className="space-y-4">
            {/* Voiceover Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">Enable Voiceover</label>
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => onVoiceoverChange(true)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    voiceoverEnabled ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                  )}
                >
                  On
                </button>
                <button
                  onClick={() => onVoiceoverChange(false)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    !voiceoverEnabled ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                  )}
                >
                  Off
                </button>
              </div>
            </div>
            
            {/* Conditional Settings when Voiceover is ON */}
            {voiceoverEnabled && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-4"
              >
                {/* Language */}
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Language</label>
                  <select 
                    value={language}
                    onChange={(e) => onLanguageChange(e.target.value as 'ar' | 'en')}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
                  >
                    <option value="en">English (US)</option>
                    <option value="ar">Arabic (العربية)</option>
                  </select>
                </div>

                {/* Text Overlay Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Text Overlay</label>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                      <button
                        type="button"
                        onClick={() => onTextOverlayEnabledChange(true)}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          textOverlayEnabled ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                      >
                        On
                      </button>
                      <button
                        type="button"
                        onClick={() => onTextOverlayEnabledChange(false)}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          !textOverlayEnabled ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>
                </div>

                {/* Text Overlay Style (only when enabled) */}
                {textOverlayEnabled && (
                  <motion.div 
                    key="text-overlay-styles"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Style</label>
                    <div className="grid grid-cols-3 gap-3">
                      {TEXT_OVERLAY_STYLES.map(style => (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => onTextOverlayStyleChange(style.value as any)}
                          className={cn(
                            "py-2.5 px-3 rounded-lg text-sm font-medium border transition-all",
                            textOverlayStyle === style.value
                              ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </GlassPanel>

        {/* BOX 4: Animation Mode */}
        <GlassPanel>
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Animation Mode</h3>
          </div>
          
          <div className="space-y-4">
            {/* Animation Mode Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">Enable Animation</label>
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => onAnimationModeChange('off')}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    animationMode === 'off' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                  )}
                >
                  Off
                </button>
                <button
                  onClick={() => onAnimationModeChange('transition')}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    animationMode !== 'off' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                  )}
                >
                  On
                </button>
              </div>
            </div>

            {/* Conditional Sub-options */}
            {animationMode !== 'off' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-4"
              >
                {/* Mode Selector: Transition vs Video */}
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Animation Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onAnimationModeChange('transition')}
                      className={cn(
                        "py-2.5 px-3 rounded-lg text-sm font-medium border text-center transition-all",
                        animationMode === 'transition'
                          ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      Transition
                    </button>
                    <button
                      onClick={() => onAnimationModeChange('video')}
                      className={cn(
                        "py-2.5 px-3 rounded-lg text-sm font-medium border text-center transition-all",
                        animationMode === 'video'
                          ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      Image to Video
                    </button>
                  </div>
                </div>

                {/* Video Settings (Only if Image to Video) */}
                {animationMode === 'video' && (
                  <div className="space-y-4">
                    {/* Video Model Selector */}
                    {selectedVideoModel && (
                      <VideoModelSelector
                        value={videoModel}
                        onChange={onVideoModelChange}
                        selectedModelInfo={selectedVideoModel}
                      />
                    )}

                    {/* Video Resolution */}
                    {selectedVideoModel && selectedVideoModel.resolutions.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Video Resolution</label>
                        <div className={cn(
                          "grid gap-3",
                          selectedVideoModel.resolutions.length === 1 ? "grid-cols-1" :
                          selectedVideoModel.resolutions.length === 2 ? "grid-cols-2" :
                          selectedVideoModel.resolutions.length === 3 ? "grid-cols-3" :
                          "grid-cols-4"
                        )}>
                          {selectedVideoModel.resolutions.map(res => (
                            <button
                              key={res}
                              onClick={() => onVideoResolutionChange(res)}
                              className={cn(
                                "flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all duration-200",
                                videoResolution === res 
                                  ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                                  : "bg-white/5 border-white/10 hover:bg-white/10"
                              )}
                            >
                              <span className="text-sm font-medium text-white">{res}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </GlassPanel>
          </div>
        </ScrollArea>
      </div>

      {/* 
        RIGHT COLUMN: WORKSPACE (60% width like ASMR)
      */}
      <div className="flex-1 relative flex flex-col overflow-hidden h-full">
        {/* Top Section - AI Generator */}
        <div className="flex-shrink-0 p-6 border-b border-white/[0.04]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-lg bg-gradient-to-br",
                accentClasses
              )}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-semibold text-white">AI Idea Generator</h3>
            </div>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => onAiPromptChange(e.target.value)}
                disabled={isGenerating}
                placeholder="Ask AI to write a story about..."
                className={cn(
                  "flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white",
                  "focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all",
                  "placeholder:text-white/30"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isGenerating && aiPrompt.trim()) {
                    onGenerateIdea();
                  }
                }}
              />
              
              <Button
                onClick={onGenerateIdea}
                disabled={!aiPrompt.trim() || isGenerating}
                className={cn(
                  "bg-gradient-to-br",
                  accentClasses,
                  "text-white hover:opacity-90 px-5 h-auto py-2.5 rounded-lg font-medium",
                  "disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                )}
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    <span>Generate</span>
                  </div>
                )}
              </Button>
            </div>
            
            <p className="text-[10px] text-white/40">
              This will generate a detailed story and fill the "Your Idea" box below.
            </p>
          </div>
        </div>

        {/* Main Content - Your Idea */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "p-2 rounded-lg bg-gradient-to-br",
              accentClasses
            )}>
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">Your Idea</h3>
              <p className="text-xs text-white/40">Describe your video concept in detail</p>
            </div>
          </div>
          
          <div className="flex-1 relative rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
            <Textarea
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="Write your story idea here, or use the AI generator above to create one..."
              className={cn(
                "w-full h-full bg-transparent border-0 p-5 text-[15px] leading-relaxed",
                "focus:outline-none focus:ring-0 resize-none",
                "placeholder:text-white/20 text-white/90",
                "scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
