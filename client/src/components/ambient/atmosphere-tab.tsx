import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
  ArrowRight, 
  Sparkles, 
  Cloud, 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset, 
  TreePine, 
  Building2, 
  Shapes, 
  Stars, 
  Home, 
  Castle, 
  Snowflake, 
  CloudRain, 
  CloudFog, 
  Leaf, 
  RectangleHorizontal, 
  RectangleVertical, 
  Square,
  Wand2,
  RefreshCw,
  Lightbulb,
  Mic,
  Video,
  ImageIcon,
} from "lucide-react";

const IMAGE_MODELS = [
  // Google Models
  { 
    value: "nano-banana", 
    label: "Nano Banana", 
    provider: "Google", 
    description: "Gemini Flash 2.5 - Fast, interactive workflows", 
    badge: "Fast", 
    default: true,
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "5:4", "4:5", "16:9", "9:16", "21:9"],
    resolutions: ["1k"],
    maxPromptLength: 3000,
    supportsNegativePrompt: false,
  },
  { 
    value: "nano-banana-2-pro", 
    label: "Nano Banana 2 Pro", 
    provider: "Google", 
    description: "Gemini 3 Pro - Professional-grade, up to 4K", 
    badge: "Pro",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "4:5", "5:4", "9:16", "16:9", "21:9"],
    resolutions: ["1k", "2k", "4k"],
    maxPromptLength: 45000,
    supportsNegativePrompt: false,
  },
  { 
    value: "imagen-4.0-preview", 
    label: "Imagen 4.0 Preview", 
    provider: "Google", 
    description: "Improved textures, lighting, and typography",
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["custom"],
    maxPromptLength: 3000,
    supportsNegativePrompt: false,
  },
  { 
    value: "imagen-4.0-ultra", 
    label: "Imagen 4.0 Ultra", 
    provider: "Google", 
    description: "Exceptional detail, color accuracy, best quality", 
    badge: "Ultra",
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["custom"],
    maxPromptLength: 3000,
    supportsNegativePrompt: false,
  },
  { 
    value: "imagen-4.0-fast", 
    label: "Imagen 4.0 Fast", 
    provider: "Google", 
    description: "Speed optimized with minimal quality loss", 
    badge: "Fast",
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["custom"],
    maxPromptLength: 3000,
    supportsNegativePrompt: true,
  },
  
  // ByteDance Models
  { 
    value: "seedream-4.0", 
    label: "Seedream 4.0", 
    provider: "ByteDance", 
    description: "Ultra-fast 2K/4K with sequential images", 
    badge: "Sequential",
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
    resolutions: ["1k", "2k", "4k"],
    maxPromptLength: 2000,
    supportsNegativePrompt: false,
  },
  { 
    value: "seedream-4.5", 
    label: "Seedream 4.5", 
    provider: "ByteDance", 
    description: "Production reliability, sharp 2K/4K", 
    badge: "Reliable",
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
    resolutions: ["2k", "4k"],
    maxPromptLength: 2000,
    supportsNegativePrompt: false,
  },
  
  // Black Forest Labs - FLUX.2 Series
  { 
    value: "flux-2-dev", 
    label: "FLUX.2 [dev]", 
    provider: "Black Forest Labs", 
    description: "Open weights, full architectural control", 
    badge: "Dev",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"],
    resolutions: ["custom"],
    maxPromptLength: 10000,
    supportsNegativePrompt: false,
  },
  { 
    value: "flux-2-pro", 
    label: "FLUX.2 [pro]", 
    provider: "Black Forest Labs", 
    description: "Production-ready, robust editing", 
    badge: "Pro",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["custom"],
    maxPromptLength: 3000,
    supportsNegativePrompt: false,
  },
  { 
    value: "flux-2-flex", 
    label: "FLUX.2 [flex]", 
    provider: "Black Forest Labs", 
    description: "Best text rendering, typography specialist", 
    badge: "Typography",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["custom"],
    maxPromptLength: 3000,
    supportsNegativePrompt: false,
  },
  
  // Other Providers
  { 
    value: "midjourney-v7", 
    label: "Midjourney V7", 
    provider: "Midjourney", 
    description: "Cinematic realism, photographic quality", 
    badge: "Cinematic",
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "3:2", "2:3", "21:9"],
    resolutions: ["custom"],
    maxPromptLength: 2000,
    supportsNegativePrompt: false,
  },
  { 
    value: "ideogram-3.0", 
    label: "Ideogram 3.0", 
    provider: "Ideogram", 
    description: "Sharp text, graphic design specialist", 
    badge: "Design",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "5:4", "4:5", "8:5", "5:8", "3:1", "1:3"],
    resolutions: ["custom"],
    maxPromptLength: 2000,
    supportsNegativePrompt: true,
  },
];

