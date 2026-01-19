/**
 * Animatic Preview Tab (Step 5)
 * 
 * Professional video preview with multi-track audio support:
 * - Sequential beat video playback
 * - Synchronized voiceover audio per beat
 * - Audio mixer for volume control
 * - Timeline progress with beat markers
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Mic,
  Music,
  SlidersHorizontal,
  SkipBack,
  SkipForward,
  Film,
  Sparkles,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimaticBeat {
  beatId: 'beat1' | 'beat2' | 'beat3';
  beatName: string;
  videoUrl: string;
  lastFrameUrl?: string;
  duration: number;
  voiceover?: {
    audioUrl: string;
    duration: number;
  };
}

interface AnimaticData {
  beats: AnimaticBeat[];
  totalDuration: number;
  hasVoiceover: boolean;
  volumes: {
    voiceover: number;
    video: number; // Controls embedded audio from Sora video
  };
  render?: {
    id: string;
    status: 'queued' | 'rendering' | 'done' | 'failed';
    progress: number;
    url?: string;
    thumbnailUrl?: string;
  };
}

interface AnimaticPreviewTabProps {
  videoId: string;
  onNext?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function AnimaticPreviewTab({ videoId, onNext }: AnimaticPreviewTabProps) {
  const { toast } = useToast();
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animaticData, setAnimaticData] = useState<AnimaticData | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const [volumes, setVolumes] = useState({
    voiceover: 1,
    video: 1, // Controls embedded audio from Sora video
  });
  
  const [isSavingVolumes, setIsSavingVolumes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    id: string;
    status: string;
    progress: number;
    url?: string;
  } | null>(null);

  // Computed values
  const beats = animaticData?.beats || [];
  const totalDuration = animaticData?.totalDuration || 0;
  const currentBeat = beats[currentBeatIndex];
  const currentVideoUrl = currentBeat?.videoUrl;

  // ═══════════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/social-commerce/animatic/data/${videoId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to load animatic data');
        }

        const data: AnimaticData = await response.json();
        setAnimaticData(data);
        
        // Initialize volumes from saved data (handle migration from old 'music' to new 'video')
        if (data.volumes) {
          const savedVolumes = data.volumes as any;
          setVolumes({
            voiceover: typeof savedVolumes.voiceover === 'number' ? savedVolumes.voiceover : 1,
            // Use 'video' if present, otherwise fallback to 'music' (migration), or default to 1
            video: typeof savedVolumes.video === 'number' ? savedVolumes.video : 
                   (typeof savedVolumes.music === 'number' ? savedVolumes.music : 1),
          });
        }
        
        // Check for existing export
        if (data.render) {
          setExportStatus({
            id: data.render.id,
            status: data.render.status,
            progress: data.render.progress,
            url: data.render.url,
          });
        }

        console.log('[AnimaticPreview] Data loaded:', {
          beatCount: data.beats.length,
          totalDuration: data.totalDuration,
          hasVoiceover: data.hasVoiceover,
        });
      } catch (err) {
        console.error('[AnimaticPreview] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (videoId) {
      fetchData();
    }
  }, [videoId]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // VOLUME MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  const updateVolume = useCallback((track: 'voiceover' | 'video', value: number) => {
    setVolumes(prev => ({ ...prev, [track]: value }));
  }, []);

  // Apply volumes to video and audio elements
  useEffect(() => {
    // Helper to get safe volume value
    const safeVolume = (trackVolume: number | undefined, fallback: number = 1) => {
      const vol = typeof trackVolume === 'number' && isFinite(trackVolume) ? trackVolume : fallback;
      return isMuted ? 0 : vol;
    };

    const voiceoverVol = safeVolume(volumes.voiceover, 1);
    const videoVol = safeVolume(volumes.video, 1);

    // Update video volume (embedded audio from Sora)
    if (videoRef.current && isFinite(videoVol)) {
      videoRef.current.volume = videoVol;
      console.log('[AnimaticPreview] Video volume set to:', videoVol);
    }

    // Update voiceover volumes
    if (isFinite(voiceoverVol)) {
      voiceoverRefs.current.forEach(audio => {
        audio.volume = voiceoverVol;
      });
    }
  }, [volumes, isMuted]);

  // Save volumes to backend (debounced)
  useEffect(() => {
    if (!videoId || isLoading) return;

    const saveVolumes = async () => {
      setIsSavingVolumes(true);
      try {
        await fetch(`/api/social-commerce/animatic/volumes/${videoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(volumes),
        });
      } catch (err) {
        console.error('[AnimaticPreview] Failed to save volumes:', err);
      } finally {
        setIsSavingVolumes(false);
      }
    };

    const timer = setTimeout(saveVolumes, 500);
    return () => clearTimeout(timer);
  }, [volumes, videoId, isLoading]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PLAYBACK CONTROL
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleVideoLoadedData = useCallback(() => {
    console.log('[AnimaticPreview] Video loaded');
  }, []);

  const handleVideoError = useCallback(() => {
    setError('Failed to load video');
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !currentBeat) return;

    // Calculate global time based on beat index and video current time
    const beatStartTime = currentBeatIndex * 12; // Each beat is 12s
    const globalTime = beatStartTime + video.currentTime;
    setCurrentTime(globalTime);
  }, [currentBeatIndex, currentBeat]);

  const handleVideoEnded = useCallback(() => {
    // Move to next beat or stop
    if (currentBeatIndex < beats.length - 1) {
      setCurrentBeatIndex(prev => prev + 1);
    } else {
      // End of all beats
      setIsPlaying(false);
      setCurrentBeatIndex(0);
      
      // Stop all voiceover audio
      voiceoverRefs.current.forEach(audio => audio.pause());
    }
  }, [currentBeatIndex, beats.length]);

  // Play next beat video automatically
  useEffect(() => {
    const video = videoRef.current;
    if (video && isPlaying && currentVideoUrl) {
      video.play().catch(console.error);
      
      // Play corresponding voiceover
      const voiceover = voiceoverRefs.current.get(currentBeat?.beatId || '');
      if (voiceover && voiceover.src) {
        voiceover.currentTime = 0;
        voiceover.play().catch(() => {});
      }
    }
  }, [currentBeatIndex, isPlaying, currentVideoUrl, currentBeat?.beatId]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      voiceoverRefs.current.forEach(audio => audio.pause());
      setIsPlaying(false);
    } else {
      // Set volumes before playing (with fallbacks for undefined values)
      const voiceoverVol = typeof volumes.voiceover === 'number' && isFinite(volumes.voiceover) ? volumes.voiceover : 1;
      const videoVol = typeof volumes.video === 'number' && isFinite(volumes.video) ? volumes.video : 1;

      // Set video volume (embedded Sora audio)
      if (isFinite(videoVol)) {
        video.volume = isMuted ? 0 : videoVol;
        console.log('[AnimaticPreview] Playing video with volume:', isMuted ? 0 : videoVol);
      }

      if (isFinite(voiceoverVol)) {
        voiceoverRefs.current.forEach(audio => {
          audio.volume = isMuted ? 0 : voiceoverVol;
        });
      }

      video.play().catch(err => {
        console.error('[AnimaticPreview] Video play error:', err);
      });
      
      // Play current beat's voiceover
      const voiceover = voiceoverRefs.current.get(currentBeat?.beatId || '');
      if (voiceover && voiceover.src) {
        voiceover.play().catch(() => {});
      }
      
      setIsPlaying(true);
    }
  }, [isPlaying, isMuted, volumes, currentBeat?.beatId]);

  const handleSeek = useCallback((globalTime: number) => {
    // Find which beat this time falls into
    const beatIndex = Math.min(Math.floor(globalTime / 12), beats.length - 1);
    const localTime = globalTime - (beatIndex * 12);

    setCurrentBeatIndex(beatIndex);
    setCurrentTime(globalTime);

    const video = videoRef.current;
    if (video) {
      video.currentTime = localTime;
    }

    // Sync voiceover
    const voiceover = voiceoverRefs.current.get(beats[beatIndex]?.beatId || '');
    if (voiceover && voiceover.src) {
      voiceover.currentTime = localTime;
    }
  }, [beats]);

  const skipToBeat = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentBeatIndex(prev => Math.max(0, prev - 1));
    } else {
      setCurrentBeatIndex(prev => Math.min(beats.length - 1, prev + 1));
    }
    
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
    }
  }, [beats.length]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const response = await fetch(`/api/social-commerce/animatic/export/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quality: 'final' }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to start export');
      }

      const data = await response.json();
      setExportStatus({
        id: data.renderId,
        status: data.status,
        progress: 10,
      });

      toast({
        title: 'Export Started',
        description: 'Your video is being rendered. This may take a few minutes.',
      });

      // Start polling for status
      pollExportStatus(data.renderId);
    } catch (err) {
      console.error('[AnimaticPreview] Export error:', err);
      toast({
        title: 'Export Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const pollExportStatus = async (renderId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/social-commerce/animatic/export/${videoId}/${renderId}`,
          { credentials: 'include' }
        );

        if (!response.ok) return;

        const data = await response.json();
        setExportStatus({
          id: renderId,
          status: data.status,
          progress: data.progress,
          url: data.url,
        });

        if (data.status === 'done') {
          toast({
            title: 'Export Complete!',
            description: 'Your video is ready to download.',
          });
        } else if (data.status === 'failed') {
          toast({
            title: 'Export Failed',
            description: data.error || 'Render failed',
            variant: 'destructive',
          });
        } else {
          // Continue polling
          setTimeout(poll, 3000);
        }
      } catch (err) {
        console.error('[AnimaticPreview] Poll error:', err);
      }
    };

    setTimeout(poll, 3000);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-[#0a0a0a]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
          <p className="text-white/60">Loading animatic preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-[#0a0a0a]">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="text-lg font-medium text-white">Error Loading Preview</h3>
          <p className="text-white/60">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // No beats
  if (beats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-[#0a0a0a]">
        <div className="text-center space-y-4 max-w-md">
          <Film className="w-10 h-10 text-white/40 mx-auto" />
          <h3 className="text-lg font-medium text-white">No Beat Videos Found</h3>
          <p className="text-white/60">
            Generate beat videos in the Storyboard step first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Animatic Preview</h2>
            <p className="text-sm text-white/50">
              {formatTime(totalDuration)} • {beats.length} beats
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Video Player */}
        <div className="flex-1 flex flex-col bg-black rounded-xl overflow-hidden">
          {/* Video Container */}
          <div className="relative flex-1 bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              src={currentVideoUrl}
              className="max-w-full max-h-full object-contain"
              onLoadedData={handleVideoLoadedData}
              onError={handleVideoError}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onClick={togglePlay}
              playsInline
              muted={isMuted}
            />

            {/* Play button overlay */}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                onClick={togglePlay}
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-emerald-500/30 transition-all group-hover:scale-110">
                  <Play className="w-8 h-8 text-emerald-400 ml-1" />
                </div>
              </div>
            )}

            {/* Beat indicator */}
            <div className="absolute top-4 left-4">
              <Badge 
                variant="secondary" 
                className="bg-black/60 backdrop-blur text-white border-none"
              >
                Beat {currentBeatIndex + 1}: {currentBeat?.beatName}
              </Badge>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex-shrink-0 bg-[#0a0a0a] border-t border-white/[0.08] px-4 py-3">
            {/* Progress Bar */}
            <div
              className="relative h-2 bg-white/10 rounded-full cursor-pointer mb-3 group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = x / rect.width;
                const seekTime = percent * totalDuration;
                handleSeek(seekTime);
              }}
            >
              {/* Beat markers */}
              {beats.map((_, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 w-0.5 bg-white/30"
                  style={{ left: `${((idx + 1) * 12 / totalDuration) * 100}%` }}
                />
              ))}
              {/* Progress */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
              />
              {/* Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg transition-transform group-hover:scale-125"
                style={{ left: `calc(${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}% - 7px)` }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              {/* Left: Playback controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skipToBeat('prev')}
                  disabled={currentBeatIndex === 0}
                  className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
                  title="Previous Beat"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="h-11 w-11 text-white hover:bg-white/10 rounded-full mx-1"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skipToBeat('next')}
                  disabled={currentBeatIndex >= beats.length - 1}
                  className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
                  title="Next Beat"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-white/10 mx-2" />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn(
                    "h-9 w-9 hover:bg-white/10",
                    isMuted ? "text-red-400" : "text-white/70 hover:text-white"
                  )}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>

              {/* Center: Time */}
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="text-emerald-400 font-semibold">{formatTime(currentTime)}</span>
                <span className="text-white/30">/</span>
                <span className="text-white/50">{formatTime(totalDuration)}</span>
              </div>

              {/* Right: Beat info */}
              <div className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-md">
                Beat {currentBeatIndex + 1} of {beats.length}
              </div>
            </div>
          </div>
        </div>

        {/* Audio Mixer Sidebar */}
        <div className="w-72 flex-shrink-0 bg-[#0d0d0d] rounded-xl border border-white/[0.06] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-slate-900/30">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-white/80">Audio Mixer</span>
            {isSavingVolumes && (
              <Loader2 className="w-3 h-3 text-white/40 animate-spin ml-auto" />
            )}
          </div>

          {/* Mixer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Video Audio (embedded audio from Sora) */}
            <TrackControl
              icon={<Film className="w-4 h-4" />}
              label="Video Audio"
              color="cyan"
              volume={volumes.video}
              onVolumeChange={(v) => updateVolume('video', v)}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(!isMuted)}
            />

            <div className="h-px bg-white/[0.06]" />

            {/* Voiceover */}
            <TrackControl
              icon={<Mic className="w-3.5 h-3.5" />}
              label="Voiceover"
              color="purple"
              volume={volumes.voiceover}
              onVolumeChange={(v) => updateVolume('voiceover', v)}
              disabled={!animaticData?.hasVoiceover}
            />
          </div>

          {/* Beat List */}
          <div className="border-t border-white/[0.06] p-4">
            <div className="text-xs text-white/50 uppercase tracking-wider mb-3">Beats</div>
            <div className="space-y-2">
              {beats.map((beat, idx) => (
                <button
                  key={beat.beatId}
                  onClick={() => {
                    setCurrentBeatIndex(idx);
                    if (videoRef.current) videoRef.current.currentTime = 0;
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                    currentBeatIndex === idx
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{beat.beatName}</span>
                    <span className="text-[10px] text-white/40">{beat.duration}s</span>
                  </div>
                  {beat.voiceover && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400">
                      <Mic className="w-3 h-3" />
                      <span>Voiceover</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Audio Elements - Voiceover tracks per beat */}
      {beats.map(beat => beat.voiceover && (
        <audio
          key={`vo-${beat.beatId}`}
          ref={(el) => {
            if (el) {
              voiceoverRefs.current.set(beat.beatId, el);
              // Calculate volume with fallback for undefined values
              const voTrack = typeof volumes.voiceover === 'number' && isFinite(volumes.voiceover) ? volumes.voiceover : 1;
              const vol = isMuted ? 0 : voTrack;
              if (isFinite(vol)) {
                el.volume = vol;
              }
            } else {
              voiceoverRefs.current.delete(beat.beatId);
            }
          }}
          src={beat.voiceover.audioUrl}
          preload="auto"
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRACK CONTROL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function TrackControl({
  icon,
  label,
  color,
  volume,
  onVolumeChange,
  isMuted,
  onMuteToggle,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'cyan' | 'purple' | 'pink';
  volume: number;
  onVolumeChange: (value: number) => void;
  isMuted?: boolean;
  onMuteToggle?: () => void;
  disabled?: boolean;
}) {
  const colorClasses = {
    cyan: {
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      text: 'text-emerald-400',
      slider: '[&_[role=slider]]:bg-emerald-500 [&_.bg-primary]:bg-emerald-500',
    },
    purple: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      slider: '[&_[role=slider]]:bg-emerald-500 [&_.bg-primary]:bg-emerald-500',
    },
    pink: {
      bg: 'bg-teal-500/20',
      text: 'text-teal-400',
      slider: '[&_[role=slider]]:bg-teal-500 [&_.bg-primary]:bg-teal-500',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={cn("space-y-2", disabled && "opacity-40")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            color === 'cyan' ? classes.bg : `${classes.bg} border border-${color}-500/30`
          )}>
            <span className={color === 'cyan' ? 'text-white' : classes.text}>{icon}</span>
          </div>
          <span className="text-sm font-medium text-white">{label}</span>
          {disabled && <span className="text-xs text-white/30">(none)</span>}
        </div>
        <div className="flex items-center gap-2">
          {onMuteToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMuteToggle}
              disabled={disabled}
              className={cn(
                "h-6 w-6 rounded",
                isMuted
                  ? "bg-red-500/30 text-red-400 hover:bg-red-500/40"
                  : "text-white/40 hover:text-white hover:bg-white/10"
              )}
            >
              <VolumeX className="w-3 h-3" />
            </Button>
          )}
          <span className={cn("text-xs font-mono", classes.text)}>
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
      <Slider
        value={[volume]}
        min={0}
        max={1}
        step={0.01}
        onValueChange={([v]) => onVolumeChange(v)}
        disabled={disabled}
        className={cn("cursor-pointer", classes.slider, disabled && "cursor-not-allowed")}
      />
    </div>
  );
}

export default AnimaticPreviewTab;
