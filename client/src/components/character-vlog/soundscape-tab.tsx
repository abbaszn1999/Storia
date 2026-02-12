/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - SOUNDSCAPE TAB (Step 5)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Sound and voiceover management for character vlog videos.
 * Includes voiceover, sound effects, and background music.
 * Adapted from ambient mode but without looping features.
 */

import { useState, useEffect, useRef, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Volume2, 
  Music, 
  Play,
  Pause,
  Mic,
  Sparkles,
  ArrowRight,
  Loader2,
  RefreshCw,
  Eye,
  Clock,
  User,
  Check,
  ChevronDown,
  Wand2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VOICE_LIBRARY } from "@/constants/voice-library";

// Sound effect data structure
interface ShotSoundEffect {
  prompt?: string;
  audioUrl?: string;
  duration?: number;
  isGenerating?: boolean;
}

// Scene and Shot types (aligned with character vlog structure)
interface VlogScene {
  id: string;
  title?: string;
  name?: string;
  description?: string | null;
  duration?: number | null;
  sceneNumber?: number;
}

interface VlogShot {
  id: string;
  sceneId: string;
  shotNumber?: number;
  duration: number;
  description?: string | null;
  shotType?: string;
  cameraShot?: string;
}

interface ShotVersion {
  id: string;
  shotId: string;
  imageUrl?: string | null;
  startFrameUrl?: string | null;
  endFrameUrl?: string | null;
  videoUrl?: string | null;
  videoDuration?: number;
  actualDuration?: number;
}

// Voice type
interface Voice {
  id: string;
  name: string;
  gender: string;
  style: string;
}

// Language options
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic (العربية)" },
];

// Music style options
const MUSIC_STYLES = [
  { value: 'cinematic', label: 'Cinematic', description: 'Epic orchestral score' },
  { value: 'upbeat', label: 'Upbeat', description: 'Energetic and positive' },
  { value: 'calm', label: 'Calm', description: 'Gentle and soothing' },
  { value: 'dramatic', label: 'Dramatic', description: 'Intense and powerful' },
  { value: 'mysterious', label: 'Mysterious', description: 'Atmospheric and enigmatic' },
  { value: 'epic', label: 'Epic', description: 'Grand and heroic' },
  { value: 'romantic', label: 'Romantic', description: 'Tender and emotional' },
  { value: 'suspenseful', label: 'Suspenseful', description: 'Tension building' },
  { value: 'inspirational', label: 'Inspirational', description: 'Uplifting and hopeful' },
  { value: 'melancholic', label: 'Melancholic', description: 'Bittersweet and reflective' },
] as const;