const MOODS = [
  { id: "calm", label: "Calm", description: "Peaceful and serene" },
  { id: "mysterious", label: "Mysterious", description: "Enigmatic and intriguing" },
  { id: "energetic", label: "Energetic", description: "Dynamic and vibrant" },
  { id: "nostalgic", label: "Nostalgic", description: "Wistful and sentimental" },
  { id: "cozy", label: "Cozy", description: "Warm and comfortable" },
  { id: "dark", label: "Dark", description: "Moody and intense" },
  { id: "dreamy", label: "Dreamy", description: "Surreal and floating" },
  { id: "ethereal", label: "Ethereal", description: "Otherworldly and delicate" },
];

const THEMES = [
  { id: "nature", label: "Nature", icon: TreePine },
  { id: "urban", label: "Urban", icon: Building2 },
  { id: "abstract", label: "Abstract", icon: Shapes },
  { id: "cosmic", label: "Cosmic", icon: Stars },
  { id: "interior", label: "Interior", icon: Home },
  { id: "fantasy", label: "Fantasy", icon: Castle },
];

// Nature & Urban themes - Traditional time and weather
const TIME_CONTEXTS_NATURAL = [
  { id: "dawn", label: "Dawn", icon: Sunrise },
  { id: "day", label: "Day", icon: Sun },
  { id: "sunset", label: "Sunset", icon: Sunset },
  { id: "night", label: "Night", icon: Moon },
  { id: "timeless", label: "Timeless", icon: Sparkles },
];

const SEASONS_NATURAL = [
  { id: "spring", label: "Spring", icon: Leaf },
  { id: "summer", label: "Summer", icon: Sun },
  { id: "autumn", label: "Autumn", icon: Leaf },
  { id: "winter", label: "Winter", icon: Snowflake },
  { id: "rainy", label: "Rainy", icon: CloudRain },
  { id: "snowy", label: "Snowy", icon: Snowflake },
  { id: "foggy", label: "Foggy", icon: CloudFog },
  { id: "neutral", label: "Neutral", icon: Cloud },
];

// Cosmic theme - Space lighting and density
const TIME_CONTEXTS_COSMIC = [
  { id: "bright-nebula", label: "Bright Nebula", icon: Sparkles },
  { id: "dark-void", label: "Dark Void", icon: Moon },
  { id: "star-field", label: "Star Field", icon: Stars },
  { id: "eclipse", label: "Eclipse", icon: Sun },
  { id: "aurora", label: "Aurora", icon: Sparkles },
];

const SEASONS_COSMIC = [
  { id: "sparse", label: "Sparse", icon: Stars },
  { id: "moderate", label: "Moderate", icon: Sparkles },
  { id: "dense", label: "Dense", icon: Cloud },
  { id: "nebulous", label: "Nebulous", icon: CloudFog },
  { id: "energetic", label: "Energetic", icon: Sparkles },
  { id: "calm", label: "Calm", icon: Moon },
];

// Abstract theme - Energy and rhythm
const TIME_CONTEXTS_ABSTRACT = [
  { id: "static", label: "Static", icon: Moon },
  { id: "flowing", label: "Flowing", icon: Cloud },
  { id: "pulsing", label: "Pulsing", icon: Sparkles },
  { id: "chaotic", label: "Chaotic", icon: Stars },
  { id: "balanced", label: "Balanced", icon: Sun },
];

const SEASONS_ABSTRACT = [
  { id: "minimal", label: "Minimal", icon: Moon },
  { id: "moderate", label: "Moderate", icon: Cloud },
  { id: "complex", label: "Complex", icon: Shapes },
  { id: "intense", label: "Intense", icon: Sparkles },
  { id: "layered", label: "Layered", icon: CloudFog },
];

// Interior theme - Lighting and ambiance
const TIME_CONTEXTS_INTERIOR = [
  { id: "morning-light", label: "Morning Light", icon: Sunrise },
  { id: "afternoon", label: "Afternoon", icon: Sun },
  { id: "golden-hour", label: "Golden Hour", icon: Sunset },
  { id: "evening", label: "Evening", icon: Moon },
  { id: "ambient", label: "Ambient", icon: Sparkles },
];

const SEASONS_INTERIOR = [
  { id: "warm-cozy", label: "Warm & Cozy", icon: Home },
  { id: "cool-fresh", label: "Cool & Fresh", icon: Snowflake },
  { id: "natural-light", label: "Natural Light", icon: Sun },
  { id: "dim-moody", label: "Dim & Moody", icon: Moon },
  { id: "bright-airy", label: "Bright & Airy", icon: Cloud },
];

// Fantasy theme - Magical time and conditions
const TIME_CONTEXTS_FANTASY = [
  { id: "ethereal-dawn", label: "Ethereal Dawn", icon: Sunrise },
  { id: "mystical-day", label: "Mystical Day", icon: Sparkles },
  { id: "enchanted-dusk", label: "Enchanted Dusk", icon: Sunset },
  { id: "moonlit-night", label: "Moonlit Night", icon: Moon },
  { id: "twilight", label: "Twilight", icon: Stars },
];

