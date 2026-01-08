// Script Step - Auto-generated scenes with editable cards
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassPanel } from "../shared/GlassPanel";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Layers,
  Clock,
  RefreshCw,
  Trash2,
  AlertCircle,
  Plus,
  AlertTriangle,
  Mic,
  Image as ImageIcon
} from "lucide-react";
import { StoryScene, StoryTemplate } from "../types";
import { getVideoModelConfig, VIDEO_MODELS } from "@/constants/video-models";

// ═══════════════════════════════════════════════════════════════════════════
// TEXT DURATION ESTIMATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate expected voiceover duration based on text length
 * Average speaking rate: ~150 words per minute = 2.5 words per second
 * Arabic/slow pace: ~2 words per second
 */
function estimateNarrationDuration(text: string): number {
  if (!text.trim()) return 0;
  const words = text.trim().split(/\s+/).length;
  const WORDS_PER_SECOND = 2.2; // Conservative estimate for natural speech
  return Math.ceil(words / WORDS_PER_SECOND);
}

/**
 * Determine if text length is compatible with scene duration
 */
function getTextDurationStatus(text: string, sceneDuration: number): {
  status: 'ok' | 'warning' | 'error';
  message: string;
  estimatedDuration: number;
} {
  const estimated = estimateNarrationDuration(text);
  
  if (!text.trim()) {
    return { 
      status: 'warning', 
      message: 'No narration text',
      estimatedDuration: 0 
    };
  }
  
  // Text too long for duration (voiceover will exceed video)
  if (estimated > sceneDuration * 1.2) {
    return { 
      status: 'error', 
      message: `Text too long (~${estimated}s for ${sceneDuration}s scene)`,
      estimatedDuration: estimated 
    };
  }
  
  // Text too short (wasted video time)
  if (estimated < sceneDuration * 0.4 && sceneDuration > 3) {
    return { 
      status: 'warning', 
      message: `Text short (~${estimated}s for ${sceneDuration}s scene)`,
      estimatedDuration: estimated 
    };
  }
  
  return { 
    status: 'ok', 
    message: `~${estimated}s narration`,
    estimatedDuration: estimated 
  };
}

interface ScriptStepProps {
  template: StoryTemplate;
  storyText: string;
  scenes: StoryScene[];
  duration: number;
  aspectRatio: string;
  imageMode: 'none' | 'transition' | 'image' | 'image-to-video';
  videoModel: string;
  voiceoverEnabled: boolean;
  isGenerating: boolean;
  error?: string | null;
  onStoryChange: (text: string) => void;
  onSceneUpdate: (id: string, updates: Partial<StoryScene>) => void;
  onSceneAdd: () => void;
  onSceneDelete: (id: string) => void;
  onGenerateScenes: () => void;
  accentColor?: string;
}

// Fullscreen Loading Component
function GeneratingScenes({ accentColor }: { accentColor: string }) {
  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  return (
    <div className="fixed inset-0 bg-background/90 dark:bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className={cn(
          "w-20 h-20 mx-auto rounded-full animate-spin",
          "border-4 border-border/50 dark:border-white/10",
          "border-t-4",
          "bg-gradient-to-r",
          accentClasses
        )} style={{ borderTopColor: 'transparent' }} />
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-foreground">Generating Scenes...</h3>
          <p className="text-muted-foreground">Breaking down your story into perfect scenes</p>
        </div>
      </div>
    </div>
  );
}

