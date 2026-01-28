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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Volume2, 
  Music, 
  Play,
  Mic,
  Sparkles,
  ArrowRight,
  Loader2,
  RefreshCw,
  Eye,
  Clock,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

// Voice type
interface Voice {
  id: string;
  name: string;
  gender: string;
  style: string;
}

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
            {shot.duration}s
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
  // Calculate scene duration
  const sceneDuration = sceneShots.reduce((total, shot) => total + shot.duration, 0);
  
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
  voiceoverLanguage = 'en',
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
  
  // Voice selection
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(initialSelectedVoiceId || null);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  // Sound Effects state
  const [soundEffects, setSoundEffects] = useState<Record<string, ShotSoundEffect>>(initialSoundEffects);

  // Background Music state
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(initialGeneratedMusicUrl || null);
  const [generatedMusicDuration, setGeneratedMusicDuration] = useState<number | null>(initialGeneratedMusicDuration || null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);

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

  // Calculate total video duration (no loops in character vlog)
  const calculateTotalVideoDuration = () => {
    let total = 0;
    for (const scene of scenes) {
      const sceneShots = shots[scene.id] || [];
      for (const shot of sceneShots) {
        total += shot.duration;
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

  // Load available voices
  useEffect(() => {
    const loadVoices = async () => {
      setIsLoadingVoices(true);
      try {
        const response = await fetch(`/api/character-vlog/voices?language=${voiceoverLanguage}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setVoices(data.voices || []);
          // Set default voice if none selected
          if (!selectedVoiceId && data.voices?.length > 0) {
            setSelectedVoiceId(data.voices[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load voices:', error);
      } finally {
        setIsLoadingVoices(false);
      }
    };
    
    if (voiceoverEnabled) {
      loadVoices();
    }
  }, [voiceoverLanguage, voiceoverEnabled]);

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
                  disabled={isGeneratingVoiceover}
                  onClick={async () => {
                    if (isVoiceoverGenerated) {
                      // Open modal to view voiceover
                      setShowVoiceoverModal(true);
                    } else {
                      // Generate voiceover script via API
                      setIsGeneratingVoiceover(true);
                      try {
                        const response = await fetch(`/api/character-vlog/videos/${videoId}/voiceover/generate-script`, {
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
                        onVoiceoverScriptChange?.(data.script);
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
                  className="bg-gradient-to-r from-[#FF4081] to-[#FF6B4A] hover:from-[#FF4081]/90 hover:to-[#FF6B4A]/90 text-white disabled:opacity-50"
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

              {/* Background Music Button - Only shown if music enabled */}
              {backgroundMusicEnabled && (
                <Button
                  disabled={isGeneratingMusic}
                  onClick={async () => {
                    if (generatedMusicUrl) {
                      // Show music player
                      setShowMusicPlayer(true);
                    } else {
                      // Generate music via API
                      setIsGeneratingMusic(true);
                      try {
                        const response = await fetch(`/api/character-vlog/videos/${videoId}/music/generate`, {
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
                        onMusicGenerated?.(data.musicUrl, data.duration);
                        
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
                      Generate Music
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
        <DialogContent className="sm:max-w-[700px] bg-[#0a0a0a] border-white/[0.08] p-0 gap-0 overflow-hidden">
          {/* Header with gradient background */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-[#FF4081]/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#FF4081]/20 to-[#FF6B4A]/20 border border-[#FF4081]/30">
                <Mic className="h-6 w-6 text-[#FF4081]" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Voiceover Script</DialogTitle>
                <p className="text-sm text-white/50 mt-0.5">Edit and generate audio narration</p>
              </div>
            </div>
          </div>
          
          <div className="px-6 pb-6 space-y-5">
            {/* Voice Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-white/70 font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FF4081]" />
                  Voice
                </Label>
              </div>
              <Select
                value={selectedVoiceId || ''}
                onValueChange={handleVoiceChange}
                disabled={isLoadingVoices}
              >
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                  <SelectValue placeholder={isLoadingVoices ? "Loading voices..." : "Select a voice"} />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex items-center gap-2">
                        <span>{voice.name}</span>
                        <span className="text-xs text-white/50">({voice.gender}, {voice.style})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Script Editor Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-white/70 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4081]"></span>
                  Script
                </Label>
                <span className="text-xs text-white/40">{voiceoverScript.length} characters</span>
              </div>
              <div className="relative">
                <Textarea
                  value={voiceoverScript}
                  onChange={(e) => {
                    setVoiceoverScript(e.target.value);
                    onVoiceoverScriptChange?.(e.target.value);
                  }}
                  placeholder="Your voiceover script will appear here..."
                  className="min-h-[200px] bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] focus:border-[#FF4081]/50 resize-none text-sm transition-colors rounded-xl"
                />
              </div>
            </div>

            {/* Audio Player Section */}
            <div className="space-y-3">
              <Label className="text-sm text-white/70 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B4A]"></span>
                Audio Preview
              </Label>
              {voiceoverAudioUrl ? (
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#FF4081]/5 to-[#FF6B4A]/5 border border-[#FF4081]/20">
                  <audio 
                    controls 
                    src={voiceoverAudioUrl} 
                    className="w-full"
                  />
                  {voiceoverDuration && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
                      <Clock className="w-3 h-3" />
                      <span>Duration: {Math.floor(voiceoverDuration / 60)}m {Math.round(voiceoverDuration % 60)}s</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative p-8 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.08] text-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF4081]/[0.02] to-[#FF6B4A]/[0.02]"></div>
                  <div className="relative">
                    <div className="inline-flex p-3 rounded-full bg-white/[0.03] mb-3">
                      <Volume2 className="h-6 w-6 text-white/20" />
                    </div>
                    <p className="text-sm text-white/40">
                      Audio will be generated from your script
                    </p>
                    <p className="text-xs text-white/25 mt-1">
                      Select a voice and click "Create Voiceover"
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
                    const response = await fetch(`/api/character-vlog/videos/${videoId}/voiceover/generate-script`, {
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
                    setVoiceoverDuration(null);
                    onVoiceoverScriptChange?.(data.script);
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
                disabled={isGeneratingAudio || !voiceoverScript.trim() || !selectedVoiceId}
                onClick={async () => {
                  // Generate audio from the current script
                  setIsGeneratingAudio(true);
                  try {
                    const response = await fetch(`/api/character-vlog/videos/${videoId}/voiceover/generate-audio`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ 
                        script: voiceoverScript,
                        voiceId: selectedVoiceId,
                      }),
                    });
                    
                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Failed to generate voiceover audio');
                    }
                    
                    const data = await response.json();
                    setVoiceoverAudioUrl(data.audioUrl);
                    setVoiceoverDuration(data.duration);
                    onVoiceoverAudioGenerated?.(data.audioUrl, data.duration);
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
                className="flex-1 h-11 bg-gradient-to-r from-[#FF4081] to-[#FF6B4A] hover:from-[#FF4081]/90 hover:to-[#FF6B4A]/90 text-white font-medium shadow-lg shadow-[#FF4081]/20"
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
                <p className="text-sm text-white/50 mt-0.5">AI Generated Music</p>
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
                    const response = await fetch(`/api/character-vlog/videos/${videoId}/music/generate`, {
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
                    onMusicGenerated?.(data.musicUrl, data.duration);
                    
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
