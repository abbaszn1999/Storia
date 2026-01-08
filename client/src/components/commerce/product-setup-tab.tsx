import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useRef } from "react";
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
  Video,
  RectangleHorizontal,
  RectangleVertical,
  Mic,
  CheckCircle2,
  Clock,
  DollarSign,
  Cpu,
  Monitor,
  Globe,
  Wand2,
  Volume2,
  Music,
  Settings,
  Palette,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Package,
  Upload,
  Eye,
  X,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

// ═══════════════════════════════════════════════════════════════════════════
// SORA MODEL CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

// Sora 2 and Sora 2 Pro only
const SORA_MODELS = [
  {
    value: "sora-2",
    label: "Sora 2",
    provider: "OpenAI",
    description: "Standard quality, general-purpose video generation",
    cost: 0.15,
    estimatedTime: "4-5 min",
    durations: [4, 8, 12],
    aspectRatios: ["16:9", "9:16"],
    resolutions: ["720p"],
  },
  {
    value: "sora-2-pro",
    label: "Sora 2 Pro",
    provider: "OpenAI",
    description: "Premium quality, enhanced capabilities for professional use",
    cost: 0.20,
    estimatedTime: "5-6 min",
    durations: [4, 8, 12],
    aspectRatios: ["16:9", "9:16", "7:4", "4:7"],
    resolutions: ["720p"],
    badge: "Pro",
  },
];

// Aspect ratio configurations
const ASPECT_RATIO_CONFIGS = {
  "16:9": { label: "16:9", description: "Landscape", icon: RectangleHorizontal },
  "9:16": { label: "9:16", description: "Portrait", icon: RectangleVertical },
  "7:4": { label: "7:4", description: "Wide Landscape", icon: RectangleHorizontal },
  "4:7": { label: "4:7", description: "Tall Portrait", icon: RectangleVertical },
};

// Duration options (Sora only - beat-based chunking: each duration = N beats × 8s)
const DURATION_OPTIONS = [8, 16, 24, 32];

// Resolution dimensions mapping
const RESOLUTION_DIMENSIONS: Record<string, Record<string, { width: number; height: number }>> = {
  "sora-2": {
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 720, height: 1280 },
  },
  "sora-2-pro": {
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 720, height: 1280 },
    "7:4": { width: 1792, height: 1024 },
    "4:7": { width: 1024, height: 1792 },
  },
};

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

// Audio presets
const SOUND_EFFECTS_PRESETS = [
  { value: "ambient", label: "Ambient" },
  { value: "impact", label: "Impact" },
  { value: "nature", label: "Nature" },
  { value: "urban", label: "Urban" },
  { value: "cinematic", label: "Cinematic" },
  { value: "mechanical", label: "Mechanical" },
];

const MUSIC_PRESETS = [
  { value: "orchestral", label: "Orchestral" },
  { value: "electronic", label: "Electronic" },
  { value: "acoustic", label: "Acoustic" },
  { value: "cinematic", label: "Cinematic" },
  { value: "upbeat", label: "Upbeat" },
  { value: "ambient", label: "Ambient" },
];

const SPEECH_TEMPO_OPTIONS = [
  { value: "auto", label: "Auto", description: "AI determines optimal speed" },
  { value: "slow", label: "Slow", description: "Deliberate, contemplative pace" },
  { value: "normal", label: "Normal", description: "Natural speaking pace" },
  { value: "fast", label: "Fast", description: "Energetic, rapid delivery" },
  { value: "ultra-fast", label: "Ultra Fast", description: "Maximum speed, high energy" },
];

