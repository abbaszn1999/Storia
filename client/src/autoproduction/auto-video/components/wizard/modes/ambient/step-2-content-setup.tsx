import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, Sparkles, Clock, Maximize2, Globe, Wind, Palette, Sun, Leaf,
  Video, Image as ImageIcon, Film, Repeat, RectangleHorizontal, RectangleVertical, Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { IMAGE_MODELS, getImageModelConfig } from "@/constants/image-models";
import { 
  VIDEO_MODELS as IMPORTED_VIDEO_MODELS, 
  getVideoModelConfig, 
  getDefaultVideoModel,
  getAvailableVideoModels,
  isModelCompatible,
  VIDEO_RESOLUTION_LABELS 
} from "@/constants/video-models";
import type { 
  AmbientDuration, 
  AmbientAspectRatio, 
  AmbientMood,
  AmbientTheme,
  AmbientTimeContext,
  AmbientSeason,
  AnimationMode,
  VideoGenerationMode,
  LoopType,
  AmbientTransitionStyle,
  AmbientEasingStyle,
} from "./types";
import { 
  DURATION_OPTIONS, 
  ASPECT_RATIO_OPTIONS, 
  MOOD_OPTIONS,
  THEME_OPTIONS,
  ANIMATION_MODE_OPTIONS,
  VIDEO_GENERATION_MODE_OPTIONS,
  LOOP_TYPE_OPTIONS,
  TRANSITION_OPTIONS,
  EASING_STYLE_OPTIONS,
  getTimeContextOptions,
  getSeasonOptions,
  getTimeContextLabel,
  getSeasonLabel,
} from "./types";

// All possible aspect ratios with metadata for UI display (matches original ambient)
const ALL_ASPECT_RATIOS = [
  { value: "16:9", label: "16:9", description: "YouTube, Landscape", icon: RectangleHorizontal },
  { value: "9:16", label: "9:16", description: "TikTok, Reels", icon: RectangleVertical },
  { value: "1:1", label: "1:1", description: "Instagram Square", icon: Square },
  { value: "4:3", label: "4:3", description: "Classic TV", icon: RectangleHorizontal },
  { value: "3:4", label: "3:4", description: "Portrait Classic", icon: RectangleVertical },
  { value: "4:5", label: "4:5", description: "Feed Posts", icon: RectangleVertical },
  { value: "5:4", label: "5:4", description: "Large Format", icon: RectangleHorizontal },
  { value: "3:2", label: "3:2", description: "Photo Standard", icon: RectangleHorizontal },
  { value: "2:3", label: "2:3", description: "Photo Portrait", icon: RectangleVertical },
  { value: "21:9", label: "21:9", description: "Ultra-Wide Cinema", icon: RectangleHorizontal },
  { value: "9:21", label: "9:21", description: "Ultra-Tall", icon: RectangleVertical },
  { value: "7:4", label: "7:4", description: "Wide Landscape", icon: RectangleHorizontal },
  { value: "4:7", label: "4:7", description: "Tall Portrait", icon: RectangleVertical },
  { value: "17:13", label: "17:13", description: "Custom Wide", icon: RectangleHorizontal },
  { value: "13:17", label: "13:17", description: "Custom Tall", icon: RectangleVertical },
];

/**
 * Get compatible aspect ratios based on selected image and video models
 * For Image Transitions mode: returns image model's aspect ratios
 * For Video Animation mode: returns intersection of both models
 */
const getCompatibleAspectRatios = (
  imageModel: string,
  videoModel: string,
  animationMode: 'image-transitions' | 'video-animation'
): string[] => {
  const imageConfig = IMAGE_MODELS.find(m => m.value === imageModel);
  const videoConfig = getVideoModelConfig(videoModel);
  
  if (animationMode === 'image-transitions') {
    // Image Transitions mode: use image model ratios only
    return imageConfig?.aspectRatios || [];
  }
  
  // Video Animation mode: intersection of both
  const imageRatios = new Set(imageConfig?.aspectRatios || []);
  const videoRatios = videoConfig?.aspectRatios || [];
  
  // Return intersection - only ratios supported by BOTH models
  // If no intersection, return empty array (UI will show error message)
  return videoRatios.filter(r => imageRatios.has(r));
};

