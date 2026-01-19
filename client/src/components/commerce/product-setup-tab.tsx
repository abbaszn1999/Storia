import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { VOICE_LIBRARY } from "@/constants/voice-library";
import { 
  Video,
  RectangleHorizontal,
  RectangleVertical,
  Mic,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe,
  Wand2,
  Volume2,
  Music,
  ChevronDown,
  Plus,
  Package,
  Upload,
  Eye,
  X,
  Loader2,
  Sparkles,
  AlertTriangle,
  Image as ImageIcon,
  Play,
  Pause,
  Check,
  Monitor,
  Settings2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

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

const ASPECT_RATIO_CONFIGS = {
  "16:9": { label: "16:9", description: "Landscape", icon: RectangleHorizontal },
  "9:16": { label: "9:16", description: "Portrait", icon: RectangleVertical },
  "7:4": { label: "7:4", description: "Wide Landscape", icon: RectangleHorizontal },
  "4:7": { label: "4:7", description: "Tall Portrait", icon: RectangleVertical },
};

const DURATION_OPTIONS = [12, 24, 36];

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
  { value: "default", label: "General Audience (Default)" },
  { value: "mena", label: "MENA / Arab Region" },
  { value: "western", label: "Western / Minimalist" },
  { value: "asian", label: "Asian / High-Tech" },
  { value: "global", label: "Global Tech-Ad" },
  { value: "luxury", label: "Luxury / Elite" },
  { value: "genz", label: "Gen Z / Youth Culture" },
];

const SOUND_EFFECTS_PRESETS = [
  { value: "ambient", label: "Ambient (Default)" },
  { value: "impact", label: "Impact" },
  { value: "nature", label: "Nature" },
  { value: "urban", label: "Urban" },
  { value: "cinematic", label: "Cinematic" },
  { value: "mechanical", label: "Mechanical" },
];

const MUSIC_PRESETS = [
  { value: "ambient", label: "Ambient (Default)" },
  { value: "orchestral", label: "Orchestral" },
  { value: "electronic", label: "Electronic" },
  { value: "acoustic", label: "Acoustic" },
  { value: "cinematic", label: "Cinematic" },
  { value: "upbeat", label: "Upbeat" },
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
// GLASS PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
}