interface SoundscapeTabProps {
  videoId: string;
  scenes: VlogScene[];
  shots: { [sceneId: string]: VlogShot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  // Voiceover settings from Step 1
  voiceoverEnabled: boolean;
  voiceoverLanguage: 'en' | 'ar';
  // Voiceover data from Step 5
  voiceoverScript?: string;
  voiceoverAudioUrl?: string;
  voiceoverDuration?: number;
  selectedVoiceId?: string;
  // Sound Effects data from Step 5
  soundEffects?: Record<string, ShotSoundEffect>;
  // Background Music settings
  backgroundMusicEnabled?: boolean;
  generatedMusicUrl?: string;
  generatedMusicDuration?: number;
  // Callbacks
  onVoiceoverScriptChange?: (script: string) => void;
  onVoiceoverAudioGenerated?: (audioUrl: string, duration: number) => void;
  onMusicGenerated?: (musicUrl: string, duration: number) => void;
  onVoiceChange?: (voiceId: string) => void;
  onSoundEffectsUpdate?: (soundEffects: Record<string, ShotSoundEffect>) => void;
}

// Shot card component for preview with sound effects
function ShotPreviewCard({
  shot,
  shotIndex,
  version,
  videoId,
  sceneId,
  soundEffect,
  onSoundEffectUpdate,
}: {
  shot: VlogShot;
  shotIndex: number;
  version: ShotVersion | null;
  videoId: string;
  sceneId: string;
  soundEffect?: ShotSoundEffect;
  onSoundEffectUpdate: (shotId: string, updates: Partial<ShotSoundEffect>) => void;
}) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isRecommendingSfx, setIsRecommendingSfx] = useState(false);
  const [isGeneratingSfx, setIsGeneratingSfx] = useState(soundEffect?.isGenerating || false);
  const [localPrompt, setLocalPrompt] = useState(soundEffect?.prompt || '');

  // Check for image or video
  const hasImage = version?.imageUrl || version?.startFrameUrl;
  const hasVideo = version?.videoUrl;
  const previewUrl = version?.imageUrl || version?.startFrameUrl || '';
  const hasSoundEffect = soundEffect?.audioUrl && typeof soundEffect.audioUrl === 'string' && soundEffect.audioUrl.trim().length > 0;

  // Sync local prompt with prop
  useEffect(() => {
    setLocalPrompt(soundEffect?.prompt || '');
  }, [soundEffect?.prompt]);

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

    const handleEnded = () => {
      audio.currentTime = 0;
      if (!video.paused) {
        audio.play().catch(console.error);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [hasSoundEffect]);

  // Handle recommending a sound effect prompt
  const handleRecommend = async () => {
    setIsRecommendingSfx(true);
    try {
      const response = await fetch(`/api/character-vlog/videos/${videoId}/sound-effects/${shot.id}/generate-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get recommendation');
      }
      
      const data = await response.json();
      setLocalPrompt(data.prompt);
      onSoundEffectUpdate(shot.id, { prompt: data.prompt });
      toast({
        title: "Sound effect recommended",
        description: "AI-generated sound effect description added",
      });
    } catch (error) {
      console.error('[ShotPreviewCard] Failed to get recommendation:', error);
      toast({
        title: "Recommendation failed",
        description: error instanceof Error ? error.message : "Failed to get sound effect recommendation",
        variant: "destructive",
      });
    } finally {
      setIsRecommendingSfx(false);
    }
  };

  // Handle generating sound effect audio
  const handleGenerateSfx = async () => {
    if (!hasVideo) {
      toast({
        title: "No video available",
        description: "Generate video for this shot first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSfx(true);
    onSoundEffectUpdate(shot.id, { isGenerating: true });
    
    try {
      const prompt = localPrompt?.trim() || "Generate ambient sound effects for this video scene";
      
      const response = await fetch(`/api/character-vlog/videos/${videoId}/sound-effects/${shot.id}/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate sound effect');
      }
      
      const data = await response.json();
      onSoundEffectUpdate(shot.id, { 
        prompt,
        audioUrl: data.audioUrl,
        duration: data.duration,
        isGenerating: false,
      });
      toast({
        title: hasSoundEffect ? "Sound effect regenerated" : "Sound effect generated",
        description: `Duration: ${Math.round(data.duration)}s`,
      });
    } catch (error) {
      console.error('[ShotPreviewCard] Failed to generate sound effect:', error);
      onSoundEffectUpdate(shot.id, { isGenerating: false });
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate sound effect",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSfx(false);
    }
  };

  return (
    <Card className="shrink-0 w-80 overflow-visible bg-white/[0.02] border-white/[0.06]">
      {/* Preview */}
      <div className="aspect-video bg-black/30 relative group rounded-t-lg overflow-hidden">
        {hasVideo ? (
          <>
            <video
              ref={videoRef}
              src={version?.videoUrl || ''}
              className="w-full h-full object-cover"
              controls
              muted
              loop
              playsInline
            />
            {hasSoundEffect && (
              <audio
                ref={audioRef}
                src={soundEffect?.audioUrl || ''}
                loop
                preload="auto"
                className="hidden"
              />
            )}
          </>
        ) : hasImage ? (
          <img
            src={previewUrl}
            alt={`Shot ${shot.shotNumber || shotIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 gap-2">
            <Play className="h-8 w-8 text-white/30" />
            <p className="text-xs text-white/50">No media</p>
          </div>
        )}
        
        {/* Shot badge */}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <Badge variant="outline" className="bg-gradient-to-r from-[#FF4081]/20 to-[#FF6B4A]/20 text-[#FF4081] border-[#FF4081]/50">
            # {shot.shotNumber || shotIndex + 1}
          </Badge>
          <Badge variant="outline" className="bg-black/60 backdrop-blur-sm text-white/70 border-white/20">
            {version?.actualDuration || version?.videoDuration || shot.duration}s
          </Badge>
        </div>
      </div>

      {/* SFX Play Indicator */}
      {hasVideo && hasSoundEffect && (
        <div className="px-4 pt-2 flex items-center gap-2 text-xs text-teal-400">
          <Music className="h-3.5 w-3.5" />
          <span>SFX will play with video</span>
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Shot Description */}
        <p className="text-xs text-white/60 line-clamp-2">
          {shot.description || `Shot ${shot.shotNumber || shotIndex + 1}`}
        </p>

        {/* Sound Effects Section */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          {/* Header with Recommend Button */}
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
              onClick={handleRecommend}
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
            placeholder="Describe sound effects (e.g., room ambience, typing sounds, birds)..."
            className="min-h-[60px] text-xs bg-white/5 border-white/10 resize-none"
            value={localPrompt}
            onChange={(e) => {
              setLocalPrompt(e.target.value);
              onSoundEffectUpdate(shot.id, { prompt: e.target.value });
            }}
          />
          
          {/* Generate/Regenerate SFX Button */}
          <Button
            size="sm"
            variant="ghost"
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white disabled:opacity-50"
            disabled={isGeneratingSfx || !hasVideo}
            onClick={handleGenerateSfx}
          >
            {isGeneratingSfx ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                {hasSoundEffect ? "Regenerating..." : "Generating..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-3 w-3" />
                {hasSoundEffect ? "Regenerate SFX" : "Generate SFX"}
              </>
            )}
          </Button>
          
          {/* SFX Uploaded Indicator */}
          {hasSoundEffect && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-teal-500/10 border border-teal-500/20">
              <Music className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-xs text-teal-300 truncate flex-1">SFX ready</span>
              {soundEffect?.duration && (
                <span className="text-xs text-teal-400/70">{Math.round(soundEffect.duration)}s</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Scene row component
function SceneRow({
  scene,
  sceneIndex,
  sceneShots,
  shotVersions,
  videoId,
  soundEffects,
  getShotVersion,
  onSoundEffectUpdate,
}: {
  scene: VlogScene;
  sceneIndex: number;
  sceneShots: VlogShot[];
  shotVersions: { [shotId: string]: ShotVersion[] };
  videoId: string;
  soundEffects: Record<string, ShotSoundEffect>;
  getShotVersion: (shot: VlogShot) => ShotVersion | null;
  onSoundEffectUpdate: (shotId: string, updates: Partial<ShotSoundEffect>) => void;
}) {
  // Calculate scene duration using version durations when available
  const sceneDuration = sceneShots.reduce((total, shot) => {
    const version = getShotVersion(shot);
    const effectiveDuration = version?.actualDuration || version?.videoDuration || shot.duration;
    return total + effectiveDuration;
  }, 0);
  
  // Count shots with sound effects in this scene
  const shotsWithSfx = sceneShots.filter(shot => soundEffects[shot.id]?.audioUrl).length;

  return (
    <Card className="bg-white/[0.02] border-white/[0.06]">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Left Sidebar - Scene Info */}
          <div className="w-56 shrink-0 space-y-3">
            {/* Scene Header */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gradient-to-r from-[#FF4081]/20 to-[#FF6B4A]/20 text-[#FF4081] border-[#FF4081]/50 text-xs px-2">
                # {sceneIndex + 1}
              </Badge>
              <span className="text-sm font-medium text-white truncate">
                {scene.title || scene.name || `Scene ${sceneIndex + 1}`}
              </span>
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
                <span className="text-white/70">{sceneDuration}s</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Sound FX</span>
                <span className={shotsWithSfx > 0 ? "text-teal-400" : "text-white/70"}>
                  {shotsWithSfx}/{sceneShots.length}
                </span>
              </div>
            </div>
          </div>

          {/* Shot Cards - Horizontal Scroll */}
          <div className="flex-1 overflow-x-auto scrollbar-thin">
            <div className="flex items-start gap-0 pb-2">
              {sceneShots.map((shot, shotIndex) => {
                const version = getShotVersion(shot);
                const isLastShot = shotIndex === sceneShots.length - 1;
                
                return (
                  <Fragment key={shot.id}>
                    <ShotPreviewCard
                      shot={shot}
                      shotIndex={shotIndex}
                      version={version}
                      videoId={videoId}
                      sceneId={scene.id}
                      soundEffect={soundEffects[shot.id]}
                      onSoundEffectUpdate={onSoundEffectUpdate}
                    />
                    
                    {/* Transition indicator between shots */}
                    {!isLastShot && (
                      <div className="shrink-0 flex items-center self-center mx-2 h-[220px]">
                        <div className="flex flex-col items-center justify-center w-8 gap-0.5 py-1 rounded-md bg-white/5 border border-dashed border-white/10">
                          <ArrowRight className="h-3 w-3 text-white/60" />
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
  scenes,
  shots,
  shotVersions,
  voiceoverEnabled = false,
  voiceoverLanguage: initialVoiceoverLanguage = 'en',
  voiceoverScript: initialVoiceoverScript = '',
  voiceoverAudioUrl: initialVoiceoverAudioUrl,
  voiceoverDuration: initialVoiceoverDuration,
  selectedVoiceId: initialSelectedVoiceId,
  soundEffects: initialSoundEffects = {},
  backgroundMusicEnabled = false,
  generatedMusicUrl: initialGeneratedMusicUrl,
  generatedMusicDuration: initialGeneratedMusicDuration,
  onVoiceoverScriptChange,
  onVoiceoverAudioGenerated,
  onMusicGenerated,
  onVoiceChange,
  onSoundEffectsUpdate,
}: SoundscapeTabProps) {
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Voiceover state
  const [voiceoverScript, setVoiceoverScript] = useState<string>(initialVoiceoverScript);
  const [voiceoverAudioUrl, setVoiceoverAudioUrl] = useState<string | null>(initialVoiceoverAudioUrl || null);
  const [voiceoverDuration, setVoiceoverDuration] = useState<number | null>(initialVoiceoverDuration || null);
  const [isVoiceoverGenerated, setIsVoiceoverGenerated] = useState(!!initialVoiceoverScript);
  const [showVoiceoverModal, setShowVoiceoverModal] = useState(false);
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  // Voice selection - using VOICE_LIBRARY instead of API
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(initialSelectedVoiceId || null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const voicePreviewAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Voiceover language state - use prop as initial value
  const [voiceoverLanguage, setVoiceoverLanguage] = useState<'en' | 'ar'>(initialVoiceoverLanguage);

  // Sound Effects state
  const [soundEffects, setSoundEffects] = useState<Record<string, ShotSoundEffect>>(initialSoundEffects);

  // Background Music state
  const [musicStyle, setMusicStyle] = useState<string>('cinematic');
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(initialGeneratedMusicUrl || null);
  const [generatedMusicDuration, setGeneratedMusicDuration] = useState<number | null>(initialGeneratedMusicDuration || null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);

  // Sync sound effects with props
  useEffect(() => {
    if (initialSoundEffects && Object.keys(initialSoundEffects).length > 0) {
      setSoundEffects(initialSoundEffects);
    }
  }, [initialSoundEffects]);

  // Handle sound effect updates
  const handleSoundEffectUpdate = (shotId: string, updates: Partial<ShotSoundEffect>) => {
    setSoundEffects(prev => {
      const updated = {
        ...prev,
        [shotId]: {
          ...(prev[shotId] || {}),
          ...updates,
        },
      };
      // Notify parent of changes (for saving to backend)
      onSoundEffectsUpdate?.(updated);
      return updated;
    });
  };

  // Calculate total video duration using version durations when available (no loops in character vlog)
  const calculateTotalVideoDuration = () => {
    let total = 0;
    for (const scene of scenes) {
      const sceneShots = shots[scene.id] || [];
      for (const shot of sceneShots) {
        // Use version's actual/video duration if available, fallback to shot.duration
        const versions = shotVersions[shot.id];
        const latestVersion = versions && versions.length > 0 ? versions[versions.length - 1] : null;
        const effectiveDuration = latestVersion?.actualDuration || latestVersion?.videoDuration || shot.duration;
        total += effectiveDuration;
      }
    }
    return total;
  };

  const totalVideoDuration = calculateTotalVideoDuration();

  // Format duration as minutes:seconds
  const formatDuration = (seconds: number) => {
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

  // Sync with props when they change
  useEffect(() => {
    if (initialVoiceoverScript && initialVoiceoverScript.trim().length > 0) {
      setVoiceoverScript(initialVoiceoverScript);
      setIsVoiceoverGenerated(true);
    }
    if (initialVoiceoverAudioUrl) {
      setVoiceoverAudioUrl(initialVoiceoverAudioUrl);
    }
    if (initialVoiceoverDuration) {
      setVoiceoverDuration(initialVoiceoverDuration);
    }
    if (initialSelectedVoiceId) {
      setSelectedVoiceId(initialSelectedVoiceId);
    }
  }, [initialVoiceoverScript, initialVoiceoverAudioUrl, initialVoiceoverDuration, initialSelectedVoiceId]);

  // Sync music props
  useEffect(() => {
    if (initialGeneratedMusicUrl) {
      setGeneratedMusicUrl(initialGeneratedMusicUrl);
    }
    if (initialGeneratedMusicDuration) {
      setGeneratedMusicDuration(initialGeneratedMusicDuration);
    }
  }, [initialGeneratedMusicUrl, initialGeneratedMusicDuration]);

  // Voice preview - with proper pause support
  const handlePlayVoice = (voiceIdToPlay: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If clicking the same voice that's playing, pause it
    if (playingVoice === voiceIdToPlay) {
      if (voicePreviewAudioRef.current) {
        voicePreviewAudioRef.current.pause();
        voicePreviewAudioRef.current = null;
      }
      setPlayingVoice(null);
      return;
    }
    
    // Stop any currently playing audio
    if (voicePreviewAudioRef.current) {
      voicePreviewAudioRef.current.pause();
      voicePreviewAudioRef.current = null;
    }
    
    // Find and play the new voice
    const voice = VOICE_LIBRARY.find(v => v.id === voiceIdToPlay);
    if (voice?.previewUrl) {
      const audio = new Audio(voice.previewUrl);
      voicePreviewAudioRef.current = audio;
      setPlayingVoice(voiceIdToPlay);
      
      audio.play().catch(() => {
        setPlayingVoice(null);
        voicePreviewAudioRef.current = null;
      });
      
      audio.onended = () => {
        setPlayingVoice(null);
        voicePreviewAudioRef.current = null;
      };
    }
  };
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (voicePreviewAudioRef.current) {
        voicePreviewAudioRef.current.pause();
        voicePreviewAudioRef.current = null;
      }
    };
  }, []);

  // Get total counts
  const allShots = Object.values(shots).flat();
  const totalShots = allShots.length;
  const shotsWithMedia = allShots.filter(s => {
    const v = shotVersions[s.id]?.[shotVersions[s.id]?.length - 1];
    return v?.videoUrl || v?.imageUrl || v?.startFrameUrl;
  }).length;

  // Track scroll position for header blur effect
  useEffect(() => {
    const handleScroll = () => {
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
  const getShotVersion = (shot: VlogShot): ShotVersion | null => {
    const versions = shotVersions[shot.id];
    if (!versions || versions.length === 0) return null;
    return versions[versions.length - 1];
  };

  // Handle voice selection
  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    onVoiceChange?.(voiceId);
    setVoiceDropdownOpen(false);
    
    // Save voice selection to backend
    fetch(`/api/character-vlog/videos/${videoId}/voiceover/voice`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ voiceId }),
    }).catch(error => {
      console.error('Failed to save voice selection:', error);
    });
  };

  // Get selected voice from VOICE_LIBRARY
  const selectedVoice = VOICE_LIBRARY.find(v => v.id === selectedVoiceId);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Sound & Voiceover</h2>
        <p className="text-muted-foreground">
          Add voiceover narration and background music to your video
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
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF4081]/20 to-[#FF6B4A]/20">
                  <Volume2 className="h-5 w-5 text-[#FF4081]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Soundscape</h3>
                  <p className="text-sm text-muted-foreground">
                    {shotsWithMedia} of {totalShots} shots have media
                  </p>
                </div>
              </div>
              
              {/* Total Video Duration */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <Clock className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-white/80">
                  Total: {formatDuration(totalVideoDuration)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Generate/View Voiceover Button - Only shown if voiceover is enabled */}
              {voiceoverEnabled && (
                <Button
                  onClick={() => setShowVoiceoverModal(true)}
                  variant="outline"
                  className={voiceoverAudioUrl 
                    ? "border-green-500/50 text-green-400" 
                    : "border-white/20"
                  }
                >
                  {voiceoverAudioUrl ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      View Voiceover
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Setup Voiceover
                    </>
                  )}
                </Button>
              )}

              {/* Background Music Button - Only shown if music enabled */}
              {backgroundMusicEnabled && (
                <Button
                  onClick={() => setShowMusicModal(true)}
                  variant="outline"
                  className={generatedMusicUrl 
                    ? "border-green-500/50 text-green-400" 
                    : "border-white/20"
                  }
                >
                  {generatedMusicUrl ? (
                    <>
                      <Music className="mr-2 h-4 w-4" />
                      View Music
                    </>
                  ) : (
                    <>
                      <Music className="mr-2 h-4 w-4" />
                      Add Music
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenes and Shots */}
      <div className="space-y-6">
        {scenes.map((scene, sceneIndex) => (
          <SceneRow
            key={scene.id}
            scene={scene}
            sceneIndex={sceneIndex}
            sceneShots={shots[scene.id] || []}
            shotVersions={shotVersions}
            videoId={videoId}
            soundEffects={soundEffects}
            getShotVersion={getShotVersion}
            onSoundEffectUpdate={handleSoundEffectUpdate}
          />
        ))}
      </div>

      {/* Empty State - No Scenes */}
      {scenes.length === 0 && (
        <Card className="border-dashed border-2 border-white/10 bg-white/[0.02]">
          <CardContent className="py-16 px-8">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-[#FF4081]/20 to-[#FF6B4A]/20">
                <Volume2 className="h-8 w-8 text-[#FF4081]" />
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
        <DialogContent className="sm:max-w-[600px] bg-[#0a0a0a] border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-[#FF4081]" />
              Voiceover Settings
            </DialogTitle>
            <DialogDescription>
              Generate a narration script and voice audio for your video
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Language Selector */}
            <div className="space-y-2">
              <Label className="text-sm">Language</Label>
              <Select
                value={voiceoverLanguage}
                onValueChange={(value: 'en' | 'ar') => {
                  setVoiceoverLanguage(value);
                  // Reset voice selection if current voice doesn't match new language
                  if (selectedVoiceId) {
                    const currentVoice = VOICE_LIBRARY.find(v => v.id === selectedVoiceId);
                    if (currentVoice && currentVoice.language !== value) {
                      // Auto-select first voice of the new language
                      const firstVoice = VOICE_LIBRARY.find(v => v.language === value);
                      if (firstVoice) {
                        setSelectedVoiceId(firstVoice.id);
                        onVoiceChange?.(firstVoice.id);
                      } else {
                        setSelectedVoiceId(null);
                      }
                    }
                  }
                }}
              >
                <SelectTrigger className="bg-white/[0.02] border-white/[0.06]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Selector */}
            <div className="space-y-2">
              <Label className="text-sm">Voice Actor ({VOICE_LIBRARY.filter(v => v.language === voiceoverLanguage).length} voices available)</Label>
              <Popover open={voiceDropdownOpen} onOpenChange={setVoiceDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-white/[0.02] border-white/[0.06]"
                  >
                    <div className="flex flex-col items-start">
                      <span className={selectedVoiceId ? "font-medium" : "text-muted-foreground"}>
                        {selectedVoice?.name || "Select voice actor"}
                      </span>
                      {selectedVoice && (
                        <span className="text-xs text-white/50">{selectedVoice.description}</span>
                      )}
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0" align="start">
                  {/* Header showing filtered count */}
                  <div className="px-3 py-2 border-b border-white/10 bg-white/[0.02]">
                    <p className="text-xs text-white/60">
                      {VOICE_LIBRARY.filter(v => v.language === voiceoverLanguage).length} {voiceoverLanguage === 'en' ? 'English' : 'Arabic'} voices available • Scroll to see all
                    </p>
                  </div>
                  <div 
                    className="h-[450px] overflow-y-auto overflow-x-hidden"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
                  >
                    <div className="p-1">
                      {VOICE_LIBRARY.filter(v => v.language === voiceoverLanguage).map((voice) => (
                        <div
                          key={voice.id}
                          className={`flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-md cursor-pointer ${selectedVoiceId === voice.id ? 'bg-[#FF4081]/10 border border-[#FF4081]/30' : ''}`}
                          onClick={() => handleVoiceChange(voice.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {selectedVoiceId === voice.id && (
                                <Check className="h-3.5 w-3.5 text-[#FF4081] shrink-0" />
                              )}
                              <span className={`text-sm ${selectedVoiceId === voice.id ? "font-medium text-[#FF4081]" : ""}`}>
                                {voice.name}
                              </span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-white/5 border-white/20">
                                {voice.gender === 'male' ? '♂' : voice.gender === 'female' ? '♀' : '◎'}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-purple-500/10 border-purple-500/30 text-purple-300">
                                {voice.style}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-white/40 mt-0.5 truncate">{voice.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 shrink-0 ${playingVoice === voice.id ? 'text-[#FF4081] bg-[#FF4081]/20' : ''}`}
                            onClick={(e) => handlePlayVoice(voice.id, e)}
                          >
                            {playingVoice === voice.id ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Script Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Voiceover Script</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setIsGeneratingVoiceover(true);
                    try {
                      const response = await fetch(`/api/character-vlog/videos/${videoId}/voiceover/generate-script`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ language: voiceoverLanguage }),
                      });
                      
                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Failed to generate script');
                      }
                      
                      const data = await response.json();
                      setVoiceoverScript(data.script);
                      setIsVoiceoverGenerated(true);
                      onVoiceoverScriptChange?.(data.script);
                      toast({
                        title: "Script Generated",
                        description: "Voiceover script has been created. You can edit it before generating audio.",
                      });
                    } catch (error) {
                      console.error('[SoundscapeTab] Failed to generate voiceover:', error);
                      toast({
                        title: "Generation Failed",
                        description: error instanceof Error ? error.message : "Failed to generate script",
                        variant: "destructive",
                      });
                    } finally {
                      setIsGeneratingVoiceover(false);
                    }
                  }}
                  disabled={isGeneratingVoiceover}
                  className="gap-1"
                >
                  {isGeneratingVoiceover ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  {voiceoverScript ? "Regenerate" : "Generate"} Script
                </Button>
              </div>
              <Textarea
                value={voiceoverScript}
                onChange={(e) => {
                  setVoiceoverScript(e.target.value);
                  onVoiceoverScriptChange?.(e.target.value);
                }}
                placeholder="Enter or generate your voiceover script..."
                className="min-h-[200px] bg-white/[0.02] border-white/[0.06]"
              />
            </div>

            {/* Generate Audio Button */}
            <Button
              onClick={async () => {
                setIsGeneratingAudio(true);
                try {
                  const response = await fetch(`/api/character-vlog/videos/${videoId}/voiceover/generate-audio`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ 
                      script: voiceoverScript,
                      voiceId: selectedVoiceId,
                      language: voiceoverLanguage,
                    }),
                  });
                  
                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to generate audio');
                  }
                  
                  const data = await response.json();
                  setVoiceoverAudioUrl(data.audioUrl);
                  setVoiceoverDuration(data.duration);
                  onVoiceoverAudioGenerated?.(data.audioUrl, data.duration);
                  toast({
                    title: "Audio Generated",
                    description: `Voiceover audio (${formatDuration(data.duration)}) has been created.`,
                  });
                } catch (error) {
                  console.error('[SoundscapeTab] Failed to generate audio:', error);
                  toast({
                    title: "Generation Failed",
                    description: error instanceof Error ? error.message : "Failed to generate audio",
                    variant: "destructive",
                  });
                } finally {
                  setIsGeneratingAudio(false);
                }
              }}
              disabled={!selectedVoiceId || !voiceoverScript.trim() || isGeneratingAudio}
              className="w-full bg-gradient-to-r from-[#FF4081] to-[#FF6B4A] hover:from-[#FF4081]/90 hover:to-[#FF6B4A]/90"
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
                  Generate Audio
                </>
              )}
            </Button>

            {/* Audio Preview */}
            {voiceoverAudioUrl && (
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <Label className="text-xs text-white/50 mb-2 block">Generated Voiceover</Label>
                <audio
                  src={voiceoverAudioUrl}
                  controls
                  className="w-full h-10"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Music Modal */}
      <Dialog open={showMusicModal} onOpenChange={setShowMusicModal}>
        <DialogContent className="sm:max-w-[500px] bg-[#0a0a0a] border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-purple-400" />
              Background Music
            </DialogTitle>
            <DialogDescription>
              Generate AI background music for your video
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Music Style */}
            <div className="space-y-2">
              <Label className="text-sm">Music Style</Label>
              <Select
                value={musicStyle}
                onValueChange={(value) => setMusicStyle(value)}
              >
                <SelectTrigger className="bg-white/[0.02] border-white/[0.06]">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {MUSIC_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div className="flex flex-col">
                        <span>{style.label}</span>
                        <span className="text-xs text-white/50">{style.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Music Button */}
            <Button
              onClick={async () => {
                setIsGeneratingMusic(true);
                try {
                  const response = await fetch(`/api/character-vlog/videos/${videoId}/music/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ musicStyle }),
                  });
                  
                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || error.details || 'Failed to generate music');
                  }
                  
                  const data = await response.json();
                  setGeneratedMusicUrl(data.musicUrl);
                  setGeneratedMusicDuration(data.duration);
                  onMusicGenerated?.(data.musicUrl, data.duration);
                  
                  toast({
                    title: "Music Generated",
                    description: `Background music (${formatDuration(data.duration)}) has been created.`,
                  });
                } catch (error) {
                  console.error('[SoundscapeTab] Failed to generate music:', error);
                  toast({
                    title: "Generation Failed",
                    description: error instanceof Error ? error.message : "Failed to generate music",
                    variant: "destructive",
                  });
                } finally {
                  setIsGeneratingMusic(false);
                }
              }}
              disabled={isGeneratingMusic}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isGeneratingMusic ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Music...
                </>
              ) : generatedMusicUrl ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Music
                </>
              ) : (
                <>
                  <Music className="mr-2 h-4 w-4" />
                  Generate Music
                </>
              )}
            </Button>

            {/* Music Preview */}
            {generatedMusicUrl && (
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-white/50">Generated Music</Label>
                  <Badge variant="outline" className="text-xs">
                    {generatedMusicDuration ? formatDuration(generatedMusicDuration) : ''}
                  </Badge>
                </div>
                <audio
                  src={generatedMusicUrl}
                  controls
                  className="w-full h-10"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