interface Step2ContentSetupProps {
  campaignName: string;
  onCampaignNameChange: (value: string) => void;
  videoIdeas: string[];
  onVideoIdeasChange: (ideas: string[]) => void;
  duration: AmbientDuration;
  onDurationChange: (value: AmbientDuration) => void;
  aspectRatio: AmbientAspectRatio;
  onAspectRatioChange: (value: AmbientAspectRatio) => void;
  mood: AmbientMood;
  onMoodChange: (value: AmbientMood) => void;
  theme: AmbientTheme;
  onThemeChange: (value: AmbientTheme) => void;
  timeContext: AmbientTimeContext;
  onTimeContextChange: (value: AmbientTimeContext) => void;
  season: AmbientSeason;
  onSeasonChange: (value: AmbientSeason) => void;
  animationMode: AnimationMode;
  onAnimationModeChange: (value: AnimationMode) => void;
  videoGenerationMode?: VideoGenerationMode;
  onVideoGenerationModeChange: (value: VideoGenerationMode) => void;
  imageModel: string;
  onImageModelChange: (value: string) => void;
  imageResolution: string;
  onImageResolutionChange: (value: string) => void;
  videoModel: string;
  onVideoModelChange: (value: string) => void;
  videoResolution: string;
  onVideoResolutionChange: (value: string) => void;
  pacing: number;
  onPacingChange: (value: number) => void;
  segmentEnabled: boolean;
  onSegmentEnabledChange: (value: boolean) => void;
  segmentCount: 'auto' | number;
  onSegmentCountChange: (value: 'auto' | number) => void;
  shotsPerSegmentEnabled: boolean;
  onShotsPerSegmentEnabledChange: (value: boolean) => void;
  shotsPerSegment: 'auto' | number;
  onShotsPerSegmentChange: (value: 'auto' | number) => void;
  loopMode: boolean;
  onLoopModeChange: (value: boolean) => void;
  loopType: LoopType;
  onLoopTypeChange: (value: LoopType) => void;
  segmentLoopEnabled: boolean;
  onSegmentLoopEnabledChange: (value: boolean) => void;
  segmentLoopCount: 'auto' | number;
  onSegmentLoopCountChange: (value: 'auto' | number) => void;
  shotLoopEnabled: boolean;
  onShotLoopEnabledChange: (value: boolean) => void;
  shotLoopCount: 'auto' | number;
  onShotLoopCountChange: (value: 'auto' | number) => void;
  // Image Transitions Mode settings
  transitionStyle: AmbientTransitionStyle;
  onTransitionStyleChange: (value: AmbientTransitionStyle) => void;
  defaultEasingStyle: AmbientEasingStyle;
  onDefaultEasingStyleChange: (value: AmbientEasingStyle) => void;
}