const SEASONS_FANTASY = [
  { id: "magical-bloom", label: "Magical Bloom", icon: Sparkles },
  { id: "mystical-mist", label: "Mystical Mist", icon: CloudFog },
  { id: "enchanted-frost", label: "Enchanted Frost", icon: Snowflake },
  { id: "fairy-lights", label: "Fairy Lights", icon: Stars },
  { id: "elemental", label: "Elemental", icon: Cloud },
];

const DURATIONS = [
  { value: "5min", label: "5 min" },
  { value: "10min", label: "10 min" },
  { value: "30min", label: "30 min" },
  { value: "1hour", label: "1 hour" },
  { value: "2hours", label: "2 hours" },
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9", description: "YouTube", icon: RectangleHorizontal },
  { value: "9:16", label: "9:16", description: "TikTok, Reels", icon: RectangleVertical },
  { value: "1:1", label: "1:1", description: "Instagram", icon: Square },
  { value: "4:5", label: "4:5", description: "Feed Posts", icon: RectangleVertical },
];

const TEXT_OVERLAY_STYLES = [
  { value: 'modern', label: 'Modern' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'bold', label: 'Bold' },
];

// Image Transitions - Transition Types (motion effects applied to static images)
const TRANSITION_TYPES = [
  { value: 'zoom-in', label: 'Zoom In' },
  { value: 'zoom-out', label: 'Zoom Out' },
  { value: 'pan-left', label: 'Pan Left' },
  { value: 'pan-right', label: 'Pan Right' },
  { value: 'pan-up', label: 'Pan Up' },
  { value: 'pan-down', label: 'Pan Down' },
  { value: 'fade', label: 'Fade' },
  { value: 'ken-burns', label: 'Ken Burns' },
];

// Image Transitions - Easing/Motion Styles
const EASING_STYLES = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'cinematic', label: 'Cinematic' },
];

// Video Animation - AI Video Models
const VIDEO_MODELS = [
  { value: 'kling-1.6', label: 'Kling 1.6' },
  { value: 'minimax-video-01', label: 'MiniMax Video 01' },
  { value: 'luma-ray', label: 'Luma Ray' },
];

// Video Animation - Resolutions
const VIDEO_RESOLUTIONS = [
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' },
  { value: '4k', label: '4K' },
];

const TRANSITION_STYLES = [
  { id: "crossfade", label: "Smooth Crossfade", description: "Gentle blend between scenes" },
  { id: "dissolve", label: "Slow Dissolve", description: "Gradual fade transition" },
  { id: "drift", label: "Drift", description: "Floating motion blend" },
  { id: "match-cut", label: "Match Cut", description: "Seamless visual continuity" },
  { id: "morph", label: "Morph", description: "Shape transformation" },
  { id: "wipe", label: "Soft Wipe", description: "Directional reveal" },
];

const CAMERA_MOTIONS = [
  { id: "static", label: "Static" },
  { id: "slow-pan", label: "Slow Pan" },
  { id: "gentle-drift", label: "Gentle Drift" },
  { id: "orbit", label: "Orbit" },
  { id: "push-in", label: "Push In" },
  { id: "pull-out", label: "Pull Out" },
  { id: "float", label: "Floating" },
];

interface AtmosphereTabProps {
  mood: string;
  theme: string;
  timeContext: string;
  season: string;
  intensity: number;
  duration: string;
  moodDescription: string;
  imageModel?: string;
  aspectRatio?: string;
  voiceoverEnabled?: boolean;
  language?: 'ar' | 'en';
  textOverlayEnabled?: boolean;
  textOverlayStyle?: 'modern' | 'cinematic' | 'bold';
  animationMode?: 'image-transitions' | 'video-animation';
  videoGenerationMode?: 'image-reference' | 'start-end-frame';
  // Image Transitions props (global default)
  defaultEasingStyle?: string;
  // Video Animation props (global settings)
  videoModel?: string;
  videoResolution?: string;
  motionPrompt?: string;
  // Transition/Camera Motion (moved from Flow Design)
  transitionStyle?: string;
  cameraMotion?: string;
  // Pacing & Segment Settings (moved from Flow Design)
  pacing?: number;
  segmentEnabled?: boolean;
  segmentCount?: 'auto' | number;
  shotsPerSegment?: 'auto' | number;
  // Loop Settings
  loopMode?: boolean;
  loopType?: 'seamless' | 'fade' | 'hard-cut';
  segmentLoopEnabled?: boolean;
  segmentLoopCount?: 'auto' | number;
  shotLoopEnabled?: boolean;
  shotLoopCount?: 'auto' | number;
  onMoodChange: (mood: string) => void;
  onThemeChange: (theme: string) => void;
  onTimeContextChange: (timeContext: string) => void;
  onSeasonChange: (season: string) => void;
  onIntensityChange: (intensity: number) => void;
  onDurationChange: (duration: string) => void;
  onMoodDescriptionChange: (description: string) => void;
  onImageModelChange?: (model: string) => void;
  onAspectRatioChange?: (aspectRatio: string) => void;
  onVoiceoverChange?: (enabled: boolean) => void;
  onLanguageChange?: (lang: 'ar' | 'en') => void;
  onTextOverlayEnabledChange?: (enabled: boolean) => void;
  onTextOverlayStyleChange?: (style: 'modern' | 'cinematic' | 'bold') => void;
  onAnimationModeChange?: (mode: 'image-transitions' | 'video-animation') => void;
  onDefaultEasingStyleChange?: (style: string) => void;
  onVideoModelChange?: (model: string) => void;
  onVideoResolutionChange?: (resolution: string) => void;
  onMotionPromptChange?: (prompt: string) => void;
  onTransitionStyleChange?: (style: string) => void;
  onCameraMotionChange?: (motion: string) => void;
  onPacingChange?: (pacing: number) => void;
  onSegmentEnabledChange?: (enabled: boolean) => void;
  onSegmentCountChange?: (count: 'auto' | number) => void;
  onShotsPerSegmentChange?: (count: 'auto' | number) => void;
  onLoopModeChange?: (enabled: boolean) => void;
  onLoopTypeChange?: (type: 'seamless' | 'fade' | 'hard-cut') => void;
  onSegmentLoopEnabledChange?: (enabled: boolean) => void;
  onSegmentLoopCountChange?: (count: 'auto' | number) => void;
  onShotLoopEnabledChange?: (enabled: boolean) => void;
  onShotLoopCountChange?: (count: 'auto' | number) => void;
  onNext: () => void;
}

