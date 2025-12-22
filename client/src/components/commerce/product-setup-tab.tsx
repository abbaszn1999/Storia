import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ImageIcon,
  Video,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Mic,
  CheckCircle2,
  Clock,
  DollarSign,
  Cpu,
  Monitor,
  Globe,
  Wand2,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// MODEL CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

const IMAGE_MODELS = [
  { 
    value: "imagen-4", 
    label: "Imagen 4", 
    provider: "Google",
    description: "High-quality product photography with excellent lighting",
    badge: "Recommended",
    cost: 0.04,
    default: true,
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["1k", "2k", "4k"],
  },
  { 
    value: "dalle-3", 
    label: "DALL-E 3", 
    provider: "OpenAI",
    description: "Creative versatility for lifestyle and conceptual shots",
    cost: 0.08,
    aspectRatios: ["1:1", "9:16", "16:9"],
    resolutions: ["1k"],
  },
  { 
    value: "flux-1", 
    label: "FLUX.1", 
    provider: "Black Forest Labs",
    description: "Photorealistic rendering for premium product visuals",
    badge: "Pro",
    cost: 0.12,
    aspectRatios: ["1:1", "9:16", "16:9", "4:3", "3:4", "21:9"],
    resolutions: ["2k", "4k"],
  },
];

const VIDEO_MODELS = [
  { 
    value: "kling-o1", 
    label: "Kling o1", 
    provider: "KlingAI",
    description: "Fast, dynamic motion ideal for product reveals",
    badge: "Fast",
    cost: 0.10,
    estimatedTime: "2-3 min",
    default: true,
    durations: [5, 10, 15],
    resolutions: ["720p", "1080p"],
  },
  { 
    value: "runway-gen3", 
    label: "Runway Gen-3", 
    provider: "Runway",
    description: "Cinematic quality for premium brand storytelling",
    badge: "Cinematic",
    cost: 0.15,
    estimatedTime: "4-5 min",
    durations: [5, 10, 15, 30],
    resolutions: ["1080p", "4K Master"],
  },
  { 
    value: "luma-ray2", 
    label: "Luma Ray 2", 
    provider: "Luma AI",
    description: "Smooth camera movements and professional transitions",
    cost: 0.12,
    estimatedTime: "3-4 min",
    durations: [5, 10, 15],
    resolutions: ["720p", "1080p"],
  },
];

const IMAGE_RESOLUTION_LABELS: Record<string, string> = {
  "1k": "1K",
  "2k": "2K",
  "4k": "4K",
};

const VIDEO_RESOLUTION_LABELS: Record<string, string> = {
  "720p": "720p",
  "1080p": "1080p",
  "4K Master": "4K",
};

const ASPECT_RATIOS = [
  { value: "9:16", label: "9:16", description: "Stories / Reels", icon: RectangleVertical },
  { value: "16:9", label: "16:9", description: "YouTube / Ads", icon: RectangleHorizontal },
  { value: "1:1", label: "1:1", description: "Instagram Feed", icon: Square },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic (العربية)" },
];

