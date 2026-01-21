import { useState, useEffect, useRef, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Volume2, 
  Music, 
  Upload, 
  Repeat,
  Play,
  Mic,
  Sparkles,
  X,
  Lock,
  Unlock,
  ArrowRight,
  Loader2,
  RefreshCw,
  Eye,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot, ShotVersion, LoopType } from "@/types/storyboard";

interface SoundscapeTabProps {
  videoId: string;
  animationMode?: 'image-transitions' | 'video-animation'; // Added to conditionally show sound effects
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  // Loop settings from Step 1
  loopMode: boolean;
  loopType: LoopType;
  segmentLoopEnabled: boolean;
  segmentLoopCount: 'auto' | number;
  shotLoopEnabled: boolean;
  shotLoopCount: 'auto' | number;
  // Loop settings lock state (from Step 5 data)
  loopSettingsLocked: boolean;
  onLockToggle: (locked: boolean) => void;
  // Voiceover settings from Step 1
  voiceoverEnabled: boolean;
  // Voiceover data from Step 5
  voiceoverScript?: string;
  voiceoverAudioUrl?: string;
  // Background Music settings
  backgroundMusicEnabled?: boolean;   // From Step 1
  hasCustomMusic?: boolean;           // From Step 2
  customMusicUrl?: string;            // From Step 2
  musicStyle?: string;                // From Step 2
  generatedMusicUrl?: string;         // From Step 5
  generatedMusicDuration?: number;    // From Step 5
  onMusicGenerated?: (musicUrl: string, duration: number) => void;
  onVoiceoverGenerated?: (voiceoverUrl: string) => void;  // Callback when voiceover is generated
  // Callbacks
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
}