const PRODUCTION_LEVELS = [
  { value: "raw", label: "Raw" },
  { value: "casual", label: "Casual" },
  { value: "balanced", label: "Balanced" },
  { value: "cinematic", label: "Cinematic" },
  { value: "ultra", label: "Ultra" },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

interface DialogueEntry {
  id: string;
  character?: string;
  line: string;
}

interface ProductSetupTabProps {
  // Video model (Sora only)
  videoModel: string;
  videoResolution: string;
  aspectRatio: string;
  duration: number;
  
  // Audio settings
  voiceOverEnabled: boolean;
  language?: 'ar' | 'en';
  audioVolume?: 'low' | 'medium' | 'high';
  speechTempo?: 'auto' | 'slow' | 'normal' | 'fast' | 'ultra-fast';
  dialogue?: DialogueEntry[];
  customVoiceoverInstructions?: string;
  
  soundEffectsEnabled?: boolean;
  soundEffectsPreset?: string;
  soundEffectsCustomInstructions?: string;
  soundEffectsUsePreset?: boolean;
  
  musicEnabled?: boolean;
  musicPreset?: string;
  musicCustomInstructions?: string;
  musicMood?: string;
  musicUsePreset?: boolean;
  
  // Quality settings
  productionLevel?: 'raw' | 'casual' | 'balanced' | 'cinematic' | 'ultra';
  
  // Visual style
  pacingOverride?: number; // 0-100
  visualIntensity?: number; // 0-100 (Craziness/Intensity of wildness)
  
  // Creative direction
  motionPrompt: string;
  targetAudience: string;
  
  // Product information
  productTitle?: string;
  productDescription?: string;
  onProductTitleChange?: (title: string) => void;
  onProductDescriptionChange?: (description: string) => void;
  
  // Product images
  productImages?: {
    heroProfile: string | null;
    macroDetail?: string | null;
    materialReference?: string | null;
  };
  onProductImageUpload?: (key: 'heroProfile' | 'macroDetail' | 'materialReference', file: File) => Promise<void>;
  onProductImageDelete?: (key: 'heroProfile' | 'macroDetail' | 'materialReference') => Promise<void>;
  
  // Handlers
  onVideoModelChange: (model: string) => void;
  onVideoResolutionChange: (resolution: string) => void;
  onAspectRatioChange: (ratio: string) => void;
  onDurationChange: (duration: number) => void;
  onVoiceOverToggle: (enabled: boolean) => void;
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onAudioVolumeChange?: (volume: 'low' | 'medium' | 'high') => void;
  onSpeechTempoChange?: (tempo: 'auto' | 'slow' | 'normal' | 'fast' | 'ultra-fast') => void;
  onDialogueAdd?: () => void;
  onDialogueChange?: (id: string, entry: Partial<DialogueEntry>) => void;
  onDialogueRemove?: (id: string) => void;
  onCustomVoiceoverInstructionsChange?: (instructions: string) => void;
  onSoundEffectsToggle?: (enabled: boolean) => void;
  onSoundEffectsPresetChange?: (preset: string) => void;
  onSoundEffectsCustomChange?: (instructions: string) => void;
  onSoundEffectsUsePresetChange?: (usePreset: boolean) => void;
  onMusicToggle?: (enabled: boolean) => void;
  onMusicPresetChange?: (preset: string) => void;
  onMusicCustomChange?: (instructions: string) => void;
  onMusicMoodChange?: (mood: string) => void;
  onMusicUsePresetChange?: (usePreset: boolean) => void;
  onProductionLevelChange?: (level: 'raw' | 'casual' | 'balanced' | 'cinematic' | 'ultra') => void;
  onPacingOverrideChange?: (value: number) => void;
  onVisualIntensityChange?: (value: number) => void;
  onMotionPromptChange: (prompt: string) => void;
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
  videoModel,
  videoResolution,
  aspectRatio,
  duration,
  voiceOverEnabled,
  language,
  audioVolume = 'medium',
  speechTempo = 'auto',
  dialogue = [],
  customVoiceoverInstructions = '',
  soundEffectsEnabled = false,
  soundEffectsPreset = '',
  soundEffectsCustomInstructions = '',
  soundEffectsUsePreset = true,
  musicEnabled = false,
  musicPreset = '',
  musicCustomInstructions = '',
  musicMood = '',
  musicUsePreset = true,
  productionLevel = 'balanced',
  pacingOverride,
  visualIntensity,
  motionPrompt,
  targetAudience,
  onVideoModelChange,
  onVideoResolutionChange,
  onAspectRatioChange,
  onDurationChange,
  onVoiceOverToggle,
  onLanguageChange,
  onAudioVolumeChange,
  onSpeechTempoChange,
  onDialogueAdd,
  onDialogueChange,
  onDialogueRemove,
  onCustomVoiceoverInstructionsChange,
  onSoundEffectsToggle,
  onSoundEffectsPresetChange,
  onSoundEffectsCustomChange,
  onSoundEffectsUsePresetChange,
  onMusicToggle,
  onMusicPresetChange,
  onMusicCustomChange,
  onMusicMoodChange,
  onMusicUsePresetChange,
  onProductionLevelChange,
  onPacingOverrideChange,
  onVisualIntensityChange,
  onMotionPromptChange,
  onTargetAudienceChange,
  productTitle,
  productDescription,
  onProductTitleChange,
  onProductDescriptionChange,
  productImages,
  onProductImageUpload,
  onProductImageDelete,
}: ProductSetupTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAudioPanelOpen, setIsAudioPanelOpen] = useState(true);
  
  // Validation states
  const isEngineReady = videoModel && (videoModel === 'sora-2' || videoModel === 'sora-2-pro');
  const isCanvasSet = aspectRatio && DURATION_OPTIONS.includes(duration);
  const isDirectionSet = motionPrompt.trim().length > 0 && targetAudience !== "";
  
  // Selected model
  const selectedVideoModel = SORA_MODELS.find(m => m.value === videoModel);
  
  // Get available aspect ratios for selected model
  const availableAspectRatios = selectedVideoModel?.aspectRatios || ["16:9", "9:16"];
  
  // Get available resolutions for selected model + aspect ratio
  const availableResolutions = selectedVideoModel?.resolutions || ["720p"];
  
  // Auto-adjust aspect ratio if current selection is invalid
  React.useEffect(() => {
    if (selectedVideoModel && !availableAspectRatios.includes(aspectRatio)) {
      onAspectRatioChange(availableAspectRatios[0]);
    }
  }, [videoModel, aspectRatio, availableAspectRatios, onAspectRatioChange, selectedVideoModel]);
  
  // Cost & Time estimates
  const estimatedCost = selectedVideoModel?.cost || 0;
  const estimatedTime = selectedVideoModel?.estimatedTime || "4-5 min";
  
  // Get resolution dimensions
  const resolutionDims = RESOLUTION_DIMENSIONS[videoModel]?.[aspectRatio];
  const resolutionLabel = resolutionDims 
    ? `720p (${resolutionDims.width}×${resolutionDims.height})`
    : "720p";

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
      <div className="flex-1 grid grid-cols-[1fr_400px] gap-6 p-6 overflow-hidden">
        
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ZONE A: MAIN CONTENT (Left) */}
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
            {/* PRODUCT INFORMATION CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Package}
                  title="Product Information"
                  description="Basic product details for the campaign"
                  iconColor="text-blue-400"
                />

                {/* Product Title */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Product Title *</Label>
                  <Input
                    placeholder="e.g., Premium Wireless Headphones"
                    value={productTitle || ''}
                    onChange={(e) => onProductTitleChange?.(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>

                {/* Product Description */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Product Description</Label>
                  <Textarea
                    placeholder="Key features and benefits of your product..."
                    value={productDescription || ''}
                    onChange={(e) => onProductDescriptionChange?.(e.target.value)}
                    className="min-h-[80px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <p className="text-[10px] text-white/40">
                    Optional: Helps AI understand your product better
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* PRODUCT IMAGE UPLOAD CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Eye}
                  title="Product Image"
                  description="Upload hero profile image for AI reference"
                  iconColor="text-purple-400"
                />

                <div
                  onClick={() => !productImages?.heroProfile && !isUploading && fileInputRef.current?.click()}
                  className={cn(
                    "relative aspect-square max-w-[200px] rounded-lg border-2 border-dashed cursor-pointer transition-all overflow-hidden group",
                    productImages?.heroProfile 
                      ? "border-purple-500/30 bg-white/[0.02]" 
                      : "border-white/10 bg-white/[0.02] hover:border-purple-500/30"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !onProductImageUpload) return;
                      
                      setIsUploading(true);
                      try {
                        await onProductImageUpload('heroProfile', file);
                      } catch (error) {
                        console.error('Upload failed:', error);
                      } finally {
                        setIsUploading(false);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }
                    }}
                  />
                  
                  {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                  ) : productImages?.heroProfile ? (
                    <>
                      <img 
                        src={productImages.heroProfile} 
                        alt="Hero Profile"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onProductImageDelete) {
                            onProductImageDelete('heroProfile');
                          }
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600/80"
                        title="Delete image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                      <Upload className="w-8 h-8 text-white/40" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-white/70">Click to upload</p>
                        <p className="text-xs text-white/40 mt-1">Hero profile image</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SORA VIDEO PIPELINE CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Video}
                  title="Sora Video Pipeline"
                  description="AI model for video generation (Sora 2 or Sora 2 Pro only)"
                  iconColor="text-orange-400"
                />

                {/* Model Selector */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Model</Label>
                  <Select 
                    value={videoModel} 
                    onValueChange={(value) => {
                      onVideoModelChange(value);
                      const newModel = SORA_MODELS.find(m => m.value === value);
                      if (newModel && !newModel.resolutions.includes(videoResolution)) {
                        onVideoResolutionChange(newModel.resolutions[0]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select Sora model">
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
                      {SORA_MODELS.map((model) => (
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
                              {model.durations.join("s, ")}s • {model.aspectRatios.join(", ")} • {model.estimatedTime}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resolution Display */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Resolution</Label>
                  <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white/70">
                    {resolutionLabel}
                  </div>
                  <p className="text-[10px] text-white/40">
                    Resolution automatically matches aspect ratio
                  </p>
                </div>

                {/* Model Info Badge */}
                {selectedVideoModel && (
                  <div className="flex items-center gap-3 pt-2 text-xs text-white/40">
                    <span>${selectedVideoModel.cost.toFixed(2)}/video</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>{selectedVideoModel.estimatedTime}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CANVAS FORMAT CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Monitor}
                  title="Canvas Format"
                  description="Video dimensions and timeline"
                  iconColor="text-cyan-400"
                />

                {/* Aspect Ratio - Dynamic based on model */}
                <div className="space-y-3">
                  <Label className="text-xs text-white/50">Aspect Ratio</Label>
                  <div className={cn(
                    "grid gap-2",
                    availableAspectRatios.length === 2 ? "grid-cols-2" : "grid-cols-2"
                  )}>
                    {availableAspectRatios.map((ratioValue) => {
                      const ratioConfig = ASPECT_RATIO_CONFIGS[ratioValue as keyof typeof ASPECT_RATIO_CONFIGS];
                      if (!ratioConfig) return null;
                      const Icon = ratioConfig.icon;
                      return (
                        <button
                          key={ratioValue}
                          onClick={() => onAspectRatioChange(ratioValue)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                            aspectRatio === ratioValue
                              ? "bg-cyan-500/20 border-cyan-500/50"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <Icon className={cn(
                            "w-5 h-5",
                            aspectRatio === ratioValue ? "text-cyan-400" : "text-white/60"
                          )} />
                          <span className={cn(
                            "text-sm font-medium",
                            aspectRatio === ratioValue ? "text-cyan-300" : "text-white/70"
                          )}>
                            {ratioConfig.label}
                          </span>
                          <span className="text-[10px] text-white/40">{ratioConfig.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration - Sora only [4, 8, 12] */}
                <div className="space-y-3 pt-2">
                  <Label className="text-xs text-white/50">Duration (Sora supports 4, 8, or 12 seconds)</Label>
                  <div className="flex gap-2">
                    {DURATION_OPTIONS.map((dur) => (
                      <button
                        key={dur}
                        onClick={() => onDurationChange(dur)}
                        className={cn(
                          "flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all",
                          duration === dur
                            ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-300"
                            : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                        )}
                      >
                        {dur}s
                      </button>
                    ))}
                  </div>
                </div>
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
              </CardContent>
            </Card>

          </div>
        </ScrollArea>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ZONE B: AUDIO & QUALITY SETTINGS (Right Panel) */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <ScrollArea className="h-full pl-3">
          <div className="space-y-5 pb-6">
            
            {/* Zone Header with Collapse */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Audio & Quality Settings
                </h2>
              </div>
              <button
                onClick={() => setIsAudioPanelOpen(!isAudioPanelOpen)}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                {isAudioPanelOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            <AnimatePresence>
              {isAudioPanelOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5"
                >
                  {/* ═══════════════════════════════════════════════════════════════ */}
                  {/* VOICEOVER SECTION */}
                  {/* ═══════════════════════════════════════════════════════════════ */}
                  <Card className="bg-white/[0.02] border-white/[0.06]">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-emerald-400" />
                          <Label className="text-xs uppercase tracking-wider font-semibold text-white/70">
                            Voiceover
                          </Label>
                        </div>
                        <Switch
                          checked={voiceOverEnabled}
                          onCheckedChange={onVoiceOverToggle}
                        />
                      </div>

                      {voiceOverEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label className="text-xs text-white/50">Language</Label>
                            <Select value={language || 'en'} onValueChange={(value) => onLanguageChange(value as 'ar' | 'en')}>
                              <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0a0a0a] border-white/10">
                                {LANGUAGES.map((lang) => (
                                  <SelectItem 
                                    key={lang.value} 
                                    value={lang.value}
                                    className="py-2 focus:bg-emerald-500/20"
                                  >
                                    {lang.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-white/50">Audio Volume</Label>
                            <div className="flex gap-2">
                              {(['low', 'medium', 'high'] as const).map((vol) => (
                                <button
                                  key={vol}
                                  onClick={() => onAudioVolumeChange?.(vol)}
                                  className={cn(
                                    "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all capitalize",
                                    audioVolume === vol
                                      ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300"
                                      : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                                  )}
                                >
                                  {vol}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-white/50">Speech Tempo</Label>
                            <Select 
                              value={speechTempo || 'auto'} 
                              onValueChange={(value) => onSpeechTempoChange?.(value as 'auto' | 'slow' | 'normal' | 'fast' | 'ultra-fast')}
                            >
                              <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0a0a0a] border-white/10">
                                {SPEECH_TEMPO_OPTIONS.map((option) => (
                                  <SelectItem 
                                    key={option.value} 
                                    value={option.value}
                                    className="py-2 focus:bg-emerald-500/20"
                                  >
                                    <div>
                                      <div className="font-medium">{option.label}</div>
                                      <div className="text-[10px] text-white/50">{option.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {onDialogueAdd && (
                            <div className="space-y-3 pt-4 border-t border-white/10">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs uppercase tracking-wider font-semibold text-white/70">
                                  Dialogue
                                </Label>
                                <button
                                  onClick={onDialogueAdd}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md border border-emerald-500/20"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Add Dialogue
                                </button>
                              </div>
                              
                              {dialogue.length === 0 ? (
                                <p className="text-xs text-white/40 italic py-2">No dialogue added yet. Click "Add Dialogue" to create entries.</p>
                              ) : (
                                <div className="space-y-2">
                                  {dialogue.map((entry) => (
                                    <div key={entry.id} className="flex gap-2 items-start">
                                      <Input
                                        value={entry.character || ''}
                                        onChange={(e) => onDialogueChange?.(entry.id, { character: e.target.value })}
                                        placeholder="Character"
                                        className="flex-1 h-9 bg-white/5 border-white/10 text-white text-xs placeholder:text-white/30"
                                      />
                                      <Input
                                        value={entry.line}
                                        onChange={(e) => onDialogueChange?.(entry.id, { line: e.target.value })}
                                        placeholder="Line"
                                        className="flex-[2] h-9 bg-white/5 border-white/10 text-white text-xs placeholder:text-white/30"
                                      />
                                      <button
                                        onClick={() => onDialogueRemove?.(entry.id)}
                                        className="p-2 text-white/40 hover:text-red-400 transition-colors rounded-md hover:bg-red-500/10"
                                        title="Remove dialogue"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {language && (
                            <div className="space-y-2">
                              <Label className="text-xs text-white/50">Custom Voiceover Instructions (Optional)</Label>
                              <Textarea
                                value={customVoiceoverInstructions}
                                onChange={(e) => onCustomVoiceoverInstructionsChange?.(e.target.value)}
                                placeholder="e.g., 'warm and inviting narration' or 'energetic and confident'"
                                className="min-h-[80px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/25 text-sm"
                              />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ═══════════════════════════════════════════════════════════════ */}
                  {/* SOUND EFFECTS SECTION */}
                  {/* ═══════════════════════════════════════════════════════════════ */}
                  <Card className="bg-white/[0.02] border-white/[0.06]">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-blue-400" />
                          <Label className="text-xs uppercase tracking-wider font-semibold text-white/70">
                            Sound Effects
                          </Label>
                        </div>
                        <Switch
                          checked={soundEffectsEnabled}
                          onCheckedChange={onSoundEffectsToggle}
                        />
                      </div>

                      {soundEffectsEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label className="text-xs text-white/50">Use Preset or Custom</Label>
                            <RadioGroup
                              value={soundEffectsUsePreset ? "preset" : "custom"}
                              onValueChange={(value) => onSoundEffectsUsePresetChange?.(value === "preset")}
                              className="flex gap-4"
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="preset" id="sfx-preset" />
                                <Label htmlFor="sfx-preset" className="text-xs text-white/70 cursor-pointer">Use Preset</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="custom" id="sfx-custom" />
                                <Label htmlFor="sfx-custom" className="text-xs text-white/70 cursor-pointer">Custom Instructions</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          {soundEffectsUsePreset ? (
                            <div className="space-y-2">
                              <Label className="text-xs text-white/50">Sound Effects Preset</Label>
                              <Select value={soundEffectsPreset} onValueChange={(value) => onSoundEffectsPresetChange?.(value)}>
                                <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white">
                                  <SelectValue placeholder="Select sound effects..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0a0a] border-white/10">
                                  {SOUND_EFFECTS_PRESETS.map((preset) => (
                                    <SelectItem key={preset.value} value={preset.value} className="py-2">
                                      {preset.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label className="text-xs text-white/50">Custom Sound Effects Instructions</Label>
                              <Textarea
                                value={soundEffectsCustomInstructions}
                                onChange={(e) => onSoundEffectsCustomChange?.(e.target.value)}
                                placeholder="e.g., 'subtle ambient sounds of nature' or 'dramatic impact sounds'"
                                className="min-h-[80px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/25 text-sm"
                              />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ═══════════════════════════════════════════════════════════════ */}
                  {/* MUSIC SECTION */}
                  {/* ═══════════════════════════════════════════════════════════════ */}
                  <Card className="bg-white/[0.02] border-white/[0.06]">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4 text-purple-400" />
                          <Label className="text-xs uppercase tracking-wider font-semibold text-white/70">
                            Music
                          </Label>
                        </div>
                        <Switch
                          checked={musicEnabled}
                          onCheckedChange={onMusicToggle}
                        />
                      </div>

                      {musicEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label className="text-xs text-white/50">Use Preset or Custom</Label>
                            <RadioGroup
                              value={musicUsePreset ? "preset" : "custom"}
                              onValueChange={(value) => onMusicUsePresetChange?.(value === "preset")}
                              className="flex gap-4"
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="preset" id="music-preset" />
                                <Label htmlFor="music-preset" className="text-xs text-white/70 cursor-pointer">Use Preset</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="custom" id="music-custom" />
                                <Label htmlFor="music-custom" className="text-xs text-white/70 cursor-pointer">Custom Instructions</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          {musicUsePreset ? (
                            <div className="space-y-2">
                              <Label className="text-xs text-white/50">Music Style Preset</Label>
                              <Select value={musicPreset} onValueChange={(value) => onMusicPresetChange?.(value)}>
                                <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white">
                                  <SelectValue placeholder="Select music style..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0a0a] border-white/10">
                                  {MUSIC_PRESETS.map((preset) => (
                                    <SelectItem key={preset.value} value={preset.value} className="py-2">
                                      {preset.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label className="text-xs text-white/50">Custom Music Instructions</Label>
                              <Textarea
                                value={musicCustomInstructions}
                                onChange={(e) => onMusicCustomChange?.(e.target.value)}
                                placeholder="e.g., 'orchestral music building to crescendo' or 'upbeat electronic'"
                                className="min-h-[80px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/25 text-sm"
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label className="text-xs text-white/50">Music Mood</Label>
                            <Input
                              value={musicMood}
                              onChange={(e) => onMusicMoodChange?.(e.target.value)}
                              placeholder="e.g., Uplifting, tense, emotional..."
                              className="h-10 bg-white/5 border-white/10 text-white text-sm"
                            />
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ═══════════════════════════════════════════════════════════════ */}
                  {/* QUALITY SETTINGS */}
                  {/* ═══════════════════════════════════════════════════════════════ */}
                  <Card className="bg-white/[0.02] border-white/[0.06]">
                    <CardContent className="p-5 space-y-4">
                      <SectionHeader
                        icon={Settings}
                        title="Quality Settings"
                        description="Production level for Sora output"
                        iconColor="text-cyan-400"
                      />

                      <div className="space-y-3">
                        <Label className="text-xs text-white/50">Production Level</Label>
                        <Slider
                          value={[PRODUCTION_LEVELS.findIndex(l => l.value === productionLevel)]}
                          onValueChange={(value) => {
                            const level = PRODUCTION_LEVELS[value[0]]?.value;
                            if (level) onProductionLevelChange?.(level);
                          }}
                          min={0}
                          max={PRODUCTION_LEVELS.length - 1}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-[10px] text-white/30">
                          {PRODUCTION_LEVELS.map((level) => (
                            <span key={level.value} className={productionLevel === level.value ? "text-cyan-400 font-medium" : ""}>
                              {level.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ═══════════════════════════════════════════════════════════════ */}
                  {/* VISUAL STYLE */}
                  {/* ═══════════════════════════════════════════════════════════════ */}
                  <Card className="bg-white/[0.02] border-white/[0.06]">
                    <CardContent className="p-5 space-y-4">
                      <SectionHeader
                        icon={Palette}
                        title="Visual Style"
                        description="Override AI style and pacing decisions"
                        iconColor="text-purple-400"
                      />

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label className="text-xs text-white/50">Pacing Override (Optional)</Label>
                          <Slider
                            value={pacingOverride !== undefined ? [pacingOverride] : [50]}
                            onValueChange={(value) => onPacingOverrideChange?.(value[0])}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-[10px] text-white/30">
                            <span className={pacingOverride !== undefined && pacingOverride < 33 ? "text-purple-400 font-medium" : ""}>Calm</span>
                            <span className={pacingOverride !== undefined && pacingOverride >= 33 && pacingOverride < 67 ? "text-purple-400 font-medium" : ""}>Moderate</span>
                            <span className={pacingOverride !== undefined && pacingOverride >= 67 ? "text-purple-400 font-medium" : ""}>Chaotic</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/10 space-y-3">
                          <Label className="text-xs text-white/50">Visual Intensity (Craziness)</Label>
                          <Slider
                            value={visualIntensity !== undefined ? [visualIntensity] : [50]}
                            onValueChange={(value) => onVisualIntensityChange?.(value[0])}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-[10px] text-white/30">
                            <span className={visualIntensity !== undefined && visualIntensity < 33 ? "text-purple-400 font-medium" : ""}>Subtle</span>
                            <span className={visualIntensity !== undefined && visualIntensity >= 33 && visualIntensity < 67 ? "text-purple-400 font-medium" : ""}>Moderate</span>
                            <span className={visualIntensity !== undefined && visualIntensity >= 67 ? "text-purple-400 font-medium" : ""}>Wild</span>
                          </div>
                          <p className="text-[10px] text-white/40">Intensity of wildness of the visuals feel</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </motion.div>
              )}
            </AnimatePresence>
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
            {selectedVideoModel && (
              <>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-sm font-semibold text-white">
                    ${estimatedCost.toFixed(2)}
                  </span>
                  <span className="text-xs text-white/40">per video</span>
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