export function AtmosphereTab({
  mood,
  theme,
  timeContext,
  season,
  intensity,
  duration,
  moodDescription,
  imageModel = "nano-banana",
  aspectRatio = "16:9",
  voiceoverEnabled = false,
  language = 'en',
  textOverlayEnabled = false,
  textOverlayStyle = 'modern',
  animationMode = 'image-transitions',
  videoGenerationMode,
  defaultEasingStyle = 'smooth',
  videoModel = 'kling-1.6',
  videoResolution = '1080p',
  motionPrompt = '',
  transitionStyle = 'crossfade',
  cameraMotion = 'slow-pan',
  pacing = 30,
  segmentEnabled = true,
  segmentCount = 'auto',
  shotsPerSegment = 'auto',
  loopMode = true,
  loopType = 'seamless',
  segmentLoopEnabled = false,
  segmentLoopCount = 'auto',
  shotLoopEnabled = false,
  shotLoopCount = 'auto',
  onMoodChange,
  onThemeChange,
  onTimeContextChange,
  onSeasonChange,
  onIntensityChange,
  onDurationChange,
  onMoodDescriptionChange,
  onImageModelChange,
  onAspectRatioChange,
  onVoiceoverChange,
  onLanguageChange,
  onTextOverlayEnabledChange,
  onTextOverlayStyleChange,
  onAnimationModeChange,
  onDefaultEasingStyleChange,
  onVideoModelChange,
  onVideoResolutionChange,
  onMotionPromptChange,
  onTransitionStyleChange,
  onCameraMotionChange,
  onPacingChange,
  onSegmentEnabledChange,
  onSegmentCountChange,
  onShotsPerSegmentChange,
  onLoopModeChange,
  onLoopTypeChange,
  onSegmentLoopEnabledChange,
  onSegmentLoopCountChange,
  onShotLoopEnabledChange,
  onShotLoopCountChange,
  onNext,
}: AtmosphereTabProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const accentClasses = "from-cyan-500 to-teal-500";

  // Get theme-specific options
  const getTimeContexts = () => {
    switch (theme) {
      case "cosmic":
        return TIME_CONTEXTS_COSMIC;
      case "abstract":
        return TIME_CONTEXTS_ABSTRACT;
      case "interior":
        return TIME_CONTEXTS_INTERIOR;
      case "fantasy":
        return TIME_CONTEXTS_FANTASY;
      case "nature":
      case "urban":
      default:
        return TIME_CONTEXTS_NATURAL;
    }
  };

  const getSeasons = () => {
    switch (theme) {
      case "cosmic":
        return SEASONS_COSMIC;
      case "abstract":
        return SEASONS_ABSTRACT;
      case "interior":
        return SEASONS_INTERIOR;
      case "fantasy":
        return SEASONS_FANTASY;
      case "nature":
      case "urban":
      default:
        return SEASONS_NATURAL;
    }
  };

  const getTimeLabel = () => {
    switch (theme) {
      case "cosmic":
        return "Lighting Type";
      case "abstract":
        return "Energy State";
      case "interior":
        return "Lighting Mood";
      case "fantasy":
        return "Magical Time";
      case "nature":
      case "urban":
      default:
        return "Time of Day";
    }
  };

  const getSeasonLabel = () => {
    switch (theme) {
      case "cosmic":
        return "Space Density";
      case "abstract":
        return "Complexity Level";
      case "interior":
        return "Ambiance";
      case "fantasy":
        return "Magical Condition";
      case "nature":
      case "urban":
      default:
        return "Season / Weather";
    }
  };

  const timeContexts = getTimeContexts();
  const seasons = getSeasons();

  // Auto-adjust time and season when theme changes
  useEffect(() => {
    const validTimeIds = timeContexts.map((t) => t.id);
    const validSeasonIds = seasons.map((s) => s.id);

    // If current time context is not valid for new theme, reset to first option
    if (!validTimeIds.includes(timeContext)) {
      onTimeContextChange(timeContexts[0].id);
    }

    // If current season is not valid for new theme, reset to first option
    if (!validSeasonIds.includes(season)) {
      onSeasonChange(seasons[0].id);
    }
  }, [theme]); // Only run when theme changes

  const handleGenerateIdea = () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const generatedDescription = `${aiPrompt}

A serene ambient visual experience featuring ${theme} elements with a ${mood} atmosphere. The scene captures the essence of ${getTimeLabel().toLowerCase()} through ${timeContext} lighting, creating a ${getSeasonLabel().toLowerCase()} of ${season}.

Perfect for meditation, focus work, or peaceful background ambiance.`;
      
      onMoodDescriptionChange(generatedDescription);
      setIsGenerating(false);
      setAiPrompt(""); // Clear the prompt after generation
    }, 2000);
  };

  return (
    <div className="flex w-full h-[calc(100vh-12rem)] gap-0 overflow-hidden">
      {/* 
        LEFT COLUMN: SETTINGS (40% width)
      */}
      <div
        className={cn(
          "w-[40%] min-w-[400px] max-w-[600px] flex-shrink-0 h-full",
          "bg-black/40 backdrop-blur-xl",
          "border-r border-white/[0.06]",
          "flex flex-col overflow-hidden"
        )}
      >
        {/* Scrollable Content */}
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-6 pb-12">
            {/* Image Settings */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-5 h-5 text-cyan-400" />
                  <Label className="text-lg font-semibold text-white">Image Settings</Label>
                </div>

                {/* Image Model Selection */}
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Image Model</label>
                  <Select value={imageModel} onValueChange={onImageModelChange}>
                    <SelectTrigger className="h-auto min-h-[48px] py-2.5 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select image model">
                        {(() => {
                          const selectedModel = IMAGE_MODELS.find(m => m.value === imageModel);
                          if (!selectedModel) return "Select image model";
                          return (
                            <div className="flex items-center gap-2 w-full">
                              <div className="flex-1 text-left">
                                <div className="text-sm font-medium text-white">{selectedModel.label}</div>
                                <div className="text-xs text-white/50">{selectedModel.provider}</div>
                              </div>
                              {selectedModel.badge && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 border-cyan-500/50 text-cyan-300 flex-shrink-0">
                                  {selectedModel.badge}
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {IMAGE_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value} className="py-3">
                          <div className="flex items-start justify-between gap-3 w-full">
                            <div className="flex flex-col flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{model.label}</span>
                                {model.default && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-cyan-500/20 border-cyan-500/50 text-cyan-300">
                                    Default
                                  </Badge>
                                )}
                                {model.badge && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/10 border-white/20">
                                    {model.badge}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                {model.provider}
                              </span>
                              <span className="text-xs text-muted-foreground/80 mt-1">
                                {model.description}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-white/50">
                    AI model used to generate images from your prompts
                  </p>
                </div>

                {/* Model Capabilities Info */}
                <div className="flex items-center gap-2 text-xs text-white/40 pt-2">
                  {(() => {
                    const selectedModel = IMAGE_MODELS.find(m => m.value === imageModel);
                    if (!selectedModel) return null;
                    
                    return (
                      <>
                        <span>{selectedModel.aspectRatios.length} aspect ratios</span>
                        <span>•</span>
                        <span>{selectedModel.resolutions.join(", ")}</span>
                        {selectedModel.supportsNegativePrompt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400">Negative prompt</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{selectedModel.maxPromptLength >= 10000 ? '10K+' : `${Math.floor(selectedModel.maxPromptLength / 1000)}K`} chars</span>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Aspect Ratio */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <Label className="text-lg font-semibold text-white">Aspect Ratio</Label>
                <p className="text-sm text-white/50">
                  Choose the dimensions for your ambient visual
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ASPECT_RATIOS.map((ratio) => {
                    const Icon = ratio.icon;
                    return (
                      <button
                        key={ratio.value}
                        onClick={() => onAspectRatioChange?.(ratio.value)}
                        className={cn(
                          "p-4 rounded-lg border transition-all hover-elevate text-left",
                          aspectRatio === ratio.value
                            ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                        data-testid={`button-aspect-${ratio.value}`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="h-5 w-5 text-white" />
                          <span className="font-semibold text-white">{ratio.label}</span>
                        </div>
                        <div className="text-xs text-white/40">{ratio.description}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Target Duration - Directly Under Aspect Ratio */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <Label className="text-lg font-semibold text-white">Target Duration</Label>
                <p className="text-sm text-white/50">
                  How long should the ambient visual be?
                </p>
                <Select value={duration} onValueChange={onDurationChange}>
                  <SelectTrigger data-testid="select-duration" className="h-12 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Primary Mood - Under Duration */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <Label className="text-lg font-semibold text-white">Primary Mood</Label>
                <p className="text-sm text-white/50">
                  What feeling should this video evoke?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onMoodChange(m.id)}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all hover-elevate",
                        mood === m.id
                          ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                      data-testid={`button-mood-${m.id}`}
                    >
                      <div className="font-medium text-white">{m.label}</div>
                      <div className="text-xs text-white/40">{m.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Theme/Environment - Under Primary Mood */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <Label className="text-lg font-semibold text-white">Theme / Environment</Label>
                <p className="text-sm text-white/50">
                  What type of visual world?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onThemeChange(t.id)}
                        className={cn(
                          "p-4 rounded-lg border text-center transition-all hover-elevate",
                          theme === t.id
                            ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                        data-testid={`button-theme-${t.id}`}
                      >
                        <Icon className="h-6 w-6 mx-auto mb-2 text-white" />
                        <div className="text-sm font-medium text-white">{t.label}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Time Context - Smart Dynamic (Changes based on Theme) */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <Label className="text-lg font-semibold text-white">{getTimeLabel()}</Label>
                <div className="flex flex-wrap gap-2">
                  {timeContexts.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onTimeContextChange(t.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover-elevate",
                          timeContext === t.id
                            ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                        data-testid={`button-time-${t.id}`}
                      >
                        <Icon className="h-4 w-4 text-white" />
                        <span className="text-sm font-medium text-white">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Season/Weather - Smart Dynamic (Changes based on Theme) */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <Label className="text-lg font-semibold text-white">{getSeasonLabel()}</Label>
                <div className="flex flex-wrap gap-2">
                  {seasons.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => onSeasonChange(s.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover-elevate",
                          season === s.id
                            ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                        data-testid={`button-season-${s.id}`}
                      >
                        <Icon className="h-4 w-4 text-white" />
                        <span className="text-sm font-medium text-white">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Animation Mode */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-cyan-400" />
                    <Label className="text-lg font-semibold text-white">Animation Mode</Label>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30">
                    <span className="text-sm font-medium text-cyan-400">
                      {animationMode === 'image-transitions' ? 'Image Transitions' : 'Video Animation'}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-white/40">
                  Selected during project setup. This mode determines how your visuals will be generated.
                </p>

                {/* Video Generation Mode (only for video animation) */}
                {animationMode === 'video-animation' && videoGenerationMode && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Generation Method:</span>
                      <span className="text-sm font-medium text-white">
                        {videoGenerationMode === 'image-reference' ? 'Image Reference Mode' : 'Start/End Frame Mode'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Image Transitions Settings */}
                {animationMode === 'image-transitions' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* Default Easing / Motion Style */}
                    <div className="space-y-2">
                      <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Default Easing Style</label>
                      <p className="text-xs text-white/40">
                        This will be the default easing for all segments (can be customized per segment in Composition)
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {EASING_STYLES.map((style) => (
                          <button
                            key={style.value}
                            onClick={() => onDefaultEasingStyleChange?.(style.value)}
                            className={cn(
                              "py-2.5 px-3 rounded-lg border text-sm font-medium transition-all",
                              defaultEasingStyle === style.value
                                ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Video Animation Settings */}
                {animationMode === 'video-animation' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* Video Model */}
                    <div className="space-y-2">
                      <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Video Model</label>
                      <p className="text-xs text-white/40">
                        AI model used to generate video from images
                      </p>
                      <Select value={videoModel} onValueChange={(value) => onVideoModelChange?.(value)}>
                        <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select video model" />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDEO_MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Resolution */}
                    <div className="space-y-2">
                      <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Resolution</label>
                      <p className="text-xs text-white/40">
                        Output video resolution
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {VIDEO_RESOLUTIONS.map((res) => (
                          <button
                            key={res.value}
                            onClick={() => onVideoResolutionChange?.(res.value)}
                            className={cn(
                              "py-2.5 px-3 rounded-lg text-sm font-medium border transition-all",
                              videoResolution === res.value
                                ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                          >
                            {res.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Motion Prompt */}
                    <div className="space-y-2">
                      <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Motion Prompt</label>
                      <p className="text-xs text-white/40">
                        Global instructions for AI video generation (camera motion can be customized per segment in Composition)
                      </p>
                      <Textarea
                        value={motionPrompt}
                        onChange={(e) => onMotionPromptChange?.(e.target.value)}
                        placeholder="e.g., Gentle floating particles, subtle light rays moving slowly, soft ambient movements..."
                        className="min-h-[80px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Transition Style OR Camera Motion (Conditional based on Animation Mode) */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                {animationMode === 'image-transitions' ? (
                  <>
                    <Label className="text-lg font-semibold text-white">Transition Style</Label>
                    <p className="text-xs text-white/50">
                      How should images transition between each other?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {TRANSITION_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => onTransitionStyleChange?.(style.id)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            transitionStyle === style.id
                              ? "bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border-cyan-500/50"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <div className="font-medium text-sm text-white">{style.label}</div>
                          <div className="text-xs text-white/50">{style.description}</div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <Label className="text-lg font-semibold text-white">Camera Motion</Label>
                    <p className="text-xs text-white/50">
                      Default camera movement for AI-generated video clips
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CAMERA_MOTIONS.map((motion) => (
                        <button
                          key={motion.id}
                          onClick={() => onCameraMotionChange?.(motion.id)}
                          className={cn(
                            "px-4 py-2 rounded-lg border text-sm transition-all",
                            cameraMotion === motion.id
                              ? "bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border-cyan-500/50 text-white"
                              : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                          )}
                        >
                          {motion.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pacing & Loop Settings */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-6">
                <Label className="text-lg font-semibold text-white">Pacing & Flow</Label>
                
                {/* Pacing Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white/70">Pacing</label>
                    <span className="text-sm text-cyan-400 font-medium">{pacing}%</span>
                  </div>
                  <Slider
                    value={[pacing]}
                    onValueChange={(value) => onPacingChange?.(value[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-white/50">
                    How quickly scenes change (0 = very slow, 100 = fast-paced)
                  </p>
                </div>

                {/* Segment Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm text-white/70">Segment Settings</label>
                      <p className="text-xs text-white/50 mt-1">
                        Enable custom segment configuration
                      </p>
                    </div>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                      <button
                        onClick={() => onSegmentEnabledChange?.(true)}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          segmentEnabled ? "bg-gradient-to-br from-cyan-500/80 to-teal-500/80 text-white shadow-lg" : "text-white/50"
                        )}
                      >
                        On
                      </button>
                      <button
                        onClick={() => onSegmentEnabledChange?.(false)}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          !segmentEnabled ? "bg-gradient-to-br from-cyan-500/80 to-teal-500/80 text-white shadow-lg" : "text-white/50"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conditional Segment Settings when enabled */}
                {segmentEnabled && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-6 pt-2"
                  >
                    {/* Number of Segments */}
                    <div className="space-y-2">
                      <label className="text-sm text-white/70">Number of Segments</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onSegmentCountChange?.('auto')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                            segmentCount === 'auto'
                              ? "bg-cyan-500/20 border-cyan-500/50 text-white"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          )}
                        >
                          Auto
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={segmentCount === 'auto' ? '' : segmentCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              onSegmentCountChange?.(val);
                            }
                          }}
                          placeholder="Enter number"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 placeholder:text-white/30"
                        />
                      </div>
                      <p className="text-xs text-white/50">
                        Number of distinct visual segments in your video
                      </p>
                    </div>

                    {/* Number of Shots per Segment */}
                    <div className="space-y-2">
                      <label className="text-sm text-white/70">Shots per Segment</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onShotsPerSegmentChange?.('auto')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                            shotsPerSegment === 'auto'
                              ? "bg-cyan-500/20 border-cyan-500/50 text-white"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          )}
                        >
                          Auto
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={shotsPerSegment === 'auto' ? '' : shotsPerSegment}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              onShotsPerSegmentChange?.(val);
                            }
                          }}
                          placeholder="Enter number"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 placeholder:text-white/30"
                        />
                      </div>
                      <p className="text-xs text-white/50">
                        Number of individual shots within each segment
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Loop Mode Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm text-white/70">Seamless Loop</label>
                      <p className="text-xs text-white/50 mt-1">
                        Make the video loop back seamlessly
                      </p>
                    </div>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                      <button
                        onClick={() => onLoopModeChange?.(true)}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          loopMode ? "bg-gradient-to-br from-cyan-500/80 to-teal-500/80 text-white shadow-lg" : "text-white/50"
                        )}
                      >
                        On
                      </button>
                      <button
                        onClick={() => onLoopModeChange?.(false)}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          !loopMode ? "bg-gradient-to-br from-cyan-500/80 to-teal-500/80 text-white shadow-lg" : "text-white/50"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conditional Loop Settings when Loop Mode is ON */}
                {loopMode && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-6 pt-4 border-t border-white/10"
                  >
                    {/* Loop Type */}
                    <div className="space-y-3">
                      <label className="text-sm text-white/70">Loop Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'seamless', label: 'Seamless' },
                          { value: 'fade', label: 'Fade' },
                          { value: 'hard-cut', label: 'Hard Cut' }
                        ].map((type) => (
                          <button
                            key={type.value}
                            onClick={() => onLoopTypeChange?.(type.value as any)}
                            className={cn(
                              "py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                              loopType === type.value
                                ? "bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border-cyan-500/50 text-white"
                                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                            )}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Segment Loop */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm text-white/70">Segment Loop</label>
                          <p className="text-xs text-white/50 mt-1">
                            Loop each segment individually
                          </p>
                        </div>
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                          <button
                            onClick={() => onSegmentLoopEnabledChange?.(true)}
                            className={cn(
                              "px-3 py-1 text-xs font-medium rounded-md transition-all",
                              segmentLoopEnabled ? "bg-cyan-500/20 text-white" : "text-white/50"
                            )}
                          >
                            On
                          </button>
                          <button
                            onClick={() => onSegmentLoopEnabledChange?.(false)}
                            className={cn(
                              "px-3 py-1 text-xs font-medium rounded-md transition-all",
                              !segmentLoopEnabled ? "bg-cyan-500/20 text-white" : "text-white/50"
                            )}
                          >
                            Off
                          </button>
                        </div>
                      </div>

                      {/* Segment Loop Count (when enabled) */}
                      {segmentLoopEnabled && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="space-y-2"
                        >
                          <label className="text-xs text-white/50">Loop Count</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => onSegmentLoopCountChange?.('auto')}
                              className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                                segmentLoopCount === 'auto'
                                  ? "bg-cyan-500/20 border-cyan-500/50 text-white"
                                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                              )}
                            >
                              Auto
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={segmentLoopCount === 'auto' ? '' : segmentLoopCount}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                  onSegmentLoopCountChange?.(val);
                                }
                              }}
                              placeholder="Custom"
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Shot Loop */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm text-white/70">Shot Loop</label>
                          <p className="text-xs text-white/50 mt-1">
                            Loop individual shots within segments
                          </p>
                        </div>
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                          <button
                            onClick={() => onShotLoopEnabledChange?.(true)}
                            className={cn(
                              "px-3 py-1 text-xs font-medium rounded-md transition-all",
                              shotLoopEnabled ? "bg-cyan-500/20 text-white" : "text-white/50"
                            )}
                          >
                            On
                          </button>
                          <button
                            onClick={() => onShotLoopEnabledChange?.(false)}
                            className={cn(
                              "px-3 py-1 text-xs font-medium rounded-md transition-all",
                              !shotLoopEnabled ? "bg-cyan-500/20 text-white" : "text-white/50"
                            )}
                          >
                            Off
                          </button>
                        </div>
                      </div>

                      {/* Shot Loop Count (when enabled) */}
                      {shotLoopEnabled && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="space-y-2"
                        >
                          <label className="text-xs text-white/50">Loop Count</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => onShotLoopCountChange?.('auto')}
                              className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                                shotLoopCount === 'auto'
                                  ? "bg-cyan-500/20 border-cyan-500/50 text-white"
                                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                              )}
                            >
                              Auto
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={shotLoopCount === 'auto' ? '' : shotLoopCount}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                  onShotLoopCountChange?.(val);
                                }
                              }}
                              placeholder="Custom"
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Voiceover - LAST SETTING */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-5 h-5 text-cyan-400" />
                  <Label className="text-lg font-semibold text-white">Voiceover</Label>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-white/70">Enable Voiceover</label>
                  <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                    <button
                      onClick={() => onVoiceoverChange?.(true)}
                      className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                        voiceoverEnabled ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                      )}
                    >
                      On
                    </button>
                    <button
                      onClick={() => onVoiceoverChange?.(false)}
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
                        onChange={(e) => onLanguageChange?.(e.target.value as 'ar' | 'en')}
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
                            onClick={() => onTextOverlayEnabledChange?.(true)}
                            className={cn(
                              "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                              textOverlayEnabled ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                            )}
                          >
                            On
                          </button>
                          <button
                            type="button"
                            onClick={() => onTextOverlayEnabledChange?.(false)}
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
                              onClick={() => onTextOverlayStyleChange?.(style.value as any)}
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
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* 
        RIGHT COLUMN: AI GENERATOR (60% width)
      */}
      <div className="flex-1 relative flex flex-col overflow-hidden h-full">
        {/* Top Section - AI Generator */}
        <div className="flex-shrink-0 p-6 border-b border-white/[0.04]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", accentClasses)}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-semibold text-white">AI Idea Generator</h3>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isGenerating}
                placeholder="Ask AI to write an ambient visual about..."
                className={cn(
                  "flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white",
                  "focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all",
                  "placeholder:text-white/30"
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isGenerating && aiPrompt.trim()) {
                    handleGenerateIdea();
                  }
                }}
              />

              <Button
                onClick={handleGenerateIdea}
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
              This will generate a detailed description and fill the "Your Idea" box below.
            </p>
          </div>
        </div>

        {/* Main Content - Your Idea */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("p-2 rounded-lg bg-gradient-to-br", accentClasses)}>
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">Your Idea</h3>
              <p className="text-xs text-white/40">
                Describe your ambient visual concept in detail
              </p>
            </div>
          </div>

          <div className="flex-1 relative rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
            <Textarea
              value={moodDescription}
              onChange={(e) => onMoodDescriptionChange(e.target.value)}
              placeholder="Write your ambient visual idea here, or use the AI generator above to create one..."
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