// Error State Component
function ErrorState({ 
  onRetry, 
  accentColor, 
  errorMessage 
}: { 
  onRetry: () => void; 
  accentColor: string;
  errorMessage?: string | null;
}) {
  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <GlassPanel className="max-w-md text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Failed to Generate Scenes</h3>
            <p className="text-muted-foreground text-sm">
              {errorMessage || 'Something went wrong while generating your scenes. Please try again.'}
            </p>
          </div>
          <Button
            onClick={onRetry}
            className={cn(
              "gap-2 bg-gradient-to-r",
              accentClasses
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}

export function ScriptStep({
  template,
  storyText,
  scenes,
  duration,
  aspectRatio,
  imageMode,
  videoModel,
  voiceoverEnabled,
  isGenerating,
  error,
  onStoryChange,
  onSceneUpdate,
  onSceneAdd,
  onSceneDelete,
  onGenerateScenes,
  accentColor = "primary"
}: ScriptStepProps) {
  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  
  // Calculate duration difference with ±3s tolerance
  const durationDifference = Math.abs(totalDuration - (duration || 0));
  const isDurationValid = durationDifference <= 3;

  // ═══════════════════════════════════════════════════════════════════════════
  // VIDEO MODEL CONSTRAINTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const modelConfig = useMemo(() => {
    return getVideoModelConfig(videoModel);
  }, [videoModel]);

  // Get supported durations based on image mode
  const supportedDurations = useMemo(() => {
    if (imageMode === 'image-to-video' && modelConfig) {
      // Use model's exact supported durations
      return modelConfig.durations;
    }
    // For other modes, allow 1-15 seconds
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  }, [imageMode, modelConfig]);

  // Check if current scene durations have issues
  const scenesWithIssues = useMemo(() => {
    return scenes.filter(scene => {
      // Duration not supported by model
      if (imageMode === 'image-to-video' && !supportedDurations.includes(scene.duration)) {
        return true;
      }
      // Text too long for duration
  const textStatus = getTextDurationStatus(scene.narration || '', scene.duration);
      if (textStatus.status === 'error') {
        return true;
      }
      return false;
    });
  }, [scenes, imageMode, supportedDurations]);

  // Show fullscreen loading during generation
  if (isGenerating) {
    return <GeneratingScenes accentColor={accentColor} />;
  }

  // Show error state if no scenes and not generating
  if (scenes.length === 0) {
    return <ErrorState onRetry={onGenerateScenes} accentColor={accentColor} errorMessage={error} />;
  }

  // Debug: Log scenes for auto-asmr mode
  if (template.id === 'auto-asmr') {
    console.log('[ScriptStep] Rendering with scenes:', scenes.map(s => ({
      sceneNumber: s.sceneNumber,
      soundDescription: s.soundDescription,
      hasSoundDesc: !!s.soundDescription,
      soundDescLength: s.soundDescription?.length || 0
    })));
    console.log('[ScriptStep] Model config:', modelConfig);
  }

  // Show scene cards
  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-lg bg-gradient-to-br",
              accentClasses
            )}>
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Scene Breakdown</h2>
              <p className="text-muted-foreground text-sm">
                {scenes.length} scenes · {totalDuration}s total
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onSceneAdd}
              className="gap-2 h-9 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Scene
            </Button>
            <Button
              variant="outline"
              onClick={onGenerateScenes}
              className="gap-2 h-9 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>
          </div>
        </div>
      </div>

      {/* Scene Cards Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenes.map((scene, index) => (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="h-full"
            >
              <GlassPanel noPadding className="h-full flex flex-col overflow-hidden">
                {/* Scene Header - Compact */}
                <div className={cn(
                  "px-3 py-2.5 flex items-center justify-between",
                  "bg-gradient-to-r",
                  accentClasses,
                  "bg-opacity-10 border-b border-border/50 dark:border-white/10"
                )}>
                  <div className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-bold",
                    "bg-gradient-to-r",
                    accentClasses,
                    "text-white"
                  )}>
                    Scene {scene.sceneNumber}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-muted/60 dark:bg-black/30 px-1 py-0.5 rounded-md">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <Select
                        value={scene.duration.toString()}
                        onValueChange={(val) => {
                          onSceneUpdate(scene.id, { duration: parseInt(val) });
                        }}
                      >
                        <SelectTrigger className="w-14 h-6 bg-transparent border-none text-xs text-foreground p-1 gap-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {supportedDurations.map((d) => (
                            <SelectItem 
                              key={d} 
                              value={d.toString()}
                              className="text-xs"
                            >
                              {d}s
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSceneDelete(scene.id)}
                      className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Scene Content - Flexible */}
                <div className="flex-1 p-3 flex flex-col gap-3">
                  {/* Description Field - Always Visible */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-medium text-muted-foreground">Visual Description</span>
                    </div>
                    <Textarea
                      value={scene.description || ''}
                      onChange={(e) => onSceneUpdate(scene.id, { description: e.target.value })}
                      className={cn(
                        "min-h-[80px] bg-muted/50 dark:bg-white/5 border-border dark:border-white/10",
                        "focus:border-blue-500/30 resize-none",
                        "text-sm leading-relaxed text-foreground",
                        "placeholder:text-muted-foreground/50 dark:placeholder:text-white/20"
                      )}
                      placeholder="Describe what the viewer sees..."
                    />
                  </div>

                  {/* Narration/Sound Effect Field - Conditional based on mode and model */}
                  {(() => {
                    // For auto-asmr mode: Show sound effect if model doesn't support audio
                    if (template.id === 'auto-asmr') {
                      // Ensure modelConfig is available
                      if (!modelConfig) {
                        console.warn(`[ScriptStep] modelConfig is undefined for videoModel: ${videoModel}`);
                        // Show field anyway if modelConfig is not available (fallback)
                        const soundDescValue = scene.soundDescription ?? '';
                        return (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Mic className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-xs font-medium text-white/60">Sound Effect</span>
                            </div>
                            <Textarea
                              value={soundDescValue}
                              onChange={(e) => {
                                console.log(`[ScriptStep] Updating scene ${scene.sceneNumber} soundDescription:`, e.target.value);
                                onSceneUpdate(scene.id, { soundDescription: e.target.value });
                              }}
                              className={cn(
                                "min-h-[80px] bg-white/5 border-white/10",
                                "focus:border-emerald-500/30 resize-none",
                                "text-sm leading-relaxed text-white/90",
                                "placeholder:text-white/20"
                              )}
                              placeholder="Enter sound effect description..."
                            />
                          </div>
                        );
                      }
                      
                      const hasAudio = modelConfig.hasAudio ?? false;
                      
                      // Debug logging
                      console.log(`[ScriptStep] Scene ${scene.sceneNumber}:`, {
                        hasAudio,
                        soundDescription: scene.soundDescription,
                        modelConfig: modelConfig.label,
                        videoModel,
                      });
                      
                      // If model has native audio, hide the field completely
                      if (hasAudio) {
                        return null;
                      }
                      // If model doesn't have audio, show sound effect field
                      // Ensure soundDescription is displayed (use empty string if undefined)
                      const soundDescValue = scene.soundDescription ?? '';
                      
                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs font-medium text-muted-foreground">Sound Effect</span>
                          </div>
                          <Textarea
                            value={soundDescValue}
                            onChange={(e) => {
                              console.log(`[ScriptStep] Updating scene ${scene.sceneNumber} soundDescription:`, e.target.value);
                              onSceneUpdate(scene.id, { soundDescription: e.target.value });
                            }}
                            className={cn(
                              "min-h-[80px] bg-muted/50 dark:bg-white/5 border-border dark:border-white/10",
                              "focus:border-emerald-500/30 resize-none",
                              "text-sm leading-relaxed text-foreground",
                              "placeholder:text-muted-foreground/50 dark:placeholder:text-white/20"
                            )}
                            placeholder="Enter sound effect description..."
                          />
                          {/* Debug: Show if soundDescription exists */}
                          {soundDescValue && (
                            <div className="text-xs text-muted-foreground italic">
                              Sound effect loaded ({soundDescValue.length} chars)
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // For other modes: Show voiceover if enabled
                    if (voiceoverEnabled) {
                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-xs font-medium text-muted-foreground">Voiceover Text</span>
                          </div>
                          <Textarea
                            value={scene.narration || ''}
                            onChange={(e) => onSceneUpdate(scene.id, { narration: e.target.value })}
                            className={cn(
                              "min-h-[80px] bg-muted/50 dark:bg-white/5 border-border dark:border-white/10",
                              "focus:border-purple-500/30 resize-none",
                              "text-sm leading-relaxed text-foreground",
                              "placeholder:text-muted-foreground/50 dark:placeholder:text-white/20"
                            )}
                            placeholder="Enter voiceover narration..."
                          />
                          
                          {/* Text Duration Warning */}
                          {(() => {
                            const status = getTextDurationStatus(scene.narration || '', scene.duration);
                            if (status.status === 'ok') {
                              return (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{status.message}</span>
                                </div>
                              );
                            }
                            return (
                              <div className={cn(
                                "flex items-center gap-1.5 text-xs px-2 py-1 rounded",
                                status.status === 'error' 
                                  ? "bg-red-500/10 text-red-400" 
                                  : "bg-yellow-500/10 text-yellow-400"
                              )}>
                                <AlertTriangle className="w-3 h-3" />
                                <span>{status.message}</span>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              </GlassPanel>
            </motion.div>
          ))}
          
          {/* Add Scene Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: scenes.length * 0.03 }}
            className="h-full min-h-[280px]"
          >
            <button
              onClick={onSceneAdd}
              className={cn(
                "w-full h-full rounded-xl border-2 border-dashed border-border",
                "bg-muted/30 dark:bg-white/[0.02] hover:bg-muted/50 dark:hover:bg-white/[0.05]",
                "flex flex-col items-center justify-center gap-3",
                "transition-all duration-200 group"
              )}
            >
              <div className={cn(
                "p-3 rounded-lg bg-gradient-to-br",
                accentClasses,
                "group-hover:scale-110 transition-transform"
              )}>
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/70">Add New Scene</p>
                <p className="text-xs text-muted-foreground mt-1">Click to add a scene</p>
              </div>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer Stats - Fixed */}
      <div className="flex-shrink-0 px-8 py-4 border-t border-border bg-muted/30 dark:bg-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Total Duration: 
              <span className={cn(
                "ml-2 font-semibold",
                scenesWithIssues.length > 0 ? "text-red-400" :
                isDurationValid ? "text-green-400" : "text-yellow-400"
              )}>
                {totalDuration}s
              </span>
            </p>
            {duration && !isDurationValid && scenesWithIssues.length === 0 && (
              <span className="text-sm text-yellow-400/80">
                (Target: {duration}s, difference: {durationDifference > 0 ? '+' : ''}{durationDifference}s)
              </span>
            )}
            {scenesWithIssues.length > 0 ? (
              <span className="text-xs text-red-400 flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10">
                <AlertTriangle className="w-3 h-3" />
                {scenesWithIssues.length} scene{scenesWithIssues.length > 1 ? 's' : ''} need attention
              </span>
            ) : isDurationValid ? (
              <span className="text-xs text-green-400 flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10">
                ✓ Ready to proceed
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {imageMode === 'image-to-video' && modelConfig && (
              <span className="text-foreground/60">
                {modelConfig.label}: [{modelConfig.durations.join(', ')}]s
              </span>
            )}
            <span>{aspectRatio} · {imageMode} · {voiceoverEnabled ? 'Voiceover On' : 'Voiceover Off'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
