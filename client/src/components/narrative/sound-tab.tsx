/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NARRATIVE MODE - SOUND TAB
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Sound design page for Narrative mode. Handles:
 * - Sound Effects (per shot) with AI recommendation and generation
 * - Voiceover (global) with script generation and audio synthesis
 * - Background Music with AI generation
 */

import { useState, useEffect, useRef, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Volume2, 
  Music, 
  Upload, 
  Play,
  Pause,
  Mic,
  Sparkles,
  X,
  ArrowRight,
  Loader2,
  RefreshCw,
  Eye,
  Clock,
  Check,
  ChevronDown,
  Wand2,
  FileAudio,
  Music2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot, ShotVersion } from "@/types/storyboard";
import { VOICE_LIBRARY } from "@/constants/voice-library";

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

interface NarrativeSoundTabProps {
  videoId: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  // Step 5 data
  step5Data?: {
    shotsWithSFX?: Record<string, {
      soundEffectDescription?: string;
      soundEffectUrl?: string;
    }>;
    voiceId?: string;
    voiceoverEnabled?: boolean;
    voiceoverScript?: string;
    voiceoverAudioUrl?: string;
    voiceoverDuration?: number;
    backgroundMusicEnabled?: boolean;
    musicStyle?: string;
    customMusicUrl?: string;
    generatedMusicUrl?: string;
    generatedMusicDuration?: number;
  };
  // Context
  script?: string;
  characters?: Array<{ id: string; name: string; description?: string }>;
  genre?: string;
  tone?: string;
  language?: 'en' | 'ar';
  // Callbacks
  onUpdateStep5Data: (data: Partial<NonNullable<NarrativeSoundTabProps['step5Data']>>) => void;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
}