export function Step2ContentSetup(props: Step2ContentSetupProps) {
  const ideasText = props.videoIdeas.join('\n');
  const ideaCount = props.videoIdeas.filter(t => t.trim()).length;

  const handleIdeasChange = (text: string) => {
    const newIdeas = text.split('\n').slice(0, 10);
    props.onVideoIdeasChange(newIdeas);
  };

  // Auto-adjust aspect ratio when animation mode or models change
  useEffect(() => {
    if (props.animationMode && props.imageModel && props.videoModel) {
      const compatibleRatios = getCompatibleAspectRatios(
        props.imageModel,
        props.videoModel,
        props.animationMode as 'image-transitions' | 'video-animation'
      );
      
      // If current aspect ratio is not in compatible list, auto-adjust (only if there are compatible ratios)
      if (compatibleRatios.length > 0 && !compatibleRatios.includes(props.aspectRatio)) {
        console.log(`[Step2ContentSetup] Aspect ratio ${props.aspectRatio} incompatible with model combination, switching to ${compatibleRatios[0]}`);
        props.onAspectRatioChange(compatibleRatios[0] as AmbientAspectRatio);
      }
      // If no compatible ratios, don't auto-adjust - let the error message show
    }
  }, [props.animationMode, props.imageModel, props.videoModel]); // Run when mode or models change

  return (
    <div className="p-6 space-y-6 pb-12">
      {/* Page Title */}
      <div className="text-center space-y-3 pb-4">
        <div className="flex items-center justify-center gap-3">
          <motion.div
            className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Sparkles className="h-8 w-8 text-violet-500" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-pink-500">
            Atmosphere & Settings
          </h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Configure your ambient visual's mood, theme, and technical settings
        </p>
      </div>
      {/* Campaign Name */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
              <FileText className="w-5 h-5" />
            </div>
            <Label className="text-lg font-semibold text-white">Campaign Name</Label>
          </div>
          <p className="text-xs text-white/40">
            Give your video campaign a memorable name
          </p>
          <Input
            placeholder="e.g., Relaxing Nature Scenes Collection"
            value={props.campaignName}
            onChange={(e) => props.onCampaignNameChange(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </CardContent>
      </Card>

      {/* Video Ideas */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <Label className="text-lg font-semibold text-white">Video Ideas</Label>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-violet-500/20 to-pink-500/20 text-violet-400 border-violet-500/30">
              {ideaCount}/10
            </Badge>
          </div>
          <p className="text-xs text-white/40">
            Enter up to 10 video concepts (one per line). Each will become an ambient video.
          </p>
          <Textarea
            placeholder={`Sunrise over misty mountains
Peaceful forest stream with birdsong
Cozy fireplace on a rainy night
Ocean waves at golden hour
Northern lights dancing in the sky
...`}
            value={ideasText}
            onChange={(e) => handleIdeasChange(e.target.value)}
            rows={6}
            className="font-mono bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
            <div className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/30">
            <div className="text-violet-400 mt-0.5">ℹ️</div>
            <p className="text-xs text-violet-200/90">
              Describe atmospheric scenes or moods. The AI will generate visually stunning ambient videos with gentle motion and immersive soundscapes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Animation Mode */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
              <Video className="w-5 h-5" />
            </div>
            <Label className="text-lg font-semibold text-white">Animation Mode</Label>
          </div>
          
          <p className="text-xs text-white/40">
            Choose how your visuals will be generated and animated
          </p>

          {/* Animation Mode Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => props.onAnimationModeChange('image-transitions')}
              className={cn(
                "p-4 rounded-lg border transition-all text-left",
                props.animationMode === 'image-transitions'
                  ? "border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5"
                  : "hover:border-violet-500/50"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <ImageIcon className="h-5 w-5 text-violet-400" />
                <span className="font-semibold text-white">Image Transitions</span>
              </div>
              <div className="text-xs text-white/50">
                Smooth transitions between AI-generated images
              </div>
            </button>

            <button
              onClick={() => props.onAnimationModeChange('video-animation')}
              className={cn(
                "p-4 rounded-lg border transition-all text-left",
                props.animationMode === 'video-animation'
                  ? "border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5"
                  : "hover:border-violet-500/50"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Film className="h-5 w-5 text-violet-400" />
                <span className="font-semibold text-white">Video Animation</span>
              </div>
              <div className="text-xs text-white/50">
                AI-animated video with natural motion
              </div>
            </button>
          </div>

          {/* Default Easing Style - Only for Image Transitions */}
          <AnimatePresence>
            {props.animationMode === 'image-transitions' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 pt-4 border-t border-white/10"
              >
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Default Easing Style</label>
                <p className="text-xs text-white/40">
                  This will be the default easing for all segments (can be customized per segment in Composition)
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {EASING_STYLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => props.onDefaultEasingStyleChange(option.value)}
                      className={cn(
                        "py-2.5 px-3 rounded-lg border text-sm font-medium transition-all",
                        props.defaultEasingStyle === option.value
                          ? "border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-400"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Generation Mode - Only for Video Animation */}
          <AnimatePresence>
            {props.animationMode === 'video-animation' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-2"
              >
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Generation Method</label>
                <p className="text-xs text-white/40">
                  How the AI will generate video motion
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => props.onVideoGenerationModeChange('start-end-frame')}
                    className={cn(
                      "p-3 rounded-lg border transition-all text-left",
                      props.videoGenerationMode === 'start-end-frame'
                        ? "border-pink-500 bg-gradient-to-br from-pink-500/10 to-pink-500/5"
                        : "hover:border-pink-500/50"
                    )}
                  >
                    <div className="font-medium text-sm text-white mb-1">Start/End Frame</div>
                    <div className="text-xs text-white/50">
                      AI generates motion between two keyframes
                    </div>
                  </button>

                  <button
                    onClick={() => props.onVideoGenerationModeChange('image-reference')}
                    className={cn(
                      "p-3 rounded-lg border transition-all text-left",
                      props.videoGenerationMode === 'image-reference'
                        ? "border-pink-500 bg-gradient-to-br from-pink-500/10 to-pink-500/5"
                        : "hover:border-pink-500/50"
                    )}
                  >
                    <div className="font-medium text-sm text-white mb-1">Image Reference</div>
                    <div className="text-xs text-white/50">
                      Animate from a single reference image
                    </div>
                  </button>
                </div>

                {props.videoGenerationMode === 'start-end-frame' && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="text-amber-400 mt-0.5">ℹ️</div>
                    <div className="flex-1 text-xs text-amber-200/90">
                      <span className="font-semibold">9 of 16 models compatible</span> with Start/End Frame mode.
                      Models need both start and end frame support.
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* AI Models Card - Image Model and Video Model together */}
      <AnimatePresence>
        {(props.animationMode === 'video-animation' || props.animationMode === 'image-transitions') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="relative z-10 p-6 space-y-6"
              >
                <div className="space-y-3">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Image Model</label>
                  <p className="text-xs text-white/40">
                    {props.animationMode === 'video-animation' 
                      ? 'AI model used to generate keyframe images for video generation'
                      : 'AI model used to generate images for transitions'}
                  </p>
                
                <Select value={props.imageModel} onValueChange={(value) => {
                  props.onImageModelChange(value);
                  // Check if current aspect ratio is compatible with new model combination
                  const compatibleRatios = getCompatibleAspectRatios(value, props.videoModel, 'video-animation');
                  if (compatibleRatios.length > 0 && !compatibleRatios.includes(props.aspectRatio)) {
                    // Auto-adjust to first compatible ratio
                    props.onAspectRatioChange(compatibleRatios[0] as AmbientAspectRatio);
                  }
                }}>
                  <SelectTrigger className="h-auto p-0 border-0 bg-transparent [&>svg]:hidden">
                    {(() => {
                      const selectedModel = IMAGE_MODELS.find(m => m.value === props.imageModel);
                      if (!selectedModel) return <SelectValue placeholder="Select image model" />;
                      
                      return (
                        <div className="w-full p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors text-left">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20">
                                <ImageIcon className="w-5 h-5 text-violet-400" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{selectedModel.label}</span>
                                  {selectedModel.default && (
                                    <Badge 
                                      variant="outline" 
                                      className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300"
                                    >
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-white/50">{selectedModel.provider}</span>
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          <div className="mt-2 text-xs text-white/40">
                            {selectedModel.aspectRatios.length} aspect ratios • {selectedModel.resolutions.join(", ")}
                            {selectedModel.maxPromptLength && <span> • {(selectedModel.maxPromptLength / 1000).toFixed(0)}K chars</span>}
                          </div>
                        </div>
                      );
                    })()}
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px] bg-[#0a0a0a] border-white/10">
                    {IMAGE_MODELS.map((model) => (
                      <SelectItem 
                        key={model.value} 
                        value={model.value}
                        className="py-3 focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30 data-[state=checked]:text-white"
                      >
                        <div className="flex items-start justify-between gap-3 w-full">
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{model.label}</span>
                              {model.default && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {model.provider}
                            </span>
                            <span className="text-xs text-muted-foreground/80 mt-1">
                              {model.description}
                            </span>
                            <span className="text-[10px] text-white/40 mt-1">
                              {model.aspectRatios.length} ratios • {model.resolutions.join(", ")}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image Resolution - Dynamic based on selected model */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Image Resolution</label>
                {(() => {
                  const selectedModel = IMAGE_MODELS.find(m => m.value === props.imageModel);
                  const availableResolutions = selectedModel?.resolutions || ['1k'];
                  
                  // Filter out "custom" resolution - models with "custom" use optimal resolution automatically
                  const actualResolutions = availableResolutions.filter(r => r !== "custom");
                  
                  // If only "custom" is available, show informational message
                  if (actualResolutions.length === 0) {
                    return (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs text-white/70">
                          This model uses optimal resolution automatically based on your settings.
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className={cn(
                      "grid gap-2",
                      actualResolutions.length <= 3 ? "grid-cols-3" : "grid-cols-4"
                    )}>
                      {actualResolutions.map((res) => (
                        <button
                          key={res}
                          onClick={() => props.onImageResolutionChange(res)}
                          className={cn(
                            "py-3 px-3 rounded-lg text-sm font-medium border transition-all",
                            props.imageResolution === res
                              ? "border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-white"
                              : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                          )}
                        >
                          {res.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  );
                })()}
                <p className="text-xs text-white/40">
                  Higher resolution = more detail but slower generation
                </p>
              </div>

              {/* Video Model - Only for Video Animation mode */}
              {props.animationMode === 'video-animation' && (
                <div className="space-y-4 pt-6 border-t border-white/10"
                >
                <div className="space-y-3">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Video Model</label>
                  <p className="text-xs text-white/40">
                    AI model used to animate the generated images into video
                  </p>
                  
                  <Select value={props.videoModel} onValueChange={(value) => {
                    props.onVideoModelChange(value);
                    // Check if current aspect ratio is compatible with new model combination
                    const compatibleRatios = getCompatibleAspectRatios(props.imageModel, value, 'video-animation');
                    if (compatibleRatios.length > 0 && !compatibleRatios.includes(props.aspectRatio)) {
                      // Auto-adjust to first compatible ratio
                      props.onAspectRatioChange(compatibleRatios[0] as AmbientAspectRatio);
                    }
                  }}>
                    <SelectTrigger className="h-auto p-0 border-0 bg-transparent [&>svg]:hidden">
                      {(() => {
                        const selectedModel = getVideoModelConfig(props.videoModel);
                        if (!selectedModel) return <SelectValue placeholder="Select video model" />;
                        
                        return (
                          <div className="w-full p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors text-left">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20">
                                  <Film className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">{selectedModel.label}</span>
                                    {selectedModel.default && (
                                      <Badge 
                                        variant="outline" 
                                        className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300"
                                      >
                                        Default
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-white/50">{selectedModel.provider}</span>
                                </div>
                              </div>
                              <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            <div className="mt-2 text-xs text-white/40">
                              {selectedModel.aspectRatios.length} aspect ratios • {selectedModel.resolutions.join(", ")}
                              {selectedModel.durations?.length ? <span> • Up to {Math.max(...selectedModel.durations)}s</span> : null}
                            </div>
                          </div>
                        );
                      })()}
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px] bg-[#0a0a0a] border-white/10">
                      {IMPORTED_VIDEO_MODELS.map((model) => {
                        // Filter based on video generation mode
                        const isCompatible = props.videoGenerationMode 
                          ? isModelCompatible(model.value, props.videoGenerationMode)
                          : true;
                        
                        if (!isCompatible) return null;
                        
                        return (
                          <SelectItem 
                            key={model.value} 
                            value={model.value}
                            className="py-3 focus:bg-violet-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500/30 data-[state=checked]:to-pink-500/30 data-[state=checked]:text-white"
                          >
                            <div className="flex items-start justify-between gap-3 w-full">
                              <div className="flex flex-col flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{model.label}</span>
                                  {model.default && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300">
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                  {model.provider}
                                </span>
                                <span className="text-xs text-muted-foreground/80 mt-1">
                                  {model.description}
                                </span>
                                <span className="text-[10px] text-white/40 mt-1">
                                  {model.aspectRatios.length} ratios • {model.resolutions.join(", ")}
                                  {model.durations?.length ? <span> • Up to {Math.max(...model.durations)}s</span> : null}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Video Resolution - Dynamic based on selected video model */}
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Video Resolution</label>
                  {(() => {
                    const selectedModel = getVideoModelConfig(props.videoModel);
                    const availableResolutions = selectedModel?.resolutions || ['720p'];
                    
                    return (
                      <div className={cn(
                        "grid gap-2",
                        availableResolutions.length <= 3 ? "grid-cols-3" : "grid-cols-4"
                      )}>
                        {availableResolutions.map((res) => (
                          <button
                            key={res}
                            onClick={() => props.onVideoResolutionChange(res)}
                            className={cn(
                              "py-3 px-3 rounded-lg text-sm font-medium border transition-all",
                              props.videoResolution === res
                                ? "border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-white"
                                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                            )}
                          >
                            {VIDEO_RESOLUTION_LABELS[res] || res.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                  <p className="text-xs text-white/40">
                    Higher resolution = more detail but slower generation
                  </p>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Aspect Ratio - Directly after Animation Mode */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <Label className="text-lg font-semibold text-white">Aspect Ratio</Label>
          <p className="text-sm text-white/50">
            {props.animationMode === 'video-animation' 
              ? 'Showing ratios supported by both image and video models'
              : 'Choose the dimensions for your ambient visual'}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(() => {
              // Get compatible aspect ratios based on animation mode and selected models
              const compatibleRatios = getCompatibleAspectRatios(
                props.imageModel,
                props.videoModel,
                props.animationMode as 'image-transitions' | 'video-animation'
              );
              
              // Filter ALL_ASPECT_RATIOS to only show compatible ones
              const ratiosToShow = ALL_ASPECT_RATIOS.filter(ratio => 
                compatibleRatios.includes(ratio.value)
              );
              
              // If no ratios found (models are incompatible), show error message
              if (ratiosToShow.length === 0 && props.animationMode === 'video-animation') {
                const imageModelName = IMAGE_MODELS.find(m => m.value === props.imageModel)?.label || 'image model';
                const videoModelName = getVideoModelConfig(props.videoModel)?.label || 'video model';
                
                return (
                  <div className="col-span-2">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <div className="flex items-start gap-3">
                        <div className="text-red-400 mt-0.5">⚠️</div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-300 mb-1">
                            Models Not Compatible
                          </p>
                          <p className="text-xs text-red-200/80">
                            <span className="font-medium">{imageModelName}</span> and <span className="font-medium">{videoModelName}</span> do not share any compatible aspect ratios. 
                            Please select different models to continue.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return ratiosToShow.map((ratio) => {
                const Icon = ratio.icon;
                return (
                  <button
                    key={ratio.value}
                    onClick={() => props.onAspectRatioChange(ratio.value as AmbientAspectRatio)}
                    className={cn(
                      "p-4 rounded-lg border transition-all text-left",
                      props.aspectRatio === ratio.value
                        ? "border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5 text-white" />
                      <span className="font-semibold text-white">{ratio.label}</span>
                    </div>
                    <div className="text-xs text-white/40">{ratio.description}</div>
                  </button>
                );
              });
            })()}
          </div>
          {props.animationMode === 'video-animation' && (() => {
            const compatibleRatios = getCompatibleAspectRatios(
              props.imageModel,
              props.videoModel,
              props.animationMode as 'image-transitions' | 'video-animation'
            );
            
            // Only show info message if there are compatible ratios
            if (compatibleRatios.length > 0) {
              return (
                <p className="text-xs text-amber-400/70 flex items-center gap-1.5">
                  <span className="text-amber-400">ℹ</span>
                  Only showing ratios supported by both {IMAGE_MODELS.find(m => m.value === props.imageModel)?.label || 'image model'} and {getVideoModelConfig(props.videoModel)?.label || 'video model'}
                </p>
              );
            }
            return null;
          })()}
        </CardContent>
      </Card>

      {/* Duration */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <Label className="text-lg font-semibold text-white">Target Duration</Label>
          <p className="text-sm text-white/50">
            How long should the ambient visual be?
          </p>
          <div className="grid grid-cols-6 gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => props.onDurationChange(option.value)}
                className={cn(
                  "py-2.5 px-3 rounded-lg border text-sm font-medium transition-all",
                  props.duration === option.value
                    ? "border-violet-500 bg-gradient-to-br from-violet-500/10 to-pink-500/5 text-violet-400"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mood */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <Label className="text-lg font-semibold text-white">Primary Mood</Label>
          <p className="text-sm text-white/50">What feeling should this video evoke?</p>
          <div className="grid grid-cols-4 gap-2">
            {MOOD_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => props.onMoodChange(option.id)}
                className={cn(
                  "py-2.5 px-3 rounded-lg border text-sm font-medium transition-all",
                  props.mood === option.id
                    ? "border-pink-500 bg-gradient-to-br from-pink-500/10 to-pink-500/5 text-pink-400"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <Label className="text-lg font-semibold text-white">Theme / Environment</Label>
          <p className="text-sm text-white/50">What type of visual world?</p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => props.onThemeChange(option.id)}
                className={cn(
                  "py-2.5 px-3 rounded-lg border text-sm font-medium transition-all",
                  props.theme === option.id
                    ? "border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-400"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time of Day */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <Label className="text-lg font-semibold text-white">{getTimeContextLabel(props.theme)}</Label>
          <p className="text-sm text-white/50">
            {props.theme === 'cosmic' ? 'Space lighting conditions' : 
             props.theme === 'abstract' ? 'Energy and rhythm state' :
             props.theme === 'interior' ? 'Indoor lighting' :
             props.theme === 'fantasy' ? 'Magical time setting' :
             'Lighting and time context'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {getTimeContextOptions(props.theme).map((option) => (
              <button
                key={option.id}
                onClick={() => props.onTimeContextChange(option.id as AmbientTimeContext)}
                className={cn(
                  "py-2.5 px-3 rounded-lg border text-sm font-medium transition-all",
                  props.timeContext === option.id
                    ? "border-pink-500 bg-gradient-to-br from-pink-500/10 to-pink-500/5 text-pink-400"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Season / Weather */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <Label className="text-lg font-semibold text-white">{getSeasonLabel(props.theme)}</Label>
          <p className="text-sm text-white/50">
            {props.theme === 'cosmic' ? 'Star and nebula density' : 
             props.theme === 'abstract' ? 'Visual complexity level' :
             props.theme === 'interior' ? 'Room ambiance and mood' :
             props.theme === 'fantasy' ? 'Magical atmosphere condition' :
             'Environmental conditions'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {getSeasonOptions(props.theme).map((option) => (
              <button
                key={option.id}
                onClick={() => props.onSeasonChange(option.id as AmbientSeason)}
                className={cn(
                  "py-2.5 px-3 rounded-lg border text-sm font-medium transition-all",
                  props.season === option.id
                    ? "border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-400"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transition Style - Only for Image Transitions mode */}
      <AnimatePresence>
        {props.animationMode === 'image-transitions' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="relative z-10 p-6 space-y-4">
                <Label className="text-lg font-semibold text-white">Transition Style</Label>
                <p className="text-xs text-white/50">How should images transition between each other?</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {TRANSITION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => props.onTransitionStyleChange(option.value)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        props.transitionStyle === option.value
                          ? "border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "font-medium text-sm",
                        props.transitionStyle === option.value ? "text-violet-400" : "text-white"
                      )}>
                        {option.label}
                      </div>
                      <div className="text-xs text-white/50 mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pacing & Flow */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-6">
          <Label className="text-lg font-semibold text-white">Pacing & Flow</Label>
          
          <div className="space-y-3">
            <Label className="text-sm text-white/70">Pacing</Label>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Slow & Relaxed</span>
              <span className="font-medium text-white">{props.pacing}%</span>
              <span className="text-white/50">Fast & Dynamic</span>
            </div>
            <Slider
              value={[props.pacing]}
              onValueChange={(value) => props.onPacingChange(value[0])}
              min={0}
              max={100}
              step={5}
            />
            <p className="text-xs text-white/40">
              How quickly scenes change (0 = very slow, 100 = fast-paced)
            </p>
          </div>

          <div className="space-y-6 pt-4 border-t border-white/10">
            <Label className="text-sm font-semibold text-white">Segment Settings</Label>
            
            {/* Number of Segments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-white/70">Number of Segments</label>
                  <p className="text-xs text-white/50 mt-1">Number of distinct visual segments in your video</p>
                </div>
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                  <button
                    onClick={() => props.onSegmentEnabledChange(true)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-all",
                      props.segmentEnabled ? "bg-violet-500/20 text-white" : "text-white/50"
                    )}
                  >
                    On
                  </button>
                  <button
                    onClick={() => props.onSegmentEnabledChange(false)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-all",
                      !props.segmentEnabled ? "bg-violet-500/20 text-white" : "text-white/50"
                    )}
                  >
                    Off
                  </button>
                </div>
              </div>

              {props.segmentEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="space-y-2"
                >
                  <label className="text-xs text-white/50">Segment Count</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => props.onSegmentCountChange('auto')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                        props.segmentCount === 'auto'
                          ? "bg-violet-500/20 border-violet-500/50 text-white"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      )}
                    >
                      Auto
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={props.segmentCount === 'auto' ? '' : props.segmentCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          props.onSegmentCountChange(val);
                        } else if (e.target.value === '') {
                          props.onSegmentCountChange('auto');
                        }
                      }}
                      placeholder="Custom"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Shots per Segment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-white/70">Shots per Segment</label>
                  <p className="text-xs text-white/50 mt-1">Scenes within each chapter</p>
                </div>
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                  <button
                    onClick={() => props.onShotsPerSegmentEnabledChange(true)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-all",
                      props.shotsPerSegmentEnabled ? "bg-violet-500/20 text-white" : "text-white/50"
                    )}
                  >
                    On
                  </button>
                  <button
                    onClick={() => props.onShotsPerSegmentEnabledChange(false)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-all",
                      !props.shotsPerSegmentEnabled ? "bg-violet-500/20 text-white" : "text-white/50"
                    )}
                  >
                    Off
                  </button>
                </div>
              </div>

              {props.shotsPerSegmentEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="space-y-2"
                >
                  <label className="text-xs text-white/50">Shots Count</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => props.onShotsPerSegmentChange('auto')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                        props.shotsPerSegment === 'auto'
                          ? "bg-violet-500/20 border-violet-500/50 text-white"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      )}
                    >
                      Auto
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={props.shotsPerSegment === 'auto' ? '' : props.shotsPerSegment}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          props.onShotsPerSegmentChange(val);
                        } else if (e.target.value === '') {
                          props.onShotsPerSegmentChange('auto');
                        }
                      }}
                      placeholder="Custom"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loop Settings */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <Label className="text-lg font-semibold text-white">Loop Settings</Label>
          <p className="text-sm text-white/50">Configure seamless looping behavior</p>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70">Enable Looping</label>
            <Switch checked={props.loopMode} onCheckedChange={props.onLoopModeChange} />
          </div>

          <AnimatePresence>
            {props.loopMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4 border-t border-white/10"
              >
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Loop Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LOOP_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => props.onLoopTypeChange(option.value)}
                        className={cn(
                          "py-2.5 px-3 rounded-lg border text-sm font-medium transition-all",
                        props.loopType === option.value
                          ? "border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-400"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm text-white/70">Segment Loop</label>
                      <p className="text-xs text-white/50 mt-1">Loop each segment individually</p>
                    </div>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                      <button
                        onClick={() => props.onSegmentLoopEnabledChange(true)}
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-md transition-all",
                          props.segmentLoopEnabled ? "bg-violet-500/20 text-white" : "text-white/50"
                        )}
                      >
                        On
                      </button>
                      <button
                        onClick={() => props.onSegmentLoopEnabledChange(false)}
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-md transition-all",
                          !props.segmentLoopEnabled ? "bg-violet-500/20 text-white" : "text-white/50"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>

                  {props.segmentLoopEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="space-y-2"
                    >
                      <label className="text-xs text-white/50">Loop Count</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => props.onSegmentLoopCountChange('auto')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                            props.segmentLoopCount === 'auto'
                              ? "bg-violet-500/20 border-violet-500/50 text-white"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          )}
                        >
                          Auto
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={props.segmentLoopCount === 'auto' ? '' : props.segmentLoopCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              props.onSegmentLoopCountChange(val);
                            } else if (e.target.value === '') {
                              props.onSegmentLoopCountChange('auto');
                            }
                          }}
                          placeholder="Custom"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm text-white/70">Shot Loop</label>
                      <p className="text-xs text-white/50 mt-1">Loop individual shots within segments</p>
                    </div>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                      <button
                        onClick={() => props.onShotLoopEnabledChange(true)}
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-md transition-all",
                          props.shotLoopEnabled ? "bg-violet-500/20 text-white" : "text-white/50"
                        )}
                      >
                        On
                      </button>
                      <button
                        onClick={() => props.onShotLoopEnabledChange(false)}
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-md transition-all",
                          !props.shotLoopEnabled ? "bg-violet-500/20 text-white" : "text-white/50"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>

                  {props.shotLoopEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="space-y-2"
                    >
                      <label className="text-xs text-white/50">Loop Count</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => props.onShotLoopCountChange('auto')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                            props.shotLoopCount === 'auto'
                              ? "bg-violet-500/20 border-violet-500/50 text-white"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          )}
                        >
                          Auto
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={props.shotLoopCount === 'auto' ? '' : props.shotLoopCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              props.onShotLoopCountChange(val);
                            } else if (e.target.value === '') {
                              props.onShotLoopCountChange('auto');
                            }
                          }}
                          placeholder="Custom"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