const AUDIENCES = [
  { value: "mena", label: "MENA / Arab Region" },
  { value: "western", label: "Western / Minimalist" },
  { value: "asian", label: "Asian / High-Tech" },
  { value: "global", label: "Global Tech-Ad" },
  { value: "luxury", label: "Luxury / Elite" },
  { value: "genz", label: "Gen Z / Youth Culture" },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

interface ProductSetupTabProps {
  imageModel: string;
  imageResolution: string;
  videoModel: string;
  videoResolution: string;
  aspectRatio: string;
  duration: number;
  voiceOverEnabled: boolean;
  language: 'ar' | 'en';
  motionPrompt: string;
  imageInstructions: string;
  targetAudience: string;
  onImageModelChange: (model: string) => void;
  onImageResolutionChange: (resolution: string) => void;
  onVideoModelChange: (model: string) => void;
  onVideoResolutionChange: (resolution: string) => void;
  onAspectRatioChange: (ratio: string) => void;
  onDurationChange: (duration: number) => void;
  onVoiceOverToggle: (enabled: boolean) => void;
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onMotionPromptChange: (prompt: string) => void;
  onImageInstructionsChange: (instructions: string) => void;
  onTargetAudienceChange: (audience: string) => void;
  onNext: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function SectionHeader({ 
  icon: Icon, 
  title, 
  description,
  iconColor = "text-pink-400"
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  iconColor?: string;
}) {
  return (
    <div className="space-y-1 mb-5">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", iconColor)} />
        <span className="text-xs uppercase tracking-wider font-semibold text-white/70">
          {title}
        </span>
      </div>
      <p className="text-xs text-white/40 pl-6">{description}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ProductSetupTab({
  imageModel,
  imageResolution,
  videoModel,
  videoResolution,
  aspectRatio,
  duration,
  voiceOverEnabled,
  language,
  motionPrompt,
  imageInstructions,
  targetAudience,
  onImageModelChange,
  onImageResolutionChange,
  onVideoModelChange,
  onVideoResolutionChange,
  onAspectRatioChange,
  onDurationChange,
  onVoiceOverToggle,
  onLanguageChange,
  onMotionPromptChange,
  onImageInstructionsChange,
  onTargetAudienceChange,
}: ProductSetupTabProps) {
  
  // Validation states
  const isEngineReady = imageModel && videoModel;
  const isCanvasSet = aspectRatio && duration > 0;
  const isDirectionSet = motionPrompt.trim().length > 0 && targetAudience !== "";
  
  // Selected models
  const selectedImageModel = IMAGE_MODELS.find(m => m.value === imageModel);
  const selectedVideoModel = VIDEO_MODELS.find(m => m.value === videoModel);
  
  // Cost & Time estimates
  const estimatedCost = (selectedImageModel?.cost || 0) + (selectedVideoModel?.cost || 0);
  const estimatedTime = selectedVideoModel?.estimatedTime || "3-4 min";

  return (
    <motion.div 
      className="flex flex-col h-[calc(100vh-12rem)] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TWO-ZONE MAIN CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 grid grid-cols-2 gap-6 p-6 overflow-hidden">
        
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ZONE A: GENERATION ENGINE */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <ScrollArea className="h-full pr-3">
          <div className="space-y-5 pb-6">
            
            {/* Zone Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Cpu className="w-5 h-5 text-pink-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Generation Engine
              </h2>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* IMAGE PIPELINE CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={ImageIcon}
                  title="Image Pipeline"
                  description="AI model for product photography generation"
                  iconColor="text-pink-400"
                />

                {/* Model Selector */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Model</Label>
                  <Select value={imageModel} onValueChange={onImageModelChange}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select image model">
                        {selectedImageModel && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedImageModel.label}</span>
                            <span className="text-xs text-white/40">• {selectedImageModel.provider}</span>
                            {selectedImageModel.badge && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-pink-500/20 border-pink-500/50 text-pink-300">
                                {selectedImageModel.badge}
                              </Badge>
                            )}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
                      {IMAGE_MODELS.map((model) => (
                        <SelectItem 
                          key={model.value} 
                          value={model.value}
                          className="py-3 focus:bg-pink-500/20 data-[state=checked]:bg-pink-500/20"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{model.label}</span>
                              <span className="text-xs text-white/40">{model.provider}</span>
                              {model.badge && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/10 border-white/20">
                                  {model.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-white/50">{model.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resolution - Inline Toggles */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Resolution</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onImageResolutionChange("auto")}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all",
                        imageResolution === "auto"
                          ? "bg-pink-500/20 border border-pink-500/50 text-pink-300"
                          : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      Auto
                    </button>
                    {(selectedImageModel?.resolutions || ["2k"]).map((res) => (
                      <button
                        key={res}
                        onClick={() => onImageResolutionChange(res)}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all",
                          imageResolution === res
                            ? "bg-pink-500/20 border border-pink-500/50 text-pink-300"
                            : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                        )}
                      >
                        {IMAGE_RESOLUTION_LABELS[res] || res}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Info Badge */}
                {selectedImageModel && (
                  <div className="flex items-center gap-3 pt-2 text-xs text-white/40">
                    <span>${selectedImageModel.cost.toFixed(2)}/image</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>{selectedImageModel.aspectRatios.length} aspect ratios</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* VIDEO PIPELINE CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Video}
                  title="Video Pipeline"
                  description="AI model for motion synthesis and animation"
                  iconColor="text-orange-400"
                />

                {/* Model Selector */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Model</Label>
                  <Select 
                    value={videoModel} 
                    onValueChange={(value) => {
                      onVideoModelChange(value);
                      const newModel = VIDEO_MODELS.find(m => m.value === value);
                      if (newModel && !newModel.resolutions.includes(videoResolution)) {
                        onVideoResolutionChange(newModel.resolutions[0]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select video model">
                        {selectedVideoModel && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedVideoModel.label}</span>
                            <span className="text-xs text-white/40">• {selectedVideoModel.provider}</span>
                            {selectedVideoModel.badge && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-500/20 border-orange-500/50 text-orange-300">
                                {selectedVideoModel.badge}
                              </Badge>
                            )}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
                      {VIDEO_MODELS.map((model) => (
                        <SelectItem 
                          key={model.value} 
                          value={model.value}
                          className="py-3 focus:bg-orange-500/20 data-[state=checked]:bg-orange-500/20"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{model.label}</span>
                              <span className="text-xs text-white/40">{model.provider}</span>
                              {model.badge && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/10 border-white/20">
                                  {model.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-white/50">{model.description}</p>
                            <p className="text-[10px] text-white/40">
                              {model.durations?.join("s, ")}s • {model.resolutions.join(", ")} • {model.estimatedTime}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resolution - Inline Toggles */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Resolution</Label>
                  <div className="flex gap-2">
                    {(selectedVideoModel?.resolutions || ["1080p"]).map((res) => (
                      <button
                        key={res}
                        onClick={() => onVideoResolutionChange(res)}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all",
                          videoResolution === res
                            ? "bg-orange-500/20 border border-orange-500/50 text-orange-300"
                            : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                        )}
                      >
                        {VIDEO_RESOLUTION_LABELS[res] || res}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Info Badge */}
                {selectedVideoModel && (
                  <div className="flex items-center gap-3 pt-2 text-xs text-white/40">
                    <span>${selectedVideoModel.cost.toFixed(2)}/clip</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>{selectedVideoModel.estimatedTime}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* STRATEGIC CONTEXT CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Globe}
                  title="Strategic Context"
                  description="Cultural and demographic guidance for AI decisions"
                  iconColor="text-purple-400"
                />

                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Target Audience & Region</Label>
                  <Select value={targetAudience} onValueChange={onTargetAudienceChange}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select target audience..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
                      {AUDIENCES.map((audience) => (
                        <SelectItem 
                          key={audience.value} 
                          value={audience.value}
                          className="py-2 focus:bg-purple-500/20 data-[state=checked]:bg-purple-500/20"
                        >
                          {audience.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {targetAudience === "" && (
                    <p className="text-xs text-amber-400/80">Required for AI guidance</p>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </ScrollArea>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ZONE B: OUTPUT SPECIFICATION */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <ScrollArea className="h-full pl-3">
          <div className="space-y-5 pb-6">
            
            {/* Zone Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Monitor className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Output Specification
              </h2>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CANVAS FORMAT CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Square}
                  title="Canvas Format"
                  description="Video dimensions and timeline"
                  iconColor="text-cyan-400"
                />

                {/* Aspect Ratio */}
                <div className="space-y-3">
                  <Label className="text-xs text-white/50">Aspect Ratio</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ASPECT_RATIOS.map((ratio) => {
                      const Icon = ratio.icon;
                      return (
                        <button
                          key={ratio.value}
                          onClick={() => onAspectRatioChange(ratio.value)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                            aspectRatio === ratio.value
                              ? "bg-cyan-500/20 border-cyan-500/50"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <Icon className={cn(
                            "w-5 h-5",
                            aspectRatio === ratio.value ? "text-cyan-400" : "text-white/60"
                          )} />
                          <span className={cn(
                            "text-sm font-medium",
                            aspectRatio === ratio.value ? "text-cyan-300" : "text-white/70"
                          )}>
                            {ratio.label}
                          </span>
                          <span className="text-[10px] text-white/40">{ratio.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration Slider */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-white/50">Target Duration</Label>
                    <span className="text-sm font-semibold text-cyan-400">{duration}s</span>
                  </div>
                  <Slider
                    value={[duration]}
                    onValueChange={(value) => onDurationChange(value[0])}
                    min={5}
                    max={60}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-white/30">
                    <span>5s</span>
                    <span>30s</span>
                    <span>60s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* AUDIO LAYER CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Mic}
                  title="Audio Layer"
                  description="Voice narration settings"
                  iconColor="text-emerald-400"
                />

                {/* Voice Over Toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-white/50">Voice Over</Label>
                  <div className="flex bg-white/5 rounded-md p-0.5 border border-white/10">
                    <button
                      onClick={() => onVoiceOverToggle(true)}
                      className={cn(
                        "px-4 py-1.5 text-xs font-medium rounded transition-all",
                        voiceOverEnabled 
                          ? "bg-emerald-500/30 text-emerald-300" 
                          : "text-white/40"
                      )}
                    >
                      On
                    </button>
                    <button
                      onClick={() => onVoiceOverToggle(false)}
                      className={cn(
                        "px-4 py-1.5 text-xs font-medium rounded transition-all",
                        !voiceOverEnabled 
                          ? "bg-white/10 text-white/70" 
                          : "text-white/40"
                      )}
                    >
                      Off
                    </button>
                  </div>
                </div>

                {/* Language Selection (Conditional) */}
                {voiceOverEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label className="text-xs text-white/50">Language</Label>
                    <Select value={language} onValueChange={(value) => onLanguageChange(value as 'ar' | 'en')}>
                      <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/10">
                        {LANGUAGES.map((lang) => (
                          <SelectItem 
                            key={lang.value} 
                            value={lang.value}
                            className="py-2 focus:bg-emerald-500/20 data-[state=checked]:bg-emerald-500/20"
                          >
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CREATIVE DIRECTION CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Wand2}
                  title="Creative Direction"
                  description="Global motion and camera behavior"
                  iconColor="text-amber-400"
                />

                {/* Motion DNA Textarea */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Global Motion DNA</Label>
                  <Textarea
                    value={motionPrompt}
                    onChange={(e) => onMotionPromptChange(e.target.value)}
                    placeholder="Define camera movement and physics rules...

Examples:
• Cinematic macro lighting, shallow depth of field
• Smooth dolly zoom, product center frame
• Dynamic tracking shot, urban streetwear energy"
                    className="min-h-[140px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/50 text-sm"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/30">
                      {motionPrompt.length} characters
                    </span>
                    {motionPrompt.trim().length === 0 && (
                      <span className="text-xs text-amber-400/80">Required</span>
                    )}
                  </div>
                </div>

                {/* Custom Image Instructions Textarea */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Custom Image Instructions</Label>
                  <Textarea
                    value={imageInstructions}
                    onChange={(e) => onImageInstructionsChange(e.target.value)}
                    placeholder="Define style and composition for image generation...

Examples:
• High contrast studio lighting, white background
• Photorealistic product render, soft shadows
• Lifestyle photography, natural daylight"
                    className="min-h-[100px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/50 text-sm"
                  />
                  <span className="text-[10px] text-white/30">
                    {imageInstructions.length} characters
                  </span>
                </div>
              </CardContent>
            </Card>

          </div>
        </ScrollArea>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* COMPACT VALIDATION FOOTER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          
          {/* Validation Checkmarks */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {isEngineReady ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isEngineReady ? "text-white/70" : "text-white/40"
              )}>
                Engine Ready
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isCanvasSet ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isCanvasSet ? "text-white/70" : "text-white/40"
              )}>
                Canvas Set
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isDirectionSet ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isDirectionSet ? "text-white/70" : "text-white/40"
              )}>
                Direction Set
              </span>
            </div>
          </div>

          {/* Cost & Time Estimate */}
          <div className="flex items-center gap-4">
            {selectedImageModel && selectedVideoModel && (
              <>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-sm font-semibold text-white">
                    ${estimatedCost.toFixed(2)}
                  </span>
                  <span className="text-xs text-white/40">per gen</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-sm font-medium text-white/70">
                    {estimatedTime}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