function GlassPanel({ children, className, glowOnHover = false }: GlassPanelProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-2xl border overflow-hidden p-5",
        "bg-card/80 dark:bg-black/40 backdrop-blur-xl",
        "border-[#e5e7eb] dark:border-white/[0.08]",
        glowOnHover && "transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-500/10",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

interface ProductSetupTabProps {
  videoModel: string;
  videoResolution: string;
  aspectRatio: string;
  duration: number;
  voiceOverEnabled: boolean;
  voiceActorId?: string | null;
  language?: 'ar' | 'en';
  audioVolume?: 'low' | 'medium' | 'high';
  speechTempo?: 'auto' | 'slow' | 'normal' | 'fast' | 'ultra-fast';
  voiceoverScript?: string;
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
  productionLevel?: 'raw' | 'casual' | 'balanced' | 'cinematic' | 'ultra';
  pacingOverride?: number;
  visualIntensity?: number;
  motionPrompt: string;
  targetAudience: string;
  productTitle?: string;
  productDescription?: string;
  onProductTitleChange?: (title: string) => void;
  onProductDescriptionChange?: (description: string) => void;
  productImages?: {
    mode?: 'manual' | 'ai_generated';
    heroProfile?: string | null;
    productAngles?: Array<{ id: string; url: string; uploadedAt: number }>;
    elements?: Array<{ id: string; url: string; uploadedAt: number; description?: string }>;
    aiModeImages?: Array<{ id: string; url: string; uploadedAt: number }>;
    compositeImage?: { 
      url: string; 
      generatedAt: number; 
      mode: 'manual' | 'ai_generated'; 
      sourceImages: string[];
      isApplied?: boolean;
      prompt?: string;
    };
    aiContext?: { description?: string; generatedAt?: number };
  };
  onProductImageUpload?: (type: 'hero' | 'angle' | 'element' | 'ai_mode', file: File, description?: string, existingId?: string) => Promise<void>;
  onProductImageDelete?: (type: 'hero' | 'angle' | 'element' | 'ai_mode', id?: string) => Promise<void>;
  onCompositeGenerate?: (mode: 'manual' | 'ai_generated', context?: string) => Promise<string>;
  onGeneratePrompt?: (context?: string) => Promise<void>;
  onGenerateImage?: (prompt: string, layoutDescription: string, styleGuidance: string, sourceImages: string[], context?: string) => Promise<string>;
  onModeChange?: (mode: 'manual' | 'ai_generated') => void;
  onModeSwitchWithCleanup?: (newMode: 'manual' | 'ai_generated') => Promise<void>;
  onApplyComposite?: () => Promise<void>;
  onRemoveAppliedComposite?: () => void;
  isPromptPreviewOpen?: boolean;
  previewPrompt?: string;
  previewMetadata?: {
    layoutDescription: string;
    styleGuidance: string;
    sourceImages: string[];
  } | null;
  editedPrompt?: string;
  onPromptPreviewOpenChange?: (open: boolean) => void;
  onEditedPromptChange?: (prompt: string) => void;
  onVideoModelChange: (model: string) => void;
  onVideoResolutionChange: (resolution: string) => void;
  onAspectRatioChange: (ratio: string) => void;
  onDurationChange: (duration: number) => void;
  onVoiceOverToggle: (enabled: boolean) => void;
  onVoiceActorChange?: (voiceId: string | null) => void | Promise<void>;
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onAudioVolumeChange?: (volume: 'low' | 'medium' | 'high') => void;
  onSpeechTempoChange?: (tempo: 'auto' | 'slow' | 'normal' | 'fast' | 'ultra-fast') => void;
  onVoiceoverScriptChange?: (script: string) => void;
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
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ProductSetupTab({
  videoModel,
  videoResolution,
  aspectRatio,
  duration,
  voiceOverEnabled,
  voiceActorId = null,
  language,
  audioVolume = 'medium',
  speechTempo = 'auto',
  voiceoverScript = '',
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
  onVoiceActorChange,
  onLanguageChange,
  onAudioVolumeChange,
  onSpeechTempoChange,
  onVoiceoverScriptChange,
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
  onCompositeGenerate,
  onModeChange,
  onModeSwitchWithCleanup,
  onApplyComposite,
  onRemoveAppliedComposite,
}: ProductSetupTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  
  // Local state for visual intensity slider to ensure it updates correctly
  const [localVisualIntensity, setLocalVisualIntensity] = useState<number>(
    typeof visualIntensity === 'number' ? visualIntensity : 50
  );
  
  // Sync local state with prop changes
  useEffect(() => {
    if (typeof visualIntensity === 'number') {
      setLocalVisualIntensity(visualIntensity);
    }
  }, [visualIntensity]);
  
  // Auto-select default voice based on language
  useEffect(() => {
    if (voiceOverEnabled && !voiceActorId && language) {
      // Get first voice for the selected language
      const defaultVoice = VOICE_LIBRARY.find(v => v.language === language);
      if (defaultVoice && onVoiceActorChange) {
        console.log(`[ProductSetup] Auto-selecting default voice for ${language}:`, defaultVoice.id);
        onVoiceActorChange(defaultVoice.id);
      }
    }
  }, [language, voiceOverEnabled, voiceActorId, onVoiceActorChange]);
  
  // State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState<'hero' | 'angle' | 'element' | 'ai_reference' | 'ai_mode' | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isGeneratingComposite, setIsGeneratingComposite] = useState(false);
  const [isCompositeModalOpen, setIsCompositeModalOpen] = useState(false);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [localMode, setLocalMode] = useState<'manual' | 'ai_generated'>(productImages?.mode || 'manual');
  
  // Sync local state when props change
  useEffect(() => {
    if (productImages?.mode) {
      setLocalMode(productImages.mode);
    }
  }, [productImages?.mode]);
  
  // Cleanup voice audio on unmount
  useEffect(() => {
    return () => {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current = null;
      }
    };
  }, []);

  // Voice preview handler
  const playVoicePreview = (voiceId: string, previewUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingVoice === voiceId) {
      voiceAudioRef.current?.pause();
      setPlayingVoice(null);
      voiceAudioRef.current = null;
    } else {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
      }
      voiceAudioRef.current = new Audio(previewUrl);
      voiceAudioRef.current.play().catch(() => setPlayingVoice(null));
      setPlayingVoice(voiceId);
      voiceAudioRef.current.onended = () => setPlayingVoice(null);
    }
  };

  // Computed values
  const currentMode = localMode;
  const generateId = () => `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const selectedVideoModel = SORA_MODELS.find(m => m.value === videoModel);
  const availableAspectRatios = selectedVideoModel?.aspectRatios || ["16:9", "9:16"];
  const resolutionDims = RESOLUTION_DIMENSIONS[videoModel]?.[aspectRatio];
  const resolutionLabel = resolutionDims ? `720p (${resolutionDims.width}×${resolutionDims.height})` : "720p";
  const estimatedCost = selectedVideoModel?.cost || 0;
  const estimatedTime = selectedVideoModel?.estimatedTime || "4-5 min";
  
  // Validation states
  const isEngineReady = videoModel && (videoModel === 'sora-2' || videoModel === 'sora-2-pro');
  const isCanvasSet = aspectRatio && DURATION_OPTIONS.includes(duration);
  const isDirectionSet = motionPrompt.trim().length > 0 && targetAudience !== "";
  
  // Auto-adjust aspect ratio if current selection is invalid
  React.useEffect(() => {
    if (selectedVideoModel && !availableAspectRatios.includes(aspectRatio)) {
      onAspectRatioChange(availableAspectRatios[0]);
    }
  }, [videoModel, aspectRatio, availableAspectRatios, onAspectRatioChange, selectedVideoModel]);
  
  // Accent color for gradient
  const accentClasses = "from-emerald-500 to-teal-600";

  return (
    <motion.div 
      className="flex w-full h-[calc(100vh-12rem)] gap-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* LEFT COLUMN: SETTINGS (40%) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className={cn(
        "w-[40%] min-w-[400px] max-w-[560px] flex-shrink-0 h-full",
        "bg-card/80 dark:bg-black/40 backdrop-blur-xl",
        "border-r border-[#e5e7eb] dark:border-white/[0.08]",
        "flex flex-col overflow-hidden"
      )}>
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-5 pb-12">
        
        {/* ─────────────────────────────────────────────────────────────────── */}
            {/* PRODUCT INFORMATION */}
        {/* ─────────────────────────────────────────────────────────────────── */}
            <GlassPanel glowOnHover>
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-foreground">Product Information</h3>
            </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Premium Wireless Headphones"
                    value={productTitle || ''}
                    onChange={(e) => onProductTitleChange?.(e.target.value)}
                    className={cn(
                      "h-11 bg-muted/50 dark:bg-white/[0.03] border border-[#e5e7eb] dark:border-white/[0.08]",
                      "text-foreground placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50",
                      "transition-all duration-200"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Product Description
                  </label>
                  <Textarea
                    placeholder="Key features and benefits of your product..."
                    value={productDescription || ''}
                    onChange={(e) => onProductDescriptionChange?.(e.target.value)}
                        className={cn(
                      "min-h-[80px] resize-none bg-muted/50 dark:bg-white/[0.03] border border-[#e5e7eb] dark:border-white/[0.08]",
                      "text-foreground placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    )}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Optional: Helps AI understand your product better
                  </p>
                      </div>
                          </div>
            </GlassPanel>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* VIDEO SETTINGS */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <GlassPanel glowOnHover>
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-foreground">Video Settings</h3>
                                    </div>

              <div className="space-y-5">
                {/* Model Selector */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Model</label>
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
                    <SelectTrigger className="h-11 bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-white/[0.08] text-foreground focus:ring-emerald-500/50">
                      <SelectValue placeholder="Select Sora model">
                        {selectedVideoModel && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedVideoModel.label}</span>
                            <span className="text-xs text-muted-foreground">• {selectedVideoModel.provider}</span>
                            {selectedVideoModel.badge && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300">
                                {selectedVideoModel.badge}
                              </Badge>
                            )}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-card dark:bg-[#0a0a0a] border-[#e5e7eb] dark:border-white/[0.08] [&_svg]:text-emerald-500">
                      {SORA_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value} className="py-3 focus:bg-emerald-500/20 focus:text-emerald-400 data-[highlighted]:bg-emerald-500/20 data-[highlighted]:text-emerald-400">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{model.label}</span>
                              <span className="text-xs text-muted-foreground">{model.provider}</span>
                              {model.badge && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{model.badge}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{model.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-3">
                    {availableAspectRatios.map((ratioValue) => {
                      const ratioConfig = ASPECT_RATIO_CONFIGS[ratioValue as keyof typeof ASPECT_RATIO_CONFIGS];
                      if (!ratioConfig) return null;
                      const Icon = ratioConfig.icon;
                      return (
                        <button
                          key={ratioValue}
                          onClick={() => onAspectRatioChange(ratioValue)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                            aspectRatio === ratioValue
                              ? "bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border-emerald-500/50 dark:border-emerald-500/50"
                              : "bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-white/[0.08] hover:bg-muted dark:hover:bg-white/[0.06]"
                          )}
                        >
                          <Icon className={cn(
                            "w-5 h-5",
                            aspectRatio === ratioValue ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                          )} />
                          <span className={cn(
                            "text-sm font-medium",
                            aspectRatio === ratioValue ? "text-emerald-600 dark:text-emerald-300" : "text-foreground"
                          )}>
                            {ratioConfig.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{ratioConfig.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Duration</label>
                  <div className="flex gap-2">
                    {DURATION_OPTIONS.map((dur) => (
                      <button
                        key={dur}
                        onClick={() => onDurationChange(dur)}
                        className={cn(
                          "flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                          duration === dur
                            ? "bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/50 text-emerald-600 dark:text-emerald-300"
                            : "bg-muted/50 dark:bg-white/[0.03] border border-[#e5e7eb] dark:border-white/[0.08] text-foreground hover:bg-muted dark:hover:bg-white/[0.06]"
                        )}
                      >
                        {dur}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution Display */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Resolution</label>
                  <div className="px-4 py-2.5 bg-muted/30 dark:bg-white/[0.02] border border-[#e5e7eb] dark:border-white/[0.08] rounded-lg text-sm text-muted-foreground">
                    {resolutionLabel}
                  </div>
                </div>
              </div>
            </GlassPanel>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* STRATEGIC CONTEXT */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <GlassPanel glowOnHover>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-semibold text-foreground">Strategic Context</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Target Audience & Region <span className="text-red-500">*</span>
                  </label>
                  <Select value={targetAudience || "default"} onValueChange={onTargetAudienceChange}>
                    <SelectTrigger className="h-11 bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-white/[0.08] text-foreground focus:ring-emerald-500/50">
                      <SelectValue placeholder="Select target audience..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card dark:bg-[#0a0a0a] border-[#e5e7eb] dark:border-white/[0.08] [&_svg]:text-emerald-500">
                      {AUDIENCES.map((audience) => (
                        <SelectItem key={audience.value} value={audience.value} className="py-2 focus:bg-emerald-500/20 focus:text-emerald-400 data-[highlighted]:bg-emerald-500/20 data-[highlighted]:text-emerald-400">
                          {audience.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Creative Direction <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={motionPrompt}
                    onChange={(e) => onMotionPromptChange(e.target.value)}
                    placeholder="Cinematic macro lighting, shallow depth of field, smooth dolly zoom..."
                    className={cn(
                      "min-h-[100px] resize-none bg-muted/50 dark:bg-white/[0.03] border border-[#e5e7eb] dark:border-white/[0.08]",
                      "text-foreground placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50"
                    )}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Define camera movement, lighting, and visual style
                  </p>
                  </div>
                </div>
            </GlassPanel>

        {/* ─────────────────────────────────────────────────────────────────── */}
            {/* VOICEOVER SETTINGS */}
        {/* ─────────────────────────────────────────────────────────────────── */}
            <GlassPanel glowOnHover>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-foreground">Voiceover</h3>
                        </div>
                        <Switch
                          checked={voiceOverEnabled}
                          onCheckedChange={onVoiceOverToggle}
                  className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>

              <AnimatePresence>
                      {voiceOverEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Language</label>
                            <Select value={language || 'en'} onValueChange={(value) => onLanguageChange(value as 'ar' | 'en')}>
                        <SelectTrigger className="h-10 bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-white/[0.08] text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                        <SelectContent className="bg-card dark:bg-[#0a0a0a] border-[#e5e7eb] dark:border-white/[0.08] [&_svg]:text-emerald-500">
                                {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value} className="py-2 focus:bg-emerald-500/20 focus:text-emerald-400 data-[highlighted]:bg-emerald-500/20 data-[highlighted]:text-emerald-400">
                                    {lang.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Voice Selection</label>
                            <Popover open={voiceDropdownOpen} onOpenChange={setVoiceDropdownOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                            className="w-full h-10 justify-between bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-white/[0.08] text-foreground hover:bg-muted dark:hover:bg-white/[0.06]"
                                >
                            <span className={voiceActorId ? "font-medium" : "text-muted-foreground"}>
                                    {voiceActorId 
                                      ? VOICE_LIBRARY.find(v => v.id === voiceActorId)?.name || "Select a voice"
                                      : "Select a voice"}
                                  </span>
                                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-0 bg-card dark:bg-[#0a0a0a] border-[#e5e7eb] dark:border-white/[0.08]" align="start">
                          <ScrollArea className="h-[280px]">
                                  <div className="p-1">
                              {VOICE_LIBRARY.filter(v => v.language === language).map((voice) => (
                                      <div
                                        key={voice.id}
                                  className="flex items-center gap-2 px-2 py-2.5 hover:bg-muted dark:hover:bg-white/[0.06] rounded-md cursor-pointer transition-colors"
                                        onClick={() => {
                                          onVoiceActorChange?.(voice.id);
                                          setVoiceDropdownOpen(false);
                                        }}
                                      >
                                        <div className="flex items-center gap-2 flex-1">
                                    {voiceActorId === voice.id && <Check className="h-4 w-4 text-emerald-500" />}
                                          <div className="flex-1">
                                      <div className={cn("text-sm", voiceActorId === voice.id ? "font-medium" : "")}>
                                              {voice.name}
                                            </div>
                                      <div className="text-xs text-muted-foreground">
                                              {voice.gender} · {voice.style} · {voice.collection}
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                    className="h-8 w-8 shrink-0 hover:bg-muted dark:hover:bg-white/[0.08]"
                                    onClick={(e) => playVoicePreview(voice.id, voice.previewUrl, e)}
                                        >
                                          {playingVoice === voice.id ? (
                                      <Pause className="h-4 w-4 text-muted-foreground" />
                                          ) : (
                                      <Play className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Audio Volume</label>
                            <div className="flex gap-2">
                              {(['low', 'medium', 'high'] as const).map((vol) => (
                                <button
                                  key={vol}
                                  onClick={() => onAudioVolumeChange?.(vol)}
                                  className={cn(
                              "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize",
                                    audioVolume === vol
                                ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-600 dark:text-emerald-300"
                                : "bg-muted/50 dark:bg-white/[0.03] border border-[#e5e7eb] dark:border-white/[0.08] text-foreground hover:bg-muted dark:hover:bg-white/[0.06]"
                                  )}
                                >
                                  {vol}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Speech Tempo</label>
                            <Select 
                              value={speechTempo || 'auto'} 
                              onValueChange={(value) => onSpeechTempoChange?.(value as 'auto' | 'slow' | 'normal' | 'fast' | 'ultra-fast')}
                            >
                        <SelectTrigger className="h-10 bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-white/[0.08] text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                        <SelectContent className="bg-card dark:bg-[#0a0a0a] border-[#e5e7eb] dark:border-white/[0.08] [&_svg]:text-emerald-500">
                                {SPEECH_TEMPO_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="py-2 focus:bg-emerald-500/20 focus:text-emerald-400 data-[highlighted]:bg-emerald-500/20 data-[highlighted]:text-emerald-400">
                                    <div>
                                      <div className="font-medium">{option.label}</div>
                                <div className="text-[10px] text-muted-foreground">{option.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                    <div className="space-y-2 pt-3 border-t border-[#e5e7eb] dark:border-white/[0.08]">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                Voiceover Script (Optional)
                      </label>
                              <Textarea
                                value={voiceoverScript || ''}
                                onChange={(e) => onVoiceoverScriptChange?.(e.target.value)}
                                placeholder="Write your voiceover script here, or leave empty for AI to generate..."
                        className={cn(
                          "min-h-[100px] resize-none bg-muted/50 dark:bg-white/[0.03] border border-[#e5e7eb] dark:border-white/[0.08]",
                          "text-foreground placeholder:text-muted-foreground/50 text-sm"
                        )}
                              />
                      <p className="text-xs text-muted-foreground italic">
                                Leave empty to let AI generate the script based on your visual beats.
                              </p>
                            </div>

                            <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Custom Voiceover Instructions (Optional)
                      </label>
                              <Textarea
                                value={customVoiceoverInstructions}
                                onChange={(e) => onCustomVoiceoverInstructionsChange?.(e.target.value)}
                                placeholder="e.g., 'warm and inviting narration' or 'energetic and confident'"
                        className={cn(
                          "min-h-[60px] resize-none bg-muted/50 dark:bg-white/[0.03] border border-[#e5e7eb] dark:border-white/[0.08]",
                          "text-foreground placeholder:text-muted-foreground/50 text-sm"
                        )}
                              />
                            </div>
                        </motion.div>
                      )}
              </AnimatePresence>
            </GlassPanel>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* SOUND EFFECTS */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <GlassPanel glowOnHover>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <h3 className="font-semibold text-foreground">Sound Effects</h3>
                        </div>
                        <Switch
                          checked={soundEffectsEnabled}
                          onCheckedChange={onSoundEffectsToggle}
                  className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>

              <AnimatePresence>
                      {soundEffectsEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                            <RadioGroup
                              value={soundEffectsUsePreset ? "preset" : "custom"}
                              onValueChange={(value) => onSoundEffectsUsePresetChange?.(value === "preset")}
                              className="flex gap-4"
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="preset" id="sfx-preset" className="border-emerald-500 text-emerald-500" />
                        <Label htmlFor="sfx-preset" className="text-xs text-foreground cursor-pointer">Use Preset</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="custom" id="sfx-custom" className="border-emerald-500 text-emerald-500" />
                        <Label htmlFor="sfx-custom" className="text-xs text-foreground cursor-pointer">Custom</Label>
                              </div>
                            </RadioGroup>

                          {soundEffectsUsePreset ? (
                              <Select value={soundEffectsPreset || "ambient"} onValueChange={(value) => onSoundEffectsPresetChange?.(value)}>
                        <SelectTrigger className="h-10 bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-white/[0.08] text-foreground">
                                  <SelectValue placeholder="Select sound effects..." />
                                </SelectTrigger>
                        <SelectContent className="bg-card dark:bg-[#0a0a0a] border-[#e5e7eb] dark:border-white/[0.08] [&_svg]:text-emerald-500">
                                  {SOUND_EFFECTS_PRESETS.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value} className="focus:bg-emerald-500/20 focus:text-emerald-400 data-[highlighted]:bg-emerald-500/20 data-[highlighted]:text-emerald-400">{preset.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                          ) : (
                              <Textarea
                                value={soundEffectsCustomInstructions}
                                onChange={(e) => onSoundEffectsCustomChange?.(e.target.value)}
                        placeholder="e.g., 'subtle ambient sounds of nature'"
                        className="min-h-[60px] resize-none bg-muted/50 dark:bg-white/[0.03] border border-[#e5e7eb] dark:border-white/[0.08] text-foreground placeholder:text-muted-foreground/50 text-sm"
                              />
                          )}
                        </motion.div>
                      )}
              </AnimatePresence>
            </GlassPanel>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* MUSIC */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <GlassPanel glowOnHover>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-foreground">Music</h3>
                        </div>
                        <Switch
                          checked={musicEnabled}
                          onCheckedChange={onMusicToggle}
                  className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>

              <AnimatePresence>
                      {musicEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                            <RadioGroup
                              value={musicUsePreset ? "preset" : "custom"}
                              onValueChange={(value) => onMusicUsePresetChange?.(value === "preset")}
                              className="flex gap-4"
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="preset" id="music-preset" className="border-emerald-500 text-emerald-500" />
                        <Label htmlFor="music-preset" className="text-xs text-foreground cursor-pointer">Use Preset</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="custom" id="music-custom" className="border-emerald-500 text-emerald-500" />
                        <Label htmlFor="music-custom" className="text-xs text-foreground cursor-pointer">Custom</Label>
                              </div>
                            </RadioGroup>

                          {musicUsePreset ? (
                              <Select value={musicPreset || "ambient"} onValueChange={(value) => onMusicPresetChange?.(value)}>
                        <SelectTrigger className="h-10 bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-white/[0.08] text-foreground">
                                  <SelectValue placeholder="Select music style..." />
                                </SelectTrigger>
                        <SelectContent className="bg-card dark:bg-[#0a0a0a] border-[#e5e7eb] dark:border-white/[0.08] [&_svg]:text-emerald-500">
                                  {MUSIC_PRESETS.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value} className="focus:bg-emerald-500/20 focus:text-emerald-400 data-[highlighted]:bg-emerald-500/20 data-[highlighted]:text-emerald-400">{preset.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                          ) : (
                              <Textarea
                                value={musicCustomInstructions}
                                onChange={(e) => onMusicCustomChange?.(e.target.value)}
                        placeholder="e.g., 'orchestral music building to crescendo'"
                        className="min-h-[60px] resize-none bg-muted/50 dark:bg-white/[0.03] border border-[#e5e7eb] dark:border-white/[0.08] text-foreground placeholder:text-muted-foreground/50 text-sm"
                              />
                          )}

                          <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Music Mood</label>
                            <Input
                              value={musicMood}
                              onChange={(e) => onMusicMoodChange?.(e.target.value)}
                              placeholder="e.g., Uplifting, tense, emotional..."
                        className="h-10 bg-muted/50 dark:bg-white/[0.03] border-[#e5e7eb] dark:border-white/[0.08] text-foreground text-sm"
                            />
                          </div>
                        </motion.div>
                      )}
              </AnimatePresence>
            </GlassPanel>

            {/* ─────────────────────────────────────────────────────────────────── */}
                  {/* QUALITY SETTINGS */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <GlassPanel glowOnHover>
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-semibold text-foreground">Quality & Style</h3>
              </div>

              <div className="space-y-5">
                      <div className="space-y-3">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Production Level</label>
                        <Slider
                          value={[PRODUCTION_LEVELS.findIndex(l => l.value === productionLevel)]}
                          onValueChange={(value) => {
                            const level = PRODUCTION_LEVELS[value[0]]?.value;
                      if (level) onProductionLevelChange?.(level as any);
                          }}
                          min={0}
                          max={PRODUCTION_LEVELS.length - 1}
                          step={1}
                          className="w-full [&>span>span]:bg-emerald-500 [&>span:last-child]:border-emerald-500"
                        />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                          {PRODUCTION_LEVELS.map((level) => (
                      <span key={level.value} className={productionLevel === level.value ? "text-emerald-500 dark:text-emerald-400 font-medium" : ""}>
                              {level.label}
                            </span>
                          ))}
                        </div>
                      </div>

                <div className="space-y-3 pt-3 border-t border-[#e5e7eb] dark:border-white/[0.08]">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Visual Intensity</label>
                          <Slider
                            value={[localVisualIntensity]}
                            onValueChange={(value) => {
                              const newValue = value[0];
                              console.log('[ProductSetup] Visual Intensity changed:', newValue, 'current local:', localVisualIntensity, 'current prop:', visualIntensity);
                              setLocalVisualIntensity(newValue);
                              if (onVisualIntensityChange) {
                                onVisualIntensityChange(newValue);
                              } else {
                                console.warn('[ProductSetup] onVisualIntensityChange is not defined!');
                              }
                            }}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full [&>span>span]:bg-emerald-500 [&>span:last-child]:border-emerald-500"
                          />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className={localVisualIntensity < 33 ? "text-emerald-500 dark:text-emerald-400 font-medium" : ""}>Subtle</span>
                    <span className={localVisualIntensity >= 33 && localVisualIntensity < 67 ? "text-emerald-500 dark:text-emerald-400 font-medium" : ""}>Moderate</span>
                    <span className={localVisualIntensity >= 67 ? "text-emerald-500 dark:text-emerald-400 font-medium" : ""}>Wild</span>
                          </div>
                        </div>

                {/* Pacing Override - Shot Speed */}
                <div className="space-y-3 pt-3 border-t border-[#e5e7eb] dark:border-white/[0.08]">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pacing</label>
                  <Slider
                    value={[pacingOverride ?? 50]}
                    onValueChange={(value) => {
                      const newValue = value[0];
                      if (onPacingOverrideChange) {
                        onPacingOverrideChange(newValue);
                      }
                    }}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full [&>span>span]:bg-emerald-500 [&>span:last-child]:border-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className={(pacingOverride ?? 50) < 33 ? "text-emerald-500 dark:text-emerald-400 font-medium" : ""}>Slow</span>
                    <span className={(pacingOverride ?? 50) >= 33 && (pacingOverride ?? 50) < 67 ? "text-emerald-500 dark:text-emerald-400 font-medium" : ""}>Balanced</span>
                    <span className={(pacingOverride ?? 50) >= 67 ? "text-emerald-500 dark:text-emerald-400 font-medium" : ""}>Fast</span>
                  </div>
                </div>
                          </div>
            </GlassPanel>

          </div>
        </ScrollArea>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* RIGHT COLUMN: PRODUCT IMAGE (60%) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative flex flex-col overflow-hidden h-full m-4 rounded-2xl bg-card/80 dark:bg-black/40 backdrop-blur-xl border border-[#e5e7eb] dark:border-white/[0.08]">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-[#e5e7eb] dark:border-white/[0.08] rounded-t-2xl">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl bg-gradient-to-br", accentClasses)}>
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Product Reference Image</h3>
                <p className="text-xs text-muted-foreground">Upload images for Sora video generation</p>
              </div>
            </div>
            
            {/* Validation Status */}
            <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                {isEngineReady ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                <span className={cn("text-xs font-medium", isEngineReady ? "text-foreground" : "text-muted-foreground")}>Engine</span>
              </div>
              <div className="flex items-center gap-2">
                {isCanvasSet ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                <span className={cn("text-xs font-medium", isCanvasSet ? "text-foreground" : "text-muted-foreground")}>Canvas</span>
              </div>
              <div className="flex items-center gap-2">
                {isDirectionSet ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                <span className={cn("text-xs font-medium", isDirectionSet ? "text-foreground" : "text-muted-foreground")}>Direction</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Upload Mode Tabs */}
            <Tabs 
              value={currentMode} 
              onValueChange={(value) => {
                const newMode = value as 'manual' | 'ai_generated';
                setLocalMode(newMode);
                onModeChange?.(newMode);
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 dark:bg-white/[0.03] border border-[#e5e7eb] dark:border-white/[0.08] p-1 rounded-xl">
                <TabsTrigger 
                  value="manual" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-600/20 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-300 rounded-lg"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Manual Upload
                </TabsTrigger>
                <TabsTrigger 
                  value="ai_generated"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-600/20 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-300 rounded-lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Generate
                </TabsTrigger>
              </TabsList>

              {/* Manual Upload Tab */}
              <TabsContent value="manual" className="mt-6 space-y-6">
                {/* Hero Product Image - Large */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">
                    Hero Product Image <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-6 items-start">
                    <div
                      onClick={() => !productImages?.heroProfile && !isUploading && fileInputRef.current?.click()}
                      className={cn(
                        "relative aspect-square w-[200px] rounded-2xl border-2 cursor-pointer transition-all overflow-hidden group",
                        productImages?.heroProfile 
                          ? "border-emerald-500/50 bg-muted/30 dark:bg-white/[0.02]" 
                          : "border-dashed border-[#e5e7eb] dark:border-white/[0.15] bg-muted/30 dark:bg-white/[0.02] hover:border-emerald-500/50 hover:bg-muted/50 dark:hover:bg-white/[0.04]"
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
                          setUploadingType('hero');
                          try {
                            await onProductImageUpload('hero', file);
                          } finally {
                            setIsUploading(false);
                            setUploadingType(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }
                        }}
                      />
                      
                      {isUploading && uploadingType === 'hero' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                        </div>
                      ) : productImages?.heroProfile ? (
                        <>
                          <img src={productImages.heroProfile} alt="Hero Profile" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <button
                            onClick={(e) => { e.stopPropagation(); onProductImageDelete?.('hero'); }}
                            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600/80"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                          <div className={cn("p-3 rounded-xl bg-gradient-to-br", accentClasses)}>
                            <Upload className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">Click to upload</p>
                            <p className="text-xs text-muted-foreground mt-1">Main product image</p>
                          </div>
                        </div>
                      )}
            </div>

                    {/* Quick Tips */}
                    <div className="flex-1 space-y-2 pt-2">
                      <p className="text-xs text-muted-foreground">
                        Upload a high-quality image of your product. This will be the main reference for AI video generation.
                      </p>
                      <ul className="text-xs text-muted-foreground/70 space-y-1">
                        <li>• Clear, well-lit product shot</li>
                        <li>• No human faces</li>
                        <li>• PNG or JPG format</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Product Angles & Elements Grid */}
                {!productImages?.compositeImage?.isApplied && (
                  <div className="grid grid-cols-2 gap-6">
                    {/* Product Angles */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-foreground">
                        Product Angles <span className="text-muted-foreground font-normal text-xs">(up to 2)</span>
                      </Label>
                      <div className="flex flex-wrap gap-3">
                        {productImages?.productAngles?.map((angle, index) => (
                          <div
                            key={angle.id}
                            className="relative aspect-square w-[120px] rounded-xl border-2 border-[#e5e7eb] dark:border-white/[0.1] bg-muted/30 dark:bg-white/[0.02] overflow-hidden group cursor-pointer hover:border-emerald-500/30 transition-all"
                          >
                            <img src={angle.url} alt={`Angle ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                            <button
                              onClick={(e) => { e.stopPropagation(); onProductImageDelete?.('angle', angle.id); }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {(!productImages?.productAngles || productImages.productAngles.length < 2) && (
                          <div
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (!file || !onProductImageUpload) return;
                                setIsUploading(true);
                                setUploadingType('angle');
                                try { await onProductImageUpload('angle', file); } 
                                finally { setIsUploading(false); setUploadingType(null); }
                              };
                              input.click();
                            }}
                            className="flex items-center justify-center aspect-square w-[120px] rounded-xl border-2 border-dashed border-[#e5e7eb] dark:border-white/[0.15] bg-muted/30 dark:bg-white/[0.02] cursor-pointer hover:border-emerald-500/30 hover:bg-muted/50 dark:hover:bg-white/[0.04] transition-all"
                          >
                            {isUploading && uploadingType === 'angle' && !uploadingId ? (
                              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                            ) : (
                              <Plus className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
            </div>

                    {/* Elements */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-foreground">
                        Elements <span className="text-muted-foreground font-normal text-xs">(up to 3)</span>
                      </Label>
                      <div className="flex flex-wrap gap-3">
                        {productImages?.elements?.map((element, index) => (
                          <div
                            key={element.id}
                            className="relative aspect-square w-[120px] rounded-xl border-2 border-[#e5e7eb] dark:border-white/[0.1] bg-muted/30 dark:bg-white/[0.02] overflow-hidden group cursor-pointer hover:border-teal-500/30 transition-all"
                          >
                            <img src={element.url} alt={`Element ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                            <button
                              onClick={(e) => { e.stopPropagation(); onProductImageDelete?.('element', element.id); }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {(!productImages?.elements || productImages.elements.length < 3) && (
                          <div
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (!file || !onProductImageUpload) return;
                                setIsUploading(true);
                                setUploadingType('element');
                                try { await onProductImageUpload('element', file); } 
                                finally { setIsUploading(false); setUploadingType(null); }
                              };
                              input.click();
                            }}
                            className="flex items-center justify-center aspect-square w-[120px] rounded-xl border-2 border-dashed border-[#e5e7eb] dark:border-white/[0.15] bg-muted/30 dark:bg-white/[0.02] cursor-pointer hover:border-teal-500/30 hover:bg-muted/50 dark:hover:bg-white/[0.04] transition-all"
                          >
                            {isUploading && uploadingType === 'element' && !uploadingId ? (
                              <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                            ) : (
                              <Plus className="w-6 h-6 text-muted-foreground" />
                            )}
            </div>
                        )}
          </div>
                </div>
                </div>
                )}

                {/* Generate Composite Button - Only show if Hero + (Angles OR Elements) */}
                {productImages?.heroProfile && 
                 !productImages?.compositeImage && 
                 ((productImages?.productAngles && productImages.productAngles.length > 0) || 
                  (productImages?.elements && productImages.elements.length > 0)) && (
                  <div className="pt-4 border-t border-[#e5e7eb] dark:border-white/[0.08]">
                    <Button
                      onClick={async () => {
                        if (onCompositeGenerate) {
                          setIsGeneratingComposite(true);
                          try { await onCompositeGenerate('manual'); } 
                          finally { setIsGeneratingComposite(false); }
                        }
                      }}
                      disabled={isGeneratingComposite}
                      className={cn(
                        "w-full h-12 bg-gradient-to-r", accentClasses,
                        "text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                      )}
                    >
                      {isGeneratingComposite ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating Composite...</>
                      ) : (
                        <><ImageIcon className="w-5 h-5 mr-2" />Generate Composite Image</>
                      )}
                    </Button>
          </div>
                )}

                {/* Composite Preview */}
                {productImages?.compositeImage && productImages.compositeImage.mode === 'manual' && !productImages.compositeImage.isApplied && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-4 border-t border-[#e5e7eb] dark:border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Composite Preview</h4>
                        <p className="text-xs text-muted-foreground">{productImages.compositeImage.sourceImages.length} images combined</p>
        </div>
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-300">Ready to Apply</Badge>
      </div>

                    <div 
                      className="relative aspect-video rounded-xl border border-[#e5e7eb] dark:border-white/[0.1] bg-muted/30 dark:bg-white/[0.02] overflow-hidden cursor-pointer group"
                      onClick={() => setIsCompositeModalOpen(true)}
                    >
                      <img src={productImages.compositeImage.url} alt="Composite" className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform" />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="secondary" className="text-xs"><Eye className="w-3 h-3 mr-1" />Enlarge</Badge>
          </div>
                    </div>

                    <div className="flex gap-3">
            <Button
              variant="outline"
                        onClick={async () => {
                          if (onCompositeGenerate) {
                            setIsGeneratingComposite(true);
                            try { await onCompositeGenerate('manual'); } 
                            finally { setIsGeneratingComposite(false); }
                          }
                        }}
                        disabled={isGeneratingComposite}
                        className="flex-1 h-10 border-[#e5e7eb] dark:border-white/[0.15] hover:bg-muted dark:hover:bg-white/[0.06]"
                      >
                        {isGeneratingComposite ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Regenerating...</> : <><ImageIcon className="w-4 h-4 mr-2" />Regenerate</>}
            </Button>
            <Button
                        onClick={async () => { if (onApplyComposite) await onApplyComposite(); }}
                        className={cn("flex-1 h-10 bg-gradient-to-r", accentClasses, "text-white font-medium hover:opacity-90")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />Apply Composite
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Applied Composite */}
                {productImages?.compositeImage && productImages.compositeImage.mode === 'manual' && productImages.compositeImage.isApplied && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-4 border-t border-[#e5e7eb] dark:border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Applied Composite</h4>
                        <p className="text-xs text-muted-foreground">{productImages.compositeImage.sourceImages.length} images combined</p>
                      </div>
                      <Badge variant="outline" className="border-green-500/30 text-green-600 dark:text-green-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" />Applied
                      </Badge>
                    </div>
                    
                    <div className="relative aspect-video rounded-xl border border-[#e5e7eb] dark:border-white/[0.1] bg-muted/30 dark:bg-white/[0.02] overflow-hidden cursor-pointer group" onClick={() => setIsCompositeModalOpen(true)}>
                      <img src={productImages.compositeImage.url} alt="Applied Composite" className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform" />
                    </div>

                    <Button variant="destructive" onClick={() => onRemoveAppliedComposite?.()} className="w-full h-10">
                      <X className="w-4 h-4 mr-2" />Remove Applied Composite
                    </Button>
                  </motion.div>
                )}
              </TabsContent>

              {/* AI Generate Tab */}
              <TabsContent value="ai_generated" className="mt-6 space-y-6">
                {/* Reference Image Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">
                    Reference Image <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-6 items-start">
                    <div
              onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file || !onProductImageUpload) return;
                          setIsUploading(true);
                          setUploadingType('ai_reference');
                          try { await onProductImageUpload('hero', file); } 
                          finally { setIsUploading(false); setUploadingType(null); }
                        };
                        input.click();
                      }}
                      className={cn(
                        "relative aspect-square w-[200px] rounded-2xl border-2 cursor-pointer transition-all overflow-hidden group",
                        productImages?.heroProfile 
                          ? "border-teal-500/50 bg-muted/30 dark:bg-white/[0.02]" 
                          : "border-dashed border-[#e5e7eb] dark:border-white/[0.15] bg-muted/30 dark:bg-white/[0.02] hover:border-teal-500/50 hover:bg-muted/50 dark:hover:bg-white/[0.04]"
                      )}
                    >
                      {isUploading && uploadingType === 'ai_reference' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                        </div>
                      ) : productImages?.heroProfile ? (
                        <>
                          <img src={productImages.heroProfile} alt="Reference" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <button
                            onClick={(e) => { e.stopPropagation(); onProductImageDelete?.('hero'); }}
                            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600/80"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                            <Upload className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">Click to upload</p>
                            <p className="text-xs text-muted-foreground mt-1">Reference image</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* AI Tips */}
                    <div className="flex-1 space-y-2 pt-2">
                      <p className="text-xs text-muted-foreground">
                        Upload a reference image and let AI generate product visuals for your campaign.
                      </p>
                      <ul className="text-xs text-muted-foreground/70 space-y-1">
                        <li>• Product image or concept</li>
                        <li>• AI will generate variations</li>
                        <li>• Best for creative concepts</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Additional Images (AI Mode) - Up to 6 total (heroProfile + aiModeImages) */}
                {productImages?.heroProfile && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground">
                      Additional Images <span className="text-muted-foreground font-normal text-xs">(Optional, up to {6 - (productImages?.aiModeImages?.length || 0) - 1} more)</span>
                    </Label>
                    <div className="flex flex-wrap gap-3">
                      {/* Display existing aiModeImages */}
                      {productImages?.aiModeImages?.map((img, index) => (
                        <div
                          key={img.id}
                          className="relative aspect-square w-[120px] rounded-xl border-2 border-teal-500/50 bg-muted/30 dark:bg-white/[0.02] overflow-hidden group cursor-pointer hover:border-teal-500/70 transition-all"
                        >
                          <img src={img.url} alt={`Additional ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                          <button
                            onClick={(e) => { e.stopPropagation(); onProductImageDelete?.('ai_mode', img.id); }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      
                      {/* Upload button for additional images */}
                      {(!productImages?.aiModeImages || productImages.aiModeImages.length < 5) && (
                        <div
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.multiple = true; // ✅ Allow multiple file selection
                            input.onchange = async (e) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (!files || !onProductImageUpload) return;
                              
                              const currentCount = productImages?.aiModeImages?.length || 0;
                              const maxAllowed = 5 - currentCount; // Max 5 additional (1 hero = 6 total)
                              const filesToUpload = Array.from(files).slice(0, maxAllowed);
                              
                              if (files.length > maxAllowed) {
                    toast({
                                  title: "Too many images",
                                  description: `You can only upload up to ${maxAllowed} more image(s). Only the first ${maxAllowed} will be uploaded.`,
                      variant: "destructive",
                    });
                  }
                              
                              setIsUploading(true);
                              setUploadingType('ai_mode');
                              try {
                                // Upload files sequentially
                                for (const file of filesToUpload) {
                                  await onProductImageUpload('ai_mode', file);
                                }
                              } finally {
                                setIsUploading(false);
                                setUploadingType(null);
                              }
                            };
                            input.click();
                          }}
                          className="flex items-center justify-center aspect-square w-[120px] rounded-xl border-2 border-dashed border-teal-500/50 bg-muted/30 dark:bg-white/[0.02] cursor-pointer hover:border-teal-500/70 hover:bg-muted/50 dark:hover:bg-white/[0.04] transition-all"
                        >
                          {isUploading && uploadingType === 'ai_mode' ? (
                            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                          ) : (
                            <Plus className="w-6 h-6 text-teal-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload up to 5 additional images (6 total including reference). All images will be used as reference for AI generation.
                    </p>
                  </div>
                )}

                {/* AI Generation Prompt */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">
                    Generation Prompt <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                  </Label>
                  <Textarea
                    placeholder="Describe how you want the AI to transform or enhance your product image..."
                    className="min-h-[100px] bg-muted/30 dark:bg-white/[0.02] border-[#e5e7eb] dark:border-white/[0.1] resize-none"
                  />
                </div>

                {/* Generate Button */}
                {productImages?.heroProfile && (
                  <Button
                    onClick={async () => {
                      if (onCompositeGenerate) {
                        setIsGeneratingComposite(true);
                        try { await onCompositeGenerate('ai_generated'); } 
                        finally { setIsGeneratingComposite(false); }
                      }
                    }}
                    disabled={isGeneratingComposite}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                  >
                    {isGeneratingComposite ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating with AI...</>
                    ) : (
                      <><Sparkles className="w-5 h-5 mr-2" />Generate AI Image</>
                    )}
            </Button>
                )}

                {/* Composite Preview for AI Mode */}
                {productImages?.compositeImage && productImages.compositeImage.mode === 'ai_generated' && !productImages.compositeImage.isApplied && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-4 border-t border-[#e5e7eb] dark:border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">AI Generated Preview</h4>
                        <p className="text-xs text-muted-foreground">Generated from reference</p>
                      </div>
                      <Badge variant="outline" className="border-teal-500/30 text-teal-600 dark:text-teal-300">Ready to Apply</Badge>
                    </div>
                    
                    <div 
                      className="relative aspect-video rounded-xl border border-[#e5e7eb] dark:border-white/[0.1] bg-muted/30 dark:bg-white/[0.02] overflow-hidden cursor-pointer group"
                      onClick={() => setIsCompositeModalOpen(true)}
                    >
                      <img src={productImages.compositeImage.url} alt="AI Generated" className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform" />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="secondary" className="text-xs"><Eye className="w-3 h-3 mr-1" />Enlarge</Badge>
                      </div>
                    </div>

                    <div className="flex gap-3">
            <Button
                        variant="outline"
              onClick={async () => {
                          if (onCompositeGenerate) {
                            setIsGeneratingComposite(true);
                            try { await onCompositeGenerate('ai_generated'); } 
                            finally { setIsGeneratingComposite(false); }
                          }
                        }}
                        disabled={isGeneratingComposite}
                        className="flex-1 h-10 border-[#e5e7eb] dark:border-white/[0.15] hover:bg-muted dark:hover:bg-white/[0.06]"
                      >
                        {isGeneratingComposite ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Regenerating...</> : <><Sparkles className="w-4 h-4 mr-2" />Regenerate</>}
            </Button>
                      <Button
                        onClick={async () => { if (onApplyComposite) await onApplyComposite(); }}
                        className="flex-1 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:opacity-90"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />Apply
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Applied Composite for AI Mode */}
                {productImages?.compositeImage && productImages.compositeImage.mode === 'ai_generated' && productImages.compositeImage.isApplied && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-4 border-t border-[#e5e7eb] dark:border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Applied AI Image</h4>
                        <p className="text-xs text-muted-foreground">AI generated composite</p>
                      </div>
                      <Badge variant="outline" className="border-green-500/30 text-green-600 dark:text-green-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" />Applied
                      </Badge>
                    </div>
                    
                    <div className="relative aspect-video rounded-xl border border-[#e5e7eb] dark:border-white/[0.1] bg-muted/30 dark:bg-white/[0.02] overflow-hidden cursor-pointer group" onClick={() => setIsCompositeModalOpen(true)}>
                      <img src={productImages.compositeImage.url} alt="Applied AI" className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform" />
                    </div>

                    <Button variant="destructive" onClick={() => onRemoveAppliedComposite?.()} className="w-full h-10">
                      <X className="w-4 h-4 mr-2" />Remove Applied Image
                    </Button>
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

      </div>

      {/* Composite Modal */}
      <Dialog open={isCompositeModalOpen} onOpenChange={setIsCompositeModalOpen}>
        <DialogContent className="max-w-6xl p-0 bg-black/95 border-white/10">
          <div className="relative">
            {productImages?.compositeImage && (
              <img src={productImages.compositeImage.url} alt="Composite Full View" className="w-full h-auto" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsCompositeModalOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