// Shot card component for sound effects
function SoundShotCard({
  shot,
  shotIndex,
  version,
  videoId,
  sceneId,
  soundEffectData,
  onUpdateSoundEffect,
}: {
  shot: Shot;
  shotIndex: number;
  version: ShotVersion | null;
  videoId: string;
  sceneId: string;
  soundEffectData?: {
    soundEffectDescription?: string;
    soundEffectUrl?: string;
  };
  onUpdateSoundEffect: (shotId: string, data: { soundEffectDescription?: string; soundEffectUrl?: string }) => void;
}) {
  const { toast } = useToast();
  const [isRecommendingSfx, setIsRecommendingSfx] = useState(false);
  const [isGeneratingSfx, setIsGeneratingSfx] = useState(false);
  const [localDescription, setLocalDescription] = useState(soundEffectData?.soundEffectDescription || '');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const hasVideo = version?.videoUrl && typeof version.videoUrl === 'string' && version.videoUrl.trim().length > 0;
  const hasSoundEffect = soundEffectData?.soundEffectUrl && 
                         typeof soundEffectData.soundEffectUrl === 'string' && 
                         soundEffectData.soundEffectUrl.trim().length > 0;

  // Sync local description with props
  useEffect(() => {
    if (soundEffectData?.soundEffectDescription !== undefined) {
      setLocalDescription(soundEffectData.soundEffectDescription);
    }
  }, [soundEffectData?.soundEffectDescription]);

  // Sync audio playback with video playback (including buffering states)
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio || !hasSoundEffect) return;

    // When user clicks play (may not actually start playing yet due to buffering)
    const handlePlay = () => {
      audio.currentTime = video.currentTime;
      audio.play().catch(console.error);
    };

    // When video actually starts playing (after buffering)
    const handlePlaying = () => {
      if (video.paused) return;
      audio.currentTime = video.currentTime;
      audio.play().catch(console.error);
    };

    // When video is paused by user
    const handlePause = () => {
      audio.pause();
    };

    // When video is waiting/buffering - pause audio to stay in sync
    const handleWaiting = () => {
      audio.pause();
    };

    // Keep audio time in sync during playback
    const handleTimeUpdate = () => {
      // Only sync if both are playing and drift is significant
      if (!video.paused && !audio.paused) {
        if (Math.abs(audio.currentTime - video.currentTime) > 0.15) {
          audio.currentTime = video.currentTime;
        }
      }
    };

    // When user seeks to a new position
    const handleSeeked = () => {
      audio.currentTime = video.currentTime;
      // If video is playing, resume audio
      if (!video.paused) {
        audio.play().catch(console.error);
      }
    };

    // When video ends
    const handleEnded = () => {
      audio.pause();
      audio.currentTime = 0;
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('ended', handleEnded);
    };
  }, [hasSoundEffect]);

  // Recommend SFX
  const handleRecommendSfx = async () => {
    setIsRecommendingSfx(true);
    try {
      const response = await fetch(`/api/narrative/videos/${videoId}/shots/${shot.id}/sound-effect/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get SFX recommendation');
      }
      
      const data = await response.json();
      setLocalDescription(data.prompt);
      onUpdateSoundEffect(shot.id, { soundEffectDescription: data.prompt });
      
      toast({
        title: "SFX Recommended",
        description: "AI has suggested a sound effect description.",
      });
    } catch (error) {
      toast({
        title: "Recommendation Failed",
        description: error instanceof Error ? error.message : "Failed to get recommendation",
        variant: "destructive",
      });
    } finally {
      setIsRecommendingSfx(false);
    }
  };

  // Generate SFX
  const handleGenerateSfx = async () => {
    if (!localDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter or recommend a sound effect description first.",
        variant: "destructive",
      });
      return;
    }

    if (!hasVideo) {
      toast({
        title: "Video Required",
        description: "A video is needed to generate sound effects.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSfx(true);
    try {
      const response = await fetch(`/api/narrative/videos/${videoId}/shots/${shot.id}/sound-effect/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sceneId,
          description: localDescription,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate SFX');
      }
      
      const data = await response.json();
      onUpdateSoundEffect(shot.id, { 
        soundEffectDescription: localDescription,
        soundEffectUrl: data.audioUrl,
      });
      
      toast({
        title: "SFX Generated",
        description: "Sound effect has been created and saved.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate SFX",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSfx(false);
    }
  };

  return (
    <Card className="shrink-0 w-80 overflow-visible bg-white/[0.02] border-white/[0.06]">
      {/* Video Preview */}
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
            {/* Hidden audio element for SFX playback */}
            {hasSoundEffect && (
              <audio 
                ref={audioRef}
                src={soundEffectData?.soundEffectUrl}
                preload="auto"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <Eye className="h-8 w-8" />
          </div>
        )}
        
        {/* Shot number badge */}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <Badge variant="secondary" className="bg-black/60 text-white text-xs">
            #{shotIndex + 1}
          </Badge>
          <Badge variant="secondary" className="bg-black/60 text-white text-xs">
            {shot.duration}s
          </Badge>
        </div>

        {/* SFX status indicator */}
        {hasSoundEffect && (
          <Badge className="absolute top-2 right-2 bg-green-500/80 text-white text-xs gap-1">
            <FileAudio className="h-3 w-3" />
            SFX
          </Badge>
        )}
      </div>

      {/* Sound Effects Controls */}
      <CardContent className="p-4 space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-pink-400" />
            <span className="text-sm font-medium">Sound Effects</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRecommendSfx}
            disabled={isRecommendingSfx || isGeneratingSfx}
            className="text-xs h-7 gap-1"
          >
            {isRecommendingSfx ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Recommend
          </Button>
        </div>

        {/* Description Textarea */}
        <Textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          onBlur={() => {
            if (localDescription !== soundEffectData?.soundEffectDescription) {
              onUpdateSoundEffect(shot.id, { soundEffectDescription: localDescription });
            }
          }}
          placeholder="Describe the sound effects for this shot..."
          className="text-xs min-h-[80px] resize-none bg-white/[0.02] border-white/[0.06]"
          disabled={isGeneratingSfx}
        />

        {/* Generate Button */}
        <Button
          onClick={handleGenerateSfx}
          disabled={!localDescription.trim() || !hasVideo || isGeneratingSfx}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isGeneratingSfx ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : hasSoundEffect ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate SFX
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate SFX
            </>
          )}
        </Button>

        {/* SFX Status */}
        {hasSoundEffect && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <Check className="h-3 w-3" />
            SFX uploaded
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function NarrativeSoundTab({
  videoId,
  scenes,
  shots,
  shotVersions,
  step5Data = {},
  script = '',
  characters = [],
  genre,
  tone,
  language = 'en',
  onUpdateStep5Data,
  onUpdateShot,
}: NarrativeSoundTabProps) {
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // IMPORTANT: Use a ref to track the latest step5Data to avoid stale closures
  // This prevents race conditions when multiple SFX are generated simultaneously
  const step5DataRef = useRef(step5Data);
  step5DataRef.current = step5Data;
  
  // Voiceover state
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(step5Data.voiceoverEnabled ?? true);
  const [voiceId, setVoiceId] = useState(step5Data.voiceId || '');
  const [voiceoverScript, setVoiceoverScript] = useState(step5Data.voiceoverScript || '');
  const [voiceoverAudioUrl, setVoiceoverAudioUrl] = useState(step5Data.voiceoverAudioUrl || '');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showVoiceoverModal, setShowVoiceoverModal] = useState(false);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const voicePreviewAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Voiceover language state - convert from prop if needed
  const [voiceoverLanguage, setVoiceoverLanguage] = useState<'en' | 'ar'>(
    language === 'en' || language === 'ar' ? language : 'en'
  );

  // Music state
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(step5Data.backgroundMusicEnabled ?? true);
  const [musicStyle, setMusicStyle] = useState(step5Data.musicStyle || 'cinematic');
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState(step5Data.generatedMusicUrl || '');
  const [generatedMusicDuration, setGeneratedMusicDuration] = useState(step5Data.generatedMusicDuration || 0);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  
  // Generate All SFX state
  const [isGeneratingAllSfx, setIsGeneratingAllSfx] = useState(false);
  const [sfxGenerationProgress, setSfxGenerationProgress] = useState({ current: 0, total: 0 });

  // Calculate total video duration
  const calculateTotalDuration = () => {
    let total = 0;
    for (const scene of scenes) {
      const sceneShots = shots[scene.id] || [];
      for (const shot of sceneShots) {
        total += shot.duration;
      }
    }
    return total;
  };

  const totalDuration = calculateTotalDuration();

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    return `${seconds}s`;
  };

  // Sync with props
  useEffect(() => {
    if (step5Data.voiceoverEnabled !== undefined) setVoiceoverEnabled(step5Data.voiceoverEnabled);
    if (step5Data.voiceId) setVoiceId(step5Data.voiceId);
    if (step5Data.voiceoverScript) setVoiceoverScript(step5Data.voiceoverScript);
    if (step5Data.voiceoverAudioUrl) setVoiceoverAudioUrl(step5Data.voiceoverAudioUrl);
    if (step5Data.backgroundMusicEnabled !== undefined) setBackgroundMusicEnabled(step5Data.backgroundMusicEnabled);
    if (step5Data.musicStyle) setMusicStyle(step5Data.musicStyle);
    if (step5Data.generatedMusicUrl) setGeneratedMusicUrl(step5Data.generatedMusicUrl);
    if (step5Data.generatedMusicDuration) setGeneratedMusicDuration(step5Data.generatedMusicDuration);
  }, [step5Data]);

  // Sync voiceoverLanguage with language prop
  useEffect(() => {
    if (language === 'en' || language === 'ar') {
      setVoiceoverLanguage(language);
    }
  }, [language]);

  // Get version for a shot
  const getShotVersion = (shot: Shot): ShotVersion | null => {
    const versions = shotVersions[shot.id];
    if (!versions || versions.length === 0) return null;
    if (shot.currentVersionId) {
      return versions.find(v => v.id === shot.currentVersionId) || versions[versions.length - 1];
    }
    return versions[versions.length - 1];
  };

  // Handle SFX update - uses ref to avoid stale closure when multiple SFX generate simultaneously
  const handleUpdateSoundEffect = (shotId: string, data: { soundEffectDescription?: string; soundEffectUrl?: string }) => {
    // IMPORTANT: Use the ref to get the LATEST step5Data, not the stale props
    // This prevents race conditions where one SFX overwrites another
    const currentSfxData = step5DataRef.current?.shotsWithSFX || {};
    const updatedSfxData = {
      ...currentSfxData,
      [shotId]: {
        ...currentSfxData[shotId],
        ...data,
      },
    };
    onUpdateStep5Data({ shotsWithSFX: updatedSfxData });
  };

  // Generate Voiceover Script
  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    try {
      const response = await fetch(`/api/narrative/videos/${videoId}/voiceover/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: voiceoverLanguage }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate script');
      }
      
      const data = await response.json();
      setVoiceoverScript(data.script);
      onUpdateStep5Data({ voiceoverScript: data.script });
      
      toast({
        title: "Script Generated",
        description: "Voiceover script has been created. You can edit it before generating audio.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate script",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Generate Voiceover Audio
  const handleGenerateAudio = async () => {
    if (!voiceId) {
      toast({
        title: "Voice Required",
        description: "Please select a voice before generating audio.",
        variant: "destructive",
      });
      return;
    }
    if (!voiceoverScript.trim()) {
      toast({
        title: "Script Required",
        description: "Please generate or enter a script first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const response = await fetch(`/api/narrative/videos/${videoId}/voiceover/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          script: voiceoverScript,
          voiceId,
          language: voiceoverLanguage,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate audio');
      }
      
      const data = await response.json();
      setVoiceoverAudioUrl(data.audioUrl);
      onUpdateStep5Data({ 
        voiceoverAudioUrl: data.audioUrl,
        voiceoverDuration: data.duration,
        voiceId,
        voiceoverScript,
      });
      
      toast({
        title: "Audio Generated",
        description: `Voiceover audio (${formatDuration(data.duration)}) has been created.`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate audio",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Generate Background Music
  const handleGenerateMusic = async () => {
    setIsGeneratingMusic(true);
    try {
      const response = await fetch(`/api/narrative/videos/${videoId}/music/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicStyle }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate music');
      }
      
      const data = await response.json();
      setGeneratedMusicUrl(data.musicUrl);
      setGeneratedMusicDuration(data.duration);
      onUpdateStep5Data({ 
        generatedMusicUrl: data.musicUrl,
        generatedMusicDuration: data.duration,
        musicStyle,
      });
      
      toast({
        title: "Music Generated",
        description: `Background music (${formatDuration(data.duration)}) has been created.`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate music",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  // Generate SFX for all shots with videos
  const handleGenerateAllSfx = async () => {
    // Get all shots with videos that need SFX
    const shotsNeedingSfx: Array<{ shot: Shot; sceneId: string; version: ShotVersion }> = [];
    
    for (const scene of scenes) {
      const sceneShots = shots[scene.id] || [];
      for (const shot of sceneShots) {
        const versions = shotVersions[shot.id];
        if (!versions || versions.length === 0) continue;
        
        const version = shot.currentVersionId 
          ? versions.find(v => v.id === shot.currentVersionId) || versions[versions.length - 1]
          : versions[versions.length - 1];
        
        // Only include shots that have videos
        if (version?.videoUrl && typeof version.videoUrl === 'string' && version.videoUrl.trim().length > 0) {
          shotsNeedingSfx.push({ shot, sceneId: scene.id, version });
        }
      }
    }

    if (shotsNeedingSfx.length === 0) {
      toast({
        title: "No Videos Found",
        description: "Generate videos for your shots first before adding sound effects.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAllSfx(true);
    setSfxGenerationProgress({ current: 0, total: shotsNeedingSfx.length });

    let successCount = 0;
    let failCount = 0;

    // Process shots sequentially to avoid overwhelming the server
    for (let i = 0; i < shotsNeedingSfx.length; i++) {
      const { shot, sceneId } = shotsNeedingSfx[i];
      setSfxGenerationProgress({ current: i + 1, total: shotsNeedingSfx.length });

      try {
        // Step 1: Get SFX recommendation if no description exists
        let description = step5DataRef.current?.shotsWithSFX?.[shot.id]?.soundEffectDescription || '';
        
        if (!description.trim()) {
          const recommendResponse = await fetch(`/api/narrative/videos/${videoId}/shots/${shot.id}/sound-effect/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sceneId }),
          });
          
          if (recommendResponse.ok) {
            const recommendData = await recommendResponse.json();
            description = recommendData.prompt;
            // Save the description
            handleUpdateSoundEffect(shot.id, { soundEffectDescription: description });
          }
        }

        if (!description.trim()) {
          console.warn(`[SFX] Skipping shot ${shot.id} - no description available`);
          failCount++;
          continue;
        }

        // Step 2: Generate SFX
        const generateResponse = await fetch(`/api/narrative/videos/${videoId}/shots/${shot.id}/sound-effect/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sceneId,
            description,
          }),
        });

        if (!generateResponse.ok) {
          throw new Error('Failed to generate SFX');
        }

        const generateData = await generateResponse.json();
        handleUpdateSoundEffect(shot.id, { 
          soundEffectDescription: description,
          soundEffectUrl: generateData.audioUrl,
        });

        successCount++;
      } catch (error) {
        console.error(`[SFX] Error generating SFX for shot ${shot.id}:`, error);
        failCount++;
      }
    }

    setIsGeneratingAllSfx(false);
    setSfxGenerationProgress({ current: 0, total: 0 });

    // Show summary toast
    if (failCount === 0) {
      toast({
        title: "All SFX Generated! 🎉",
        description: `Successfully created sound effects for ${successCount} shots.`,
      });
    } else {
      toast({
        title: "SFX Generation Complete",
        description: `Generated ${successCount} of ${shotsNeedingSfx.length} sound effects. ${failCount} failed.`,
        variant: failCount === shotsNeedingSfx.length ? "destructive" : "default",
      });
    }
  };

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

  // Get all shots with their versions
  const allShots = Object.values(shots).flat();
  const totalShots = allShots.length;
  const shotsWithVideo = allShots.filter(s => {
    const v = shotVersions[s.id]?.[shotVersions[s.id]?.length - 1];
    return v?.videoUrl && typeof v.videoUrl === 'string' && v.videoUrl.trim().length > 0;
  }).length;

  const selectedVoice = VOICE_LIBRARY.find(v => v.id === voiceId);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Design Your Soundscape</h2>
        <p className="text-muted-foreground">
          Add voiceover, sound effects, and background music to enhance your narrative
        </p>
      </div>

      {/* Controls Bar */}
      <Card className="sticky top-0 z-50 border-white/[0.06] bg-black/40 backdrop-blur-xl">
        <CardContent className="py-4 px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20">
                  <Volume2 className="h-5 w-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Sound Design</h3>
                  <p className="text-sm text-muted-foreground">
                    {shotsWithVideo} of {totalShots} shots have videos
                  </p>
                </div>
              </div>
              
              {/* Total Duration */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <Clock className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-white/80">
                  Total: {formatDuration(totalDuration)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Generate All SFX Button */}
              <Button
                onClick={handleGenerateAllSfx}
                disabled={isGeneratingAllSfx || shotsWithVideo === 0}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isGeneratingAllSfx ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {sfxGenerationProgress.current}/{sfxGenerationProgress.total} SFX...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate All SFX
                  </>
                )}
              </Button>

              {/* Voiceover Button */}
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

              {/* Music Button */}
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
                    <Music2 className="mr-2 h-4 w-4" />
                    Add Music
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenes with Sound Effects */}
      <div className="space-y-6">
        {scenes.map((scene, sceneIndex) => {
          const sceneShots = shots[scene.id] || [];
          
          return (
            <Card key={scene.id} className="overflow-visible bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-0">
                <div className="flex gap-4 p-4">
                  {/* Scene Info Panel */}
                  <div className="w-56 shrink-0 space-y-3">
                    {/* Scene Header */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/50 text-xs px-2">
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
                        <span className="text-white/70">
                          {formatDuration(sceneShots.reduce((sum, s) => sum + s.duration, 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shot Cards */}
                  <div className="flex-1 overflow-x-auto scrollbar-thin">
                    <div className="flex items-start gap-0 pb-2">
                      {sceneShots.map((shot, shotIndex) => {
                        const version = getShotVersion(shot);
                        const isLastShot = shotIndex === sceneShots.length - 1;
                        const sfxData = step5Data.shotsWithSFX?.[shot.id];
                        
                        return (
                          <Fragment key={shot.id}>
                            <SoundShotCard
                              shot={shot}
                              shotIndex={shotIndex}
                              version={version}
                              videoId={videoId}
                              sceneId={scene.id}
                              soundEffectData={sfxData}
                              onUpdateSoundEffect={handleUpdateSoundEffect}
                            />
                            
                            {/* Transition indicator */}
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
        })}
      </div>

      {/* Voiceover Modal */}
      <Dialog open={showVoiceoverModal} onOpenChange={setShowVoiceoverModal}>
        <DialogContent className="sm:max-w-[600px] bg-[#0a0a0a] border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-pink-400" />
              Voiceover Settings
            </DialogTitle>
            <DialogDescription>
              Generate a narration script and voice audio for your video
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Voice Enabled Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Enable Voiceover</Label>
                <p className="text-xs text-white/50">Include narration in your final video</p>
              </div>
              <Switch
                checked={voiceoverEnabled}
                onCheckedChange={(checked) => {
                  setVoiceoverEnabled(checked);
                  onUpdateStep5Data({ voiceoverEnabled: checked });
                }}
              />
            </div>

            {voiceoverEnabled && (
              <>
                {/* Language Selector */}
                <div className="space-y-2">
                  <Label className="text-sm">Language</Label>
                  <Select
                    value={voiceoverLanguage}
                    onValueChange={(value: 'en' | 'ar') => {
                      setVoiceoverLanguage(value);
                      // Reset voice selection if current voice doesn't match new language
                      if (voiceId) {
                        const currentVoice = VOICE_LIBRARY.find(v => v.id === voiceId);
                        if (currentVoice && currentVoice.language !== value) {
                          // Auto-select first voice of the new language
                          const firstVoice = VOICE_LIBRARY.find(v => v.language === value);
                          if (firstVoice) {
                            setVoiceId(firstVoice.id);
                            onUpdateStep5Data({ voiceId: firstVoice.id });
                          } else {
                            setVoiceId('');
                            onUpdateStep5Data({ voiceId: '' });
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
                          <span className={voiceId ? "font-medium" : "text-muted-foreground"}>
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
                              className={`flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-md cursor-pointer ${voiceId === voice.id ? 'bg-pink-500/10 border border-pink-500/30' : ''}`}
                              onClick={() => {
                                setVoiceId(voice.id);
                                onUpdateStep5Data({ voiceId: voice.id });
                                setVoiceDropdownOpen(false);
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {voiceId === voice.id && (
                                    <Check className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                                  )}
                                  <span className={`text-sm ${voiceId === voice.id ? "font-medium text-pink-300" : ""}`}>
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
                                className={`h-7 w-7 shrink-0 ${playingVoice === voice.id ? 'text-pink-400 bg-pink-500/20' : ''}`}
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
                      onClick={handleGenerateScript}
                      disabled={isGeneratingScript}
                      className="gap-1"
                    >
                      {isGeneratingScript ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3" />
                      )}
                      {voiceoverScript ? "Regenerate" : "Generate"} Script
                    </Button>
                  </div>
                  <Textarea
                    value={voiceoverScript}
                    onChange={(e) => setVoiceoverScript(e.target.value)}
                    onBlur={() => onUpdateStep5Data({ voiceoverScript })}
                    placeholder="Enter or generate your voiceover script..."
                    className="min-h-[200px] bg-white/[0.02] border-white/[0.06]"
                  />
                </div>

                {/* Generate Audio Button */}
                <Button
                  onClick={handleGenerateAudio}
                  disabled={!voiceId || !voiceoverScript.trim() || isGeneratingAudio}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
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
              </>
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
            {/* Music Enabled Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Enable Background Music</Label>
                <p className="text-xs text-white/50">Include music in your final video</p>
              </div>
              <Switch
                checked={backgroundMusicEnabled}
                onCheckedChange={(checked) => {
                  setBackgroundMusicEnabled(checked);
                  onUpdateStep5Data({ backgroundMusicEnabled: checked });
                }}
              />
            </div>

            {backgroundMusicEnabled && (
              <>
                {/* Music Style */}
                <div className="space-y-2">
                  <Label className="text-sm">Music Style</Label>
                  <Select
                    value={musicStyle}
                    onValueChange={(value) => {
                      setMusicStyle(value);
                      onUpdateStep5Data({ musicStyle: value });
                    }}
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
                  onClick={handleGenerateMusic}
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
                        {formatDuration(generatedMusicDuration)}
                      </Badge>
                    </div>
                    <audio
                      src={generatedMusicUrl}
                      controls
                      className="w-full h-10"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