// Shot card component for Soundscape - Sound Effects only (Voiceover is global)
function SoundscapeShotCard({
  shot,
  shotIndex,
  version,
  loopMode,
  shotLoopEnabled,
  defaultShotLoopCount,
  loopSettingsLocked,
  showSoundEffects = true, // Default to true for backward compatibility
  videoId,
  sceneId,
  animationMode = 'video-animation', // Added to check mode
  isGeneratingSfxFromBulk = false, // Added for bulk generation loading state
  onUpdateShot,
}: {
  shot: Shot;
  shotIndex: number;
  version: ShotVersion | null;
  loopMode: boolean;
  shotLoopEnabled: boolean;
  defaultShotLoopCount: number | null;
  loopSettingsLocked: boolean;
  showSoundEffects?: boolean; // Added to conditionally show sound effects UI
  videoId: string;
  sceneId: string;
  animationMode?: 'image-transitions' | 'video-animation'; // Added
  isGeneratingSfxFromBulk?: boolean; // Added for bulk generation loading state
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
}) {
  const { toast } = useToast();
  const [loopPopoverOpen, setLoopPopoverOpen] = useState(false);
  const [isRecommendingSfx, setIsRecommendingSfx] = useState(false);
  const [isGeneratingSfx, setIsGeneratingSfx] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // For image-transitions mode, check imageUrl; for video-animation mode, check videoUrl
  const hasVideo = animationMode === 'image-transitions'
    ? (version?.imageUrl && typeof version.imageUrl === 'string' && version.imageUrl.trim().length > 0)
    : (version?.videoUrl && typeof version.videoUrl === 'string' && version.videoUrl.trim().length > 0);
    
  const hasSoundEffect = shot.soundEffectUrl && 
                         typeof shot.soundEffectUrl === 'string' && 
                         shot.soundEffectUrl.trim().length > 0;

  // Get current loop count - use saved value or default to 1
  // NOTE: Loop counts are now initialized by the backend during step 4->5 transition
  // Do NOT auto-initialize here as it causes race conditions that overwrite saved data
  const currentLoopCount = shot.loopCount ?? defaultShotLoopCount ?? 1;
  
  // Combine local and bulk generation states
  const isCurrentlyGeneratingSfx = isGeneratingSfx || isGeneratingSfxFromBulk;

  // Sync audio playback with video playback
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio || !hasSoundEffect) return;

    const handlePlay = () => {
      audio.currentTime = video.currentTime;
      audio.play().catch(console.error);
    };

    const handlePause = () => {
      audio.pause();
    };

    const handleTimeUpdate = () => {
      if (Math.abs(audio.currentTime - video.currentTime) > 0.1) {
        audio.currentTime = video.currentTime;
      }
    };

    const handleSeeked = () => {
      audio.currentTime = video.currentTime;
    };

    const handleEnded = () => {
      // When video ends and loops, reset audio
      audio.currentTime = 0;
      if (!video.paused) {
        audio.play().catch(console.error);
      }
    };

    const handleSeeking = () => {
      // Sync immediately when user seeks
      audio.currentTime = video.currentTime;
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('ended', handleEnded);
    };
  }, [hasSoundEffect]);

  return (
    <Card className="shrink-0 w-80 overflow-visible bg-white/[0.02] border-white/[0.06]">
      {/* Video Preview - matches Composition phase image preview area */}
      <div className="aspect-video bg-black/30 relative group rounded-t-lg overflow-hidden">
        {hasVideo ? (
          <>
          {animationMode === 'image-transitions' ? (
            // Show image for image-transitions mode
            <img
              src={version?.imageUrl || ''}
              alt={`Shot ${shot.shotNumber}`}
              className="w-full h-full object-cover"
            />
          ) : (
            // Show video for video-animation mode
            <video
              ref={videoRef}
              src={version?.videoUrl || ''}
              className="w-full h-full object-cover"
              controls
              muted
              loop
              playsInline
            />
          )}
            {hasSoundEffect && animationMode === 'video-animation' && (
              <audio
                ref={audioRef}
                src={shot.soundEffectUrl || ''}
                loop
                preload="auto"
                className="hidden"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 gap-2">
            <Play className="h-12 w-12 text-white/30" />
            <p className="text-xs text-white/50">
              {animationMode === 'image-transitions' ? 'No image generated' : 'No video generated'}
            </p>
          </div>
        )}
        
        {/* Shot badge - top left */}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <Badge variant="outline" className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/50">
            # {shot.shotNumber}
          </Badge>
          <Badge variant="outline" className="bg-black/60 backdrop-blur-sm text-white/70 border-white/20">
            {shot.duration}s
          </Badge>
        </div>
        
        {/* Loop count badge - top right (only if loop mode enabled) */}
        {loopMode && shotLoopEnabled && (
          <div className="absolute top-2 right-2">
            <Popover open={loopSettingsLocked ? false : loopPopoverOpen} onOpenChange={loopSettingsLocked ? undefined : setLoopPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className={`flex items-center gap-1 px-2 py-1 rounded-md backdrop-blur-sm border transition-colors ${
                    loopSettingsLocked 
                      ? 'bg-amber-500/10 border-amber-500/20 cursor-not-allowed' 
                      : 'bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30'
                  }`}
                  title={loopSettingsLocked ? "Loop settings are locked" : "Edit loop count"}
                  disabled={loopSettingsLocked}
                >
                  {loopSettingsLocked ? (
                    <Lock className="h-3 w-3 text-amber-400/60" />
                  ) : (
                    <Repeat className="h-3 w-3 text-amber-400" />
                  )}
                  <span className={`text-xs font-medium ${loopSettingsLocked ? 'text-amber-300/60' : 'text-amber-300'}`}>×{currentLoopCount}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3 bg-[#0a0a0a] border-white/10" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-white/70 font-medium">Loop Count</Label>
                    <button 
                      onClick={() => setLoopPopoverOpen(false)}
                      className="text-white/40 hover:text-white/60"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-white/10 hover:bg-white/5"
                      onClick={() => {
                        const newCount = Math.max(1, currentLoopCount - 1);
                        onUpdateShot(shot.id, { loopCount: newCount });
                      }}
                    >
                      <span className="text-base font-medium">−</span>
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={currentLoopCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        onUpdateShot(shot.id, { loopCount: Math.min(99, Math.max(1, val)) });
                      }}
                      className="h-8 text-sm text-center bg-white/5 border-white/10 w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-white/10 hover:bg-white/5"
                      onClick={() => {
                        const newCount = Math.min(99, currentLoopCount + 1);
                        onUpdateShot(shot.id, { loopCount: newCount });
                      }}
                    >
                      <span className="text-base font-medium">+</span>
                    </Button>
                  </div>
                  <p className="text-[10px] text-white/40 text-center">
                    Times this shot repeats
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* SFX Play Indicator */}
      {hasVideo && hasSoundEffect && (
        <div className="px-4 pt-2 flex items-center gap-2 text-xs text-teal-400">
          <Music className="h-3.5 w-3.5" />
          <span>SFX will play with video</span>
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Sound Effects Section - Only shown for video-animation mode */}
        {showSoundEffects && (
          <>
            {/* Sound Effects Section Header with Recommend Button */}
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-teal-400" />
              <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Sound Effects</Label>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-2 hover:bg-white/5 text-teal-400 hover:text-teal-300"
                disabled={isRecommendingSfx}
                onClick={async () => {
                  setIsRecommendingSfx(true);
                  try {
                    const response = await fetch(`/api/ambient-visual/videos/${videoId}/shots/${shot.id}/sound-effect/recommend`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                    });
                    
                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Failed to get recommendation');
                    }
                    
                    const data = await response.json();
                    onUpdateShot(shot.id, { soundEffectDescription: data.prompt });
                    toast({
                      title: "Sound effect recommended",
                      description: "AI-generated sound effect description added",
                    });
                  } catch (error) {
                    console.error('[SoundscapeShotCard] Failed to get recommendation:', error);
                    toast({
                      title: "Recommendation failed",
                      description: error instanceof Error ? error.message : "Failed to get sound effect recommendation",
                      variant: "destructive",
                    });
                  } finally {
                    setIsRecommendingSfx(false);
                  }
                }}
              >
                {isRecommendingSfx ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 h-3 w-3" />
                )}
                Recommend
              </Button>
            </div>
            
            {/* Sound Effects Description */}
            <Textarea
              placeholder="Describe sound effects (e.g., rain, wind, birds)..."
              className="min-h-[80px] text-xs bg-white/5 border-white/10 resize-none"
              value={shot.soundEffectDescription || ''}
              onChange={(e) => onUpdateShot(shot.id, { soundEffectDescription: e.target.value })}
            />
            
            {/* Generate/Regenerate SFX Button */}
            <Button
              size="sm"
              variant="ghost"
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white disabled:opacity-50"
              disabled={isCurrentlyGeneratingSfx || !hasVideo}
              onClick={async () => {
                if (!hasVideo) {
                  toast({
                    title: "No video available",
                    description: "Generate video for this shot first",
                    variant: "destructive",
                  });
                  return;
                }

                setIsGeneratingSfx(true);
                try {
                  // Store the old SFX URL for deletion
                  const oldSoundEffectUrl = shot.soundEffectUrl;
                  
                  // Use default prompt if no description is provided
                  const prompt = shot.soundEffectDescription?.trim() || "Generate a Soundeffect for The Following Video";
                  
                  const response = await fetch(`/api/ambient-visual/videos/${videoId}/shots/${shot.id}/sound-effect/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      prompt: prompt,
                      previousSoundEffectUrl: oldSoundEffectUrl || undefined,
                    }),
                  });
                  
                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to generate sound effect');
                  }
                  
                  const data = await response.json();
                  // Update both URL and description (in case default prompt was used)
                  onUpdateShot(shot.id, { 
                    soundEffectUrl: data.audioUrl,
                    soundEffectDescription: prompt, // Save the prompt that was used (default or user-provided)
                  });
                  toast({
                    title: shot.soundEffectUrl ? "Sound effect regenerated" : "Sound effect generated",
                    description: "Video with sound effects is ready",
                  });
                } catch (error) {
                  console.error('[SoundscapeShotCard] Failed to generate sound effect:', error);
                  toast({
                    title: "Generation failed",
                    description: error instanceof Error ? error.message : "Failed to generate sound effect",
                    variant: "destructive",
                  });
                } finally {
                  setIsGeneratingSfx(false);
                }
              }}
            >
              {isCurrentlyGeneratingSfx ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  {shot.soundEffectUrl ? "Regenerating..." : "Generating..."}
                </>
              ) : (
                <>
              <Sparkles className="mr-2 h-3 w-3" />
                  {shot.soundEffectUrl ? "Regenerate SFX" : "Generate SFX"}
                </>
              )}
            </Button>
            
            {/* SFX Uploaded Indicator */}
            {shot.soundEffectUrl && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-teal-500/10 border border-teal-500/20">
                <Music className="h-3.5 w-3.5 text-teal-400" />
                <span className="text-xs text-teal-300 truncate flex-1">SFX uploaded</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Scene row component to properly use hooks
function SceneRow({
  scene,
  sceneIndex,
  sceneShots,
  shotVersions,
  loopMode,
  segmentLoopEnabled,
  defaultSegmentLoopCount,
  shotLoopEnabled,
  defaultShotLoopCount,
  loopSettingsLocked,
  showSoundEffects = true, // Added for image-transitions mode
  animationMode = 'video-animation', // Added
  videoId,
  generatingSfxShotIds, // Added for bulk SFX generation
  onUpdateScene,
  onUpdateShot,
  getShotVersion,
}: {
  scene: Scene;
  sceneIndex: number;
  sceneShots: Shot[];
  shotVersions: { [shotId: string]: ShotVersion[] };
  loopMode: boolean;
  segmentLoopEnabled: boolean;
  defaultSegmentLoopCount: number | null;
  shotLoopEnabled: boolean;
  defaultShotLoopCount: number | null;
  loopSettingsLocked: boolean;
  showSoundEffects?: boolean; // Added for image-transitions mode
  animationMode?: 'image-transitions' | 'video-animation'; // Added
  videoId: string;
  generatingSfxShotIds: Set<string>; // Added for bulk SFX generation
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
  getShotVersion: (shot: Shot) => ShotVersion | null;
}) {
  // NOTE: Scene loop counts are now initialized by the backend during step 4->5 transition
  // Do NOT auto-initialize here as it causes race conditions that overwrite saved data

  // Calculate total duration with loops:
  // 1. Each shot duration = shot.duration × shot.loopCount
  // 2. Scene total = sum(shot durations) × scene.loopCount
  const calculateTotalDuration = () => {
    // Sum all shot durations × their loop counts
    const shotsWithLoopsDuration = sceneShots.reduce((total, shot) => {
      const shotLoopCount = shot.loopCount ?? 1;
      return total + (shot.duration * shotLoopCount);
    }, 0);
    
    // Multiply by scene loop count
    const sceneLoopCount = scene.loopCount ?? 1;
    return shotsWithLoopsDuration * sceneLoopCount;
  };

  const totalDuration = calculateTotalDuration();
  const baseDuration = sceneShots.reduce((total, shot) => total + shot.duration, 0);

  // Format duration as minutes:seconds if over 60 seconds
  const formatDuration = (seconds: number) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Card className="bg-white/[0.02] border-white/[0.06]">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Left Sidebar - Scene Info */}
          <div className="w-72 shrink-0 space-y-3">
            {/* Scene Header */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/50 text-xs px-2">
                # {sceneIndex + 1}
              </Badge>
              <span className="text-sm font-medium text-white truncate">{scene.title}</span>
            </div>

            {/* Scene Description */}
            <p className="text-xs text-white/50 line-clamp-3">
              {scene.description || "No description"}
            </p>

            {/* Scene Stats */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Shots</span>
                <span className="text-white/70">{sceneShots.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Duration</span>
                <span className="text-white/70" title={`Base: ${baseDuration}s, With loops: ${totalDuration}s`}>
                  {formatDuration(totalDuration)}
                </span>
              </div>
            </div>

            {/* Scene Loop Count (conditional) */}
            {loopMode && segmentLoopEnabled && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-amber-400" />
                    <Label className="text-xs text-white/70 uppercase tracking-wider font-medium">
                      Scene Loop
                    </Label>
                  </div>
                  {loopSettingsLocked && (
                    <Lock className="h-3 w-3 text-amber-400/60" />
                  )}
                </div>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={scene.loopCount ?? defaultSegmentLoopCount ?? 1}
                  onChange={(e) => onUpdateScene(scene.id, { loopCount: parseInt(e.target.value) || 1 })}
                  disabled={loopSettingsLocked}
                  className={`h-8 text-xs bg-white/5 border-white/10 ${loopSettingsLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                <p className="text-[10px] text-white/40">
                  Times this scene repeats
                </p>
              </div>
            )}
          </div>

          {/* Shot Cards - Horizontal Scroll */}
          <div className="flex-1 overflow-x-auto scrollbar-thin">
            <div className="flex items-start gap-0 pb-2">
              {sceneShots.map((shot, shotIndex) => {
                const version = getShotVersion(shot);
                const isLastShot = shotIndex === sceneShots.length - 1;
                
                return (
                  <Fragment key={shot.id}>
                    <SoundscapeShotCard
                      shot={shot}
                      shotIndex={shotIndex}
                      version={version}
                      loopMode={loopMode}
                      shotLoopEnabled={shotLoopEnabled}
                      defaultShotLoopCount={defaultShotLoopCount}
                      loopSettingsLocked={loopSettingsLocked}
                      showSoundEffects={showSoundEffects}
                      animationMode={animationMode}
                      videoId={videoId}
                      sceneId={scene.id}
                      onUpdateShot={onUpdateShot}
                      isGeneratingSfxFromBulk={generatingSfxShotIds.has(shot.id)}
                    />
                    
                    {/* Transition indicator between shots */}
                    {!isLastShot && (
                      <div className="shrink-0 flex items-center self-center mx-2 h-[180px]">
                        <div className="flex flex-col items-center justify-center w-10 gap-0.5 py-1 rounded-md bg-white/5 border border-dashed border-white/10">
                          <ArrowRight className="h-3 w-3 text-white/60" />
                          <span className="text-[9px] text-white/60 font-medium">
                            {shot.transition || "Cut"}
                          </span>
                        </div>
                      </div>
                    )}
                  </Fragment>
                );
              })}

              {/* Empty State */}
              {sceneShots.length === 0 && (
                <div className="w-full flex items-center justify-center py-12 text-white/30">
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No shots in this scene</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SoundscapeTab({
  videoId,
  animationMode = 'video-animation', // Default to video-animation for backward compatibility
  scenes,
  shots,
  shotVersions,
  loopMode,
  loopType,
  segmentLoopEnabled,
  segmentLoopCount,
  shotLoopEnabled,
  shotLoopCount,
  loopSettingsLocked,
  onLockToggle,
  voiceoverEnabled = false,
  voiceoverScript: initialVoiceoverScript = '',
  voiceoverAudioUrl: initialVoiceoverAudioUrl,
  backgroundMusicEnabled = false,
  hasCustomMusic = false,
  customMusicUrl,
  musicStyle,
  generatedMusicUrl: initialGeneratedMusicUrl,
  generatedMusicDuration: initialGeneratedMusicDuration,
  onMusicGenerated,
  onVoiceoverGenerated,
  onUpdateShot,
  onUpdateScene,
}: SoundscapeTabProps) {
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Determine if sound effects should be shown (only for video-animation mode)
  const showSoundEffects = animationMode === 'video-animation';
  
  // Voiceover state
  const [voiceoverScript, setVoiceoverScript] = useState<string>(initialVoiceoverScript);
  const [voiceoverAudioUrl, setVoiceoverAudioUrl] = useState<string | null>(initialVoiceoverAudioUrl || null);
  const [isVoiceoverGenerated, setIsVoiceoverGenerated] = useState(!!initialVoiceoverScript);
  const [showVoiceoverModal, setShowVoiceoverModal] = useState(false);
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Background Music state
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(initialGeneratedMusicUrl || null);
  const [generatedMusicDuration, setGeneratedMusicDuration] = useState<number | null>(initialGeneratedMusicDuration || null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [showLockConfirmation, setShowLockConfirmation] = useState(false);

  // Sound Effects state (for bulk generation)
  const [generatingSfxShotIds, setGeneratingSfxShotIds] = useState<Set<string>>(new Set());

  // Calculate total video duration with all loops
  const calculateTotalVideoDuration = () => {
    let total = 0;
    for (const scene of scenes) {
      const sceneShots = shots[scene.id] || [];
      let sceneDuration = 0;
      for (const shot of sceneShots) {
        const shotLoopCount = shot.loopCount ?? 1;
        sceneDuration += shot.duration * shotLoopCount;
      }
      const sceneLoopCount = scene.loopCount ?? 1;
      total += sceneDuration * sceneLoopCount;
    }
    return total;
  };

  const totalVideoDuration = calculateTotalVideoDuration();

  // Format duration as hours:minutes:seconds
  const formatTotalDuration = (seconds: number) => {
    if (seconds >= 3600) {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hrs}h ${mins}m ${secs}s`;
    } else if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    return `${seconds}s`;
  };

  // Sync with props when they change (e.g., on video reload)
  useEffect(() => {
    if (initialVoiceoverScript && initialVoiceoverScript.trim().length > 0) {
      setVoiceoverScript(initialVoiceoverScript);
      setIsVoiceoverGenerated(true);
    } else if (initialVoiceoverScript === undefined || initialVoiceoverScript === '') {
      // Only reset if explicitly undefined or empty (not just whitespace)
      setVoiceoverScript('');
      setIsVoiceoverGenerated(false);
    }
    if (initialVoiceoverAudioUrl) {
      setVoiceoverAudioUrl(initialVoiceoverAudioUrl);
    } else if (initialVoiceoverAudioUrl === undefined || initialVoiceoverAudioUrl === '') {
      setVoiceoverAudioUrl(null);
    }
  }, [initialVoiceoverScript, initialVoiceoverAudioUrl]);

  // Sync music props
  useEffect(() => {
    if (initialGeneratedMusicUrl) {
      setGeneratedMusicUrl(initialGeneratedMusicUrl);
    }
    if (initialGeneratedMusicDuration) {
      setGeneratedMusicDuration(initialGeneratedMusicDuration);
    }
  }, [initialGeneratedMusicUrl, initialGeneratedMusicDuration]);

  // Calculate default loop counts from Step 1 settings
  const defaultSegmentLoopCount = segmentLoopCount !== 'auto' ? segmentLoopCount : null;
  const defaultShotLoopCount = shotLoopCount !== 'auto' ? shotLoopCount : null;

  // Get total counts
  // For image-transitions mode, check imageUrl; for video-animation mode, check videoUrl
  const allShots = Object.values(shots).flat();
  const totalShots = allShots.length;
  const shotsWithVideo = allShots.filter(s => {
    const v = shotVersions[s.id]?.[shotVersions[s.id]?.length - 1];
    
    // For image-transitions mode, check if image exists (no videos needed)
    if (animationMode === 'image-transitions') {
      return v?.imageUrl && typeof v.imageUrl === 'string' && v.imageUrl.trim().length > 0;
    }
    
    // For video-animation mode, check if video exists
    return v?.videoUrl && typeof v.videoUrl === 'string' && v.videoUrl.trim().length > 0;
  }).length;

  // Check if all sound effects are ready (for video-animation mode only)
  const allSoundEffectsReady = animationMode === 'video-animation' ? allShots.every(shot => {
    const version = shotVersions[shot.id]?.[shotVersions[shot.id]?.length - 1];
    const hasVideo = version?.videoUrl && typeof version.videoUrl === 'string' && version.videoUrl.trim().length > 0;
    const hasSoundEffect = shot.soundEffectUrl && typeof shot.soundEffectUrl === 'string' && shot.soundEffectUrl.trim().length > 0;
    
    // If shot doesn't have video yet, we don't count it as "missing SFX"
    // Only shots with videos need sound effects
    return !hasVideo || hasSoundEffect;
  }) : true; // For image-transitions, always true (no SFX needed)

  // Track scroll position for header blur effect
  useEffect(() => {
    const handleScroll = () => {
      // Find the scrolling container (main element with overflow-y-auto)
      const scrollContainer = document.querySelector('main.overflow-y-auto');
      if (scrollContainer) {
        setIsScrolled(scrollContainer.scrollTop > 10);
      }
    };
    
    const scrollContainer = document.querySelector('main.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Get version for a shot
  const getShotVersion = (shot: Shot): ShotVersion | null => {
    const versions = shotVersions[shot.id];
    if (!versions || versions.length === 0) return null;
    if (shot.currentVersionId) {
      return versions.find(v => v.id === shot.currentVersionId) || versions[versions.length - 1];
    }
    return versions[versions.length - 1];
  };

  // Handler for bulk sound effects generation
  const handleGenerateAllSoundEffects = async () => {
    console.log('[SoundscapeTab] Starting bulk sound effects generation');
    
    // Get all shots that need sound effects
    const shotsNeedingSfx = allShots.filter(shot => {
      const version = getShotVersion(shot);
      const hasVideo = version?.videoUrl && typeof version.videoUrl === 'string' && version.videoUrl.trim().length > 0;
      const hasSoundEffect = shot.soundEffectUrl && typeof shot.soundEffectUrl === 'string' && shot.soundEffectUrl.trim().length > 0;
      return hasVideo && !hasSoundEffect;
    });

    if (shotsNeedingSfx.length === 0) {
      toast({
        title: "All sound effects generated",
        description: "All shots already have sound effects",
      });
      return;
    }

    console.log('[SoundscapeTab] Shots needing SFX:', shotsNeedingSfx.length);
    
    // Mark all shots as generating
    setGeneratingSfxShotIds(new Set(shotsNeedingSfx.map(s => s.id)));

    let successCount = 0;
    let failureCount = 0;

    // Generate sound effects for each shot
    for (const shot of shotsNeedingSfx) {
      try {
        console.log(`[SoundscapeTab] Generating SFX for shot ${shot.id}`);
        
        const prompt = shot.soundEffectDescription?.trim() || "Generate a Soundeffect for The Following Video";
        
        const response = await fetch(`/api/ambient-visual/videos/${videoId}/shots/${shot.id}/sound-effect/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            prompt: prompt,
            previousSoundEffectUrl: shot.soundEffectUrl || undefined,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate sound effect');
        }
        
        const data = await response.json();
        
        // Update shot with new sound effect
        onUpdateShot(shot.id, { 
          soundEffectUrl: data.audioUrl,
          soundEffectDescription: prompt,
        });
        
        successCount++;
        console.log(`[SoundscapeTab] ✓ Generated SFX for shot ${shot.id}`);
      } catch (error) {
        console.error(`[SoundscapeTab] ✗ Failed to generate SFX for shot ${shot.id}:`, error);
        failureCount++;
      } finally {
        // Remove from generating set
        setGeneratingSfxShotIds(prev => {
          const next = new Set(prev);
          next.delete(shot.id);
          return next;
        });
      }
    }

    // Show completion toast
    if (successCount > 0) {
      toast({
        title: "Sound effects generated",
        description: `${successCount} of ${shotsNeedingSfx.length} sound effects generated successfully`,
      });
    }

    if (failureCount > 0) {
      toast({
        title: "Some generations failed",
        description: `${failureCount} sound effect generations failed`,
        variant: "destructive",
      });
    }

    console.log('[SoundscapeTab] Bulk SFX generation complete:', { successCount, failureCount, total: shotsNeedingSfx.length });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Design Your Soundscape</h2>
        <p className="text-muted-foreground">
          Add voiceover and sound effects to enhance your ambient visual
        </p>
      </div>

      {/* Sticky Controls Bar */}
      <Card className={`sticky top-0 z-50 border-white/[0.06] transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/40 backdrop-blur-xl backdrop-saturate-150' 
          : 'bg-white/[0.02]'
      }`}>
        <CardContent className="py-4 px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                  <Volume2 className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Soundscape</h3>
                  <p className="text-sm text-muted-foreground">
                    {shotsWithVideo} of {totalShots} shots have {animationMode === 'image-transitions' ? 'images' : 'videos'}
                  </p>
                </div>
              </div>
              
              {/* Total Video Duration */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <Clock className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-white/80">
                  Total: {formatTotalDuration(totalVideoDuration)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Lock Loop Settings Button */}
              {loopMode && (
                <>
                <Button
                  onClick={() => {
                      if (loopSettingsLocked) {
                        // Show warning dialog when trying to unlock
                    toast({
                          title: "Settings Already Locked",
                          description: "Loop settings are locked and cannot be unlocked.",
                          variant: "destructive",
                    });
                      } else {
                        // Show confirmation dialog before locking
                        setShowLockConfirmation(true);
                      }
                  }}
                  variant={loopSettingsLocked ? "default" : "outline"}
                  className={loopSettingsLocked 
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white cursor-not-allowed" 
                    : "border-white/20 hover:bg-white/5"
                  }
                    disabled={loopSettingsLocked}
                >
                  {loopSettingsLocked ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Loop Settings Locked
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      Lock Loop Settings
                    </>
                  )}
                </Button>
                  
                  {/* Lock Confirmation Dialog */}
                  <AlertDialog open={showLockConfirmation} onOpenChange={setShowLockConfirmation}>
                    <AlertDialogContent className="bg-[#0a0a0a] border-white/[0.08] p-0 gap-0 overflow-hidden sm:max-w-[500px]">
                      {/* Header with gradient background */}
                      <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-amber-500/10 to-transparent">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                            <Lock className="h-6 w-6 text-amber-400" />
                          </div>
                          <div>
                            <AlertDialogTitle className="text-xl font-semibold">Confirm Lock Loop Settings</AlertDialogTitle>
                            <p className="text-sm text-white/50 mt-0.5">This action cannot be undone</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-6 pb-6 space-y-5">
                        <AlertDialogDescription className="text-sm text-white/70 leading-relaxed">
                          Once loop settings are locked, they cannot be unlocked. This ensures consistency for voiceover and music generation timing. Are you sure you want to lock the loop settings?
                        </AlertDialogDescription>
                        
                        <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-3 border-t border-white/[0.06]">
                          <AlertDialogCancel 
                            onClick={() => setShowLockConfirmation(false)}
                            className="w-full sm:w-auto border-white/[0.1] hover:bg-white/[0.03] hover:border-white/[0.15] transition-colors bg-transparent text-white/70 hover:text-white"
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              onLockToggle(true);
                              setShowLockConfirmation(false);
                              toast({
                                title: "Loop Settings Locked",
                                description: "Loop counts are now locked and cannot be changed. You can now generate voiceover and music.",
                              });
                            }}
                            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-lg shadow-amber-500/20"
                          >
                            Lock Settings
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              
              {/* Generate/View Voiceover Button - Only shown if voiceover is enabled */}
              {voiceoverEnabled && (
                <Button
                  disabled={isGeneratingVoiceover || (loopMode && !loopSettingsLocked)}
                  onClick={async () => {
                    if (loopMode && !loopSettingsLocked) {
                      toast({
                        title: "Loop Settings Must Be Locked",
                        description: "Please lock your loop settings before generating voiceover.",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (isVoiceoverGenerated) {
                      // Open modal to view voiceover
                      setShowVoiceoverModal(true);
                    } else {
                      // Generate voiceover script via API
                      setIsGeneratingVoiceover(true);
                      try {
                        const response = await fetch(`/api/ambient-visual/videos/${videoId}/voiceover/generate-script`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                        });
                        
                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error || 'Failed to generate voiceover script');
                        }
                        
                        const data = await response.json();
                        setVoiceoverScript(data.script);
                        setIsVoiceoverGenerated(true);
                        setShowVoiceoverModal(true);
                        toast({
                          title: "Voiceover Script Generated",
                          description: `Estimated duration: ${Math.round(data.estimatedDuration / 60)}min ${data.estimatedDuration % 60}s`,
                        });
                      } catch (error) {
                        console.error('[SoundscapeTab] Failed to generate voiceover:', error);
                        toast({
                          title: "Generation Failed",
                          description: error instanceof Error ? error.message : "Failed to generate voiceover script",
                          variant: "destructive",
                        });
                      } finally {
                        setIsGeneratingVoiceover(false);
                      }
                    }
                  }}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white disabled:opacity-50"
                >
                  {isGeneratingVoiceover ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Script...
                    </>
                  ) : isVoiceoverGenerated ? (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      View Voiceover
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Voiceover
                    </>
                  )}
                </Button>
              )}

              {/* Background Music Button - Only shown if music enabled AND no custom music */}
              {backgroundMusicEnabled && !hasCustomMusic && (
                <Button
                  disabled={isGeneratingMusic || (loopMode && !loopSettingsLocked)}
                  onClick={async () => {
                    if (loopMode && !loopSettingsLocked) {
                      toast({
                        title: "Loop Settings Must Be Locked",
                        description: "Please lock your loop settings before generating music.",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (generatedMusicUrl) {
                      // Show music player
                      setShowMusicPlayer(true);
                    } else {
                      // Generate music via API
                      setIsGeneratingMusic(true);
                      try {
                        const response = await fetch(`/api/ambient-visual/videos/${videoId}/music/generate`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                        });
                        
                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error || error.details || 'Failed to generate music');
                        }
                        
                        const data = await response.json();
                        setGeneratedMusicUrl(data.musicUrl);
                        setGeneratedMusicDuration(data.duration);
                        setShowMusicPlayer(true);
                        
                        // Notify parent
                        if (onMusicGenerated) {
                          onMusicGenerated(data.musicUrl, data.duration);
                        }
                        
                        toast({
                          title: "Background Music Generated",
                          description: `Duration: ${Math.floor(data.duration / 60)}min ${data.duration % 60}s`,
                        });
                      } catch (error) {
                        console.error('[SoundscapeTab] Failed to generate music:', error);
                        toast({
                          title: "Music Generation Failed",
                          description: error instanceof Error ? error.message : "Failed to generate background music",
                          variant: "destructive",
                        });
                      } finally {
                        setIsGeneratingMusic(false);
                      }
                    }
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50"
                >
                  {isGeneratingMusic ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Music...
                    </>
                  ) : generatedMusicUrl ? (
                    <>
                      <Music className="mr-2 h-4 w-4" />
                      View Music
                    </>
                  ) : (
                    <>
                      <Music className="mr-2 h-4 w-4" />
                      Generate Background Music
                    </>
                  )}
                </Button>
              )}

              {/* Custom Music Info - Only shown if music enabled AND custom music uploaded */}
              {backgroundMusicEnabled && hasCustomMusic && customMusicUrl && (
                <Badge variant="outline" className="border-purple-500/50 text-purple-400 py-1.5 px-3">
                  <Music className="mr-1.5 h-3.5 w-3.5" />
                  Custom Music Uploaded
                </Badge>
              )}

              {/* Generate All Sound Effects Button - Only shown for video-animation mode and when not all SFX are ready */}
              {showSoundEffects && !allSoundEffectsReady && (
                <Button
                  disabled={generatingSfxShotIds.size > 0}
                  onClick={handleGenerateAllSoundEffects}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white disabled:opacity-50"
                >
                  {generatingSfxShotIds.size > 0 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating SFX ({allShots.length - generatingSfxShotIds.size}/{allShots.filter(s => {
                        const v = getShotVersion(s);
                        return v?.videoUrl && !s.soundEffectUrl;
                      }).length})
                    </>
                  ) : (
                    <>
                      <Volume2 className="mr-2 h-4 w-4" />
                      Generate All Sound Effects
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenes and Shots */}
      <div className="space-y-8">
        {scenes.map((scene, sceneIndex) => (
          <SceneRow
            key={scene.id}
            scene={scene}
            sceneIndex={sceneIndex}
            sceneShots={shots[scene.id] || []}
            shotVersions={shotVersions}
            loopMode={loopMode}
            segmentLoopEnabled={segmentLoopEnabled}
            defaultSegmentLoopCount={defaultSegmentLoopCount}
            shotLoopEnabled={shotLoopEnabled}
            defaultShotLoopCount={defaultShotLoopCount}
            loopSettingsLocked={loopSettingsLocked}
            showSoundEffects={showSoundEffects}
            animationMode={animationMode}
            videoId={videoId}
            generatingSfxShotIds={generatingSfxShotIds}
            onUpdateScene={onUpdateScene}
            onUpdateShot={onUpdateShot}
            getShotVersion={getShotVersion}
          />
        ))}
      </div>

      {/* Empty State - No Scenes */}
      {scenes.length === 0 && (
        <Card className="border-dashed border-2 border-white/10 bg-white/[0.02]">
          <CardContent className="py-16 px-8">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                <Volume2 className="h-8 w-8 text-cyan-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No Scenes Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Complete the previous steps to generate scenes and shots before adding audio.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voiceover Modal */}
      <Dialog open={showVoiceoverModal} onOpenChange={setShowVoiceoverModal}>
        <DialogContent className="sm:max-w-[650px] bg-[#0a0a0a] border-white/[0.08] p-0 gap-0 overflow-hidden">
          {/* Header with gradient background */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-cyan-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30">
                <Mic className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Voiceover Script</DialogTitle>
                <p className="text-sm text-white/50 mt-0.5">Edit and preview your narration</p>
              </div>
            </div>
          </div>
          
          <div className="px-6 pb-6 space-y-5">
            {/* Script Editor Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-white/70 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Script
                </Label>
                <span className="text-xs text-white/40">{voiceoverScript.length} characters</span>
              </div>
              <div className="relative">
                <Textarea
                  value={voiceoverScript}
                  onChange={(e) => setVoiceoverScript(e.target.value)}
                  placeholder="Your voiceover script will appear here..."
                  className="min-h-[180px] bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 resize-none text-sm transition-colors rounded-xl"
                />
              </div>
            </div>

            {/* Audio Player Section */}
            <div className="space-y-3">
              <Label className="text-sm text-white/70 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                Audio Preview
              </Label>
              {voiceoverAudioUrl ? (
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/5 to-teal-500/5 border border-cyan-500/20">
                  <audio 
                    controls 
                    src={voiceoverAudioUrl} 
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="relative p-8 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.08] text-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-teal-500/[0.02]"></div>
                  <div className="relative">
                    <div className="inline-flex p-3 rounded-full bg-white/[0.03] mb-3">
                      <Volume2 className="h-6 w-6 text-white/20" />
                    </div>
                    <p className="text-sm text-white/40">
                      Audio will be generated from your script
                    </p>
                    <p className="text-xs text-white/25 mt-1">
                      Click "Regenerate" to create audio
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3 border-t border-white/[0.06]">
              <Button
                variant="outline"
                onClick={() => setShowVoiceoverModal(false)}
                className="flex-1 h-11 border-white/[0.1] hover:bg-white/[0.03] hover:border-white/[0.15] transition-colors"
              >
                Close
              </Button>
              <Button
                variant="outline"
                disabled={isGeneratingVoiceover}
                onClick={async () => {
                  // Regenerate voiceover script via API
                  setIsGeneratingVoiceover(true);
                  try {
                    const response = await fetch(`/api/ambient-visual/videos/${videoId}/voiceover/generate-script`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                    });
                    
                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Failed to regenerate voiceover script');
                    }
                    
                    const data = await response.json();
                    setVoiceoverScript(data.script);
                    setVoiceoverAudioUrl(null); // Clear old audio
                    toast({
                      title: "Script Regenerated",
                      description: `New estimated duration: ${Math.round(data.estimatedDuration / 60)}min ${data.estimatedDuration % 60}s`,
                    });
                  } catch (error) {
                    console.error('[SoundscapeTab] Failed to regenerate voiceover:', error);
                    toast({
                      title: "Regeneration Failed",
                      description: error instanceof Error ? error.message : "Failed to regenerate voiceover script",
                      variant: "destructive",
                    });
                  } finally {
                    setIsGeneratingVoiceover(false);
                  }
                }}
                className="h-11 border-white/[0.1] hover:bg-white/[0.03] hover:border-white/[0.15] transition-colors"
              >
                {isGeneratingVoiceover ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Regenerate Script
              </Button>
              <Button
                disabled={isGeneratingAudio || !voiceoverScript.trim()}
                onClick={async () => {
                  // Generate audio from the current script
                  setIsGeneratingAudio(true);
                  try {
                    const response = await fetch(`/api/ambient-visual/videos/${videoId}/voiceover/generate-audio`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ script: voiceoverScript }),
                    });
                    
                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Failed to generate voiceover audio');
                    }
                    
                    const data = await response.json();
                    setVoiceoverAudioUrl(data.audioUrl);
                    // Notify parent that voiceover was generated
                    onVoiceoverGenerated?.(data.audioUrl);
                    toast({
                      title: "Voiceover Audio Generated",
                      description: `Duration: ${Math.floor(data.duration / 60)}min ${Math.round(data.duration % 60)}s`,
                    });
                  } catch (error) {
                    console.error('[SoundscapeTab] Failed to generate audio:', error);
                    toast({
                      title: "Audio Generation Failed",
                      description: error instanceof Error ? error.message : "Failed to generate voiceover audio",
                      variant: "destructive",
                    });
                  } finally {
                    setIsGeneratingAudio(false);
                  }
                }}
                className="flex-1 h-11 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-medium shadow-lg shadow-cyan-500/20"
              >
                {isGeneratingAudio ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Audio...
                  </>
                ) : voiceoverAudioUrl ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Audio
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Create Voiceover
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Background Music Player Dialog */}
      <Dialog open={showMusicPlayer} onOpenChange={setShowMusicPlayer}>
        <DialogContent className="sm:max-w-[500px] bg-[#0a0a0a] border-white/[0.08] p-0 gap-0 overflow-hidden">
          {/* Header with gradient background */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-purple-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <Music className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Background Music</DialogTitle>
                <p className="text-sm text-white/50 mt-0.5">
                  {musicStyle ? `Style: ${musicStyle.charAt(0).toUpperCase() + musicStyle.slice(1)}` : 'AI Generated Music'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-6 pb-6 space-y-5">
            {/* Music Info */}
            {generatedMusicDuration && (
              <div className="flex items-center gap-4 text-sm text-white/60">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>Duration: {Math.floor(generatedMusicDuration / 60)}min {generatedMusicDuration % 60}s</span>
                </div>
              </div>
            )}

            {/* Audio Player Section */}
            <div className="space-y-3">
              <Label className="text-sm text-white/70 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                Audio Preview
              </Label>
              {generatedMusicUrl ? (
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20">
                  <audio 
                    controls 
                    src={generatedMusicUrl} 
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="relative p-8 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.08] text-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-pink-500/[0.02]"></div>
                  <div className="relative">
                    <div className="inline-flex p-3 rounded-full bg-white/[0.03] mb-3">
                      <Music className="h-6 w-6 text-white/20" />
                    </div>
                    <p className="text-sm text-white/40">
                      No music generated yet
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3 border-t border-white/[0.06]">
              <Button
                variant="outline"
                onClick={() => setShowMusicPlayer(false)}
                className="flex-1 h-11 border-white/[0.1] hover:bg-white/[0.03] hover:border-white/[0.15] transition-colors"
              >
                Close
              </Button>
              <Button
                disabled={isGeneratingMusic}
                onClick={async () => {
                  // Regenerate music via API
                  setIsGeneratingMusic(true);
                  try {
                    const response = await fetch(`/api/ambient-visual/videos/${videoId}/music/generate`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                    });
                    
                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || error.details || 'Failed to regenerate music');
                    }
                    
                    const data = await response.json();
                    setGeneratedMusicUrl(data.musicUrl);
                    setGeneratedMusicDuration(data.duration);
                    
                    // Notify parent
                    if (onMusicGenerated) {
                      onMusicGenerated(data.musicUrl, data.duration);
                    }
                    
                    toast({
                      title: "Music Regenerated",
                      description: `Duration: ${Math.floor(data.duration / 60)}min ${data.duration % 60}s`,
                    });
                  } catch (error) {
                    console.error('[SoundscapeTab] Failed to regenerate music:', error);
                    toast({
                      title: "Regeneration Failed",
                      description: error instanceof Error ? error.message : "Failed to regenerate music",
                      variant: "destructive",
                    });
                  } finally {
                    setIsGeneratingMusic(false);
                  }
                }}
                className="flex-1 h-11 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium shadow-lg shadow-purple-500/20"
              >
                {isGeneratingMusic ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Music
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

