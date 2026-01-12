/**
 * Video Preview Component
 * 
 * Provides video preview with multi-track audio support:
 * - Video playback with proper aspect ratio
 * - Separate volume controls for SFX, Voiceover, Music
 * - Synchronized audio playback
 */

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import { 
  Loader2, AlertCircle, RefreshCw, Play, Pause, 
  Volume2, VolumeX, Mic, Music, SlidersHorizontal,
  SkipBack, SkipForward
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { ShotstackEdit } from './types';

export interface ShotstackStudioRef {
  getCurrentEdit: () => ShotstackEdit | null;
  getCurrentVolumes: () => { master: number; sfx: number; voiceover: number; music: number };
}

interface ShotstackStudioProps {
  template: ShotstackEdit | null;
  onEditChange?: (edit: ShotstackEdit) => void;
  className?: string;
  height?: string | number;
  initialVolumes?: { master: number; sfx: number; voiceover: number; music: number } | null;
}

interface AudioTrack {
  type: 'sfx' | 'voiceover' | 'music';
  src: string;
  volume: number;
}

export const ShotstackStudio = forwardRef<ShotstackStudioRef, ShotstackStudioProps>(
  function ShotstackStudio({
    template,
    onEditChange,
    className,
    height = '100%',
    initialVolumes,
  }: ShotstackStudioProps, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const sfxRefs = useRef<Map<number, HTMLAudioElement>>(new Map());
    const voiceoverRef = useRef<HTMLAudioElement>(null);
    const musicRef = useRef<HTMLAudioElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentClipIndex, setCurrentClipIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    // Volume states for each track type - use initialVolumes if provided, otherwise defaults
    const [volumes, setVolumes] = useState(initialVolumes || {
      master: 1,
      sfx: 0.8,
      voiceover: 1,
      music: 0.5,
    });

    // Update volumes when initialVolumes changes (e.g., when loaded from DB)
    useEffect(() => {
      if (initialVolumes) {
        console.log('[ShotstackStudio] Initializing volumes from saved values:', initialVolumes);
        setVolumes(initialVolumes);
      }
    }, [initialVolumes]);

    // Extract clips from template - search by content type, not fixed indices
    const tracks = template?.timeline?.tracks || [];
    
    // Video clips - find first track with video clips
    const videoTrack = tracks.find(track => 
      track.clips?.some(clip => clip.asset?.type === 'video')
    );
    const videoClips = videoTrack?.clips?.filter(
      clip => clip.asset?.type === 'video' && clip.asset?.src
    ).sort((a, b) => (a.start || 0) - (b.start || 0)) || [];

    // SFX clips - find audio track with multiple clips (sfx are per-shot)
    const sfxTrack = tracks.find(track => {
      const audioClips = track.clips?.filter(clip => clip.asset?.type === 'audio');
      return audioClips && audioClips.length > 1;
    });
    const sfxClips = sfxTrack?.clips?.filter(
      clip => clip.asset?.type === 'audio' && clip.asset?.src
    ).sort((a, b) => (a.start || 0) - (b.start || 0)) || [];

    // Voiceover - find audio track with single clip containing 'voiceover' in URL or at start=0
    // and without 'music' in URL
    const voiceoverTrack = tracks.find(track => {
      const audioClips = track.clips?.filter(clip => clip.asset?.type === 'audio');
      if (!audioClips || audioClips.length !== 1) return false;
      const src = audioClips[0]?.asset?.src as string || '';
      // Voiceover URLs typically contain 'voice' or 'voiceover'
      return src.includes('Voice-Over') || src.includes('voiceover') || 
             (src.includes('Voice') && !src.includes('Music'));
    });
    const voiceoverUrl = voiceoverTrack?.clips?.[0]?.asset?.src as string | undefined;

    // Music - find audio track with single clip containing 'music' in URL
    const musicTrack = tracks.find(track => {
      const audioClips = track.clips?.filter(clip => clip.asset?.type === 'audio');
      if (!audioClips || audioClips.length !== 1) return false;
      const src = audioClips[0]?.asset?.src as string || '';
      // Music URLs typically contain 'music' or 'Background-Music'
      return src.includes('Music') || src.includes('music') || src.includes('generated_music');
    });
    const musicUrl = musicTrack?.clips?.[0]?.asset?.src as string | undefined;
    
    console.log('[ShotstackStudio] Extracted audio tracks:', {
      trackCount: tracks.length,
      videoClipCount: videoClips.length,
      sfxClipCount: sfxClips.length,
      hasVoiceover: !!voiceoverUrl,
      hasMusic: !!musicUrl,
      voiceoverUrl,
      musicUrl,
    });

    const currentClip = videoClips[currentClipIndex];
    const currentVideoUrl = currentClip?.asset?.src as string | undefined;

    // Get current edit
    const getCurrentEdit = useCallback((): ShotstackEdit | null => {
      return template;
    }, [template]);

    // Method to get current volumes for export
    const getCurrentVolumes = useCallback(() => {
      return { ...volumes };
    }, [volumes]);

    useImperativeHandle(ref, () => ({
      getCurrentEdit,
      getCurrentVolumes,
    }), [getCurrentEdit, getCurrentVolumes]);

    // Calculate total duration
    useEffect(() => {
      if (template?.timeline?.tracks) {
        let total = 0;
        for (const track of template.timeline.tracks) {
          for (const clip of track.clips) {
            total = Math.max(total, (clip.start || 0) + (clip.length || 0));
          }
        }
        setDuration(total);
      }
    }, [template]);

    // Update audio volumes - run whenever volumes change or audio sources change
    useEffect(() => {
      const effectiveVolume = (trackVolume: number) => 
        isMuted ? 0 : trackVolume * volumes.master;

      const sfxVol = effectiveVolume(volumes.sfx);
      const voiceoverVol = effectiveVolume(volumes.voiceover);
      const musicVol = effectiveVolume(volumes.music);

      console.log('[ShotstackStudio] Updating audio volumes:', {
        master: volumes.master,
        sfx: volumes.sfx,
        voiceover: volumes.voiceover,
        music: volumes.music,
        effectiveSfx: sfxVol,
        effectiveVoiceover: voiceoverVol,
        effectiveMusic: musicVol,
        isMuted,
        sfxCount: sfxRefs.current.size,
        hasVoiceover: !!voiceoverRef.current,
        hasMusic: !!musicRef.current,
      });

      // Update SFX volumes
      sfxRefs.current.forEach(audio => {
        audio.volume = sfxVol;
      });

      // Update voiceover
      if (voiceoverRef.current) {
        voiceoverRef.current.volume = voiceoverVol;
      }

      // Update music
      if (musicRef.current) {
        musicRef.current.volume = musicVol;
      }
    }, [volumes, isMuted, voiceoverUrl, musicUrl, sfxClips.length]);

    // Sync audio with video time
    const syncAudioToTime = useCallback((time: number) => {
      // Sync SFX clips based on their start times
      sfxClips.forEach((clip, index) => {
        const audio = sfxRefs.current.get(index);
        if (!audio) return;

        const clipStart = clip.start || 0;
        const clipEnd = clipStart + (clip.length || 0);

        if (time >= clipStart && time < clipEnd) {
          const localTime = time - clipStart;
          if (Math.abs(audio.currentTime - localTime) > 0.3) {
            audio.currentTime = localTime;
          }
          if (audio.paused && isPlaying) {
            audio.play().catch(() => {});
          }
        } else {
          if (!audio.paused) {
            audio.pause();
          }
        }
      });

      // Sync voiceover (plays once from start)
      const voiceover = voiceoverRef.current;
      if (voiceover && voiceover.src) {
        if (Math.abs(voiceover.currentTime - time) > 0.3) {
          voiceover.currentTime = Math.min(time, voiceover.duration || time);
        }
      }

      // Sync music (loops continuously)
      // Music should loop throughout the video duration
      const music = musicRef.current;
      if (music && music.src && music.duration) {
        // Calculate position within the music loop
        const musicPosition = time % music.duration;
        if (Math.abs(music.currentTime - musicPosition) > 0.3) {
          music.currentTime = musicPosition;
        }
      }
    }, [sfxClips, isPlaying]);

    // Handle video load
    useEffect(() => {
      if (currentVideoUrl) {
        setIsLoading(true);
        setError(null);
      }
    }, [currentVideoUrl]);

    const handleLoadedData = useCallback(() => {
      setIsLoading(false);
      setError(null);
    }, []);

    const handleError = useCallback(() => {
      setError('Failed to load video');
      setIsLoading(false);
    }, []);

    const handleTimeUpdate = useCallback(() => {
      const video = videoRef.current;
      if (!video || !currentClip) return;
      
      const clipStartTime = videoClips
        .slice(0, currentClipIndex)
        .reduce((acc, clip) => acc + (clip.length || 0), 0);
      
      const newTime = clipStartTime + video.currentTime;
      setCurrentTime(newTime);
      syncAudioToTime(newTime);
    }, [currentClip, currentClipIndex, videoClips, syncAudioToTime]);

    const handleEnded = useCallback(() => {
      if (currentClipIndex < videoClips.length - 1) {
        setCurrentClipIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setCurrentClipIndex(0);
        // Pause all audio
        sfxRefs.current.forEach(audio => audio.pause());
        [voiceoverRef, musicRef].forEach(ref => {
          if (ref.current) ref.current.pause();
        });
      }
    }, [currentClipIndex, videoClips.length]);

    // Play/Pause all media
    const togglePlay = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;

      if (isPlaying) {
        video.pause();
        sfxRefs.current.forEach(audio => audio.pause());
        [voiceoverRef, musicRef].forEach(ref => {
          if (ref.current) ref.current.pause();
        });
        setIsPlaying(false);
      } else {
        // Ensure volumes are set BEFORE playing
        const voiceoverVol = isMuted ? 0 : volumes.voiceover * volumes.master;
        const musicVol = isMuted ? 0 : volumes.music * volumes.master;
        const sfxVol = isMuted ? 0 : volumes.sfx * volumes.master;
        
        console.log('[ShotstackStudio] Playing with volumes:', {
          voiceover: voiceoverVol,
          music: musicVol,
          sfx: sfxVol,
        });
        
        // Set volumes before play
        sfxRefs.current.forEach(audio => {
          audio.volume = sfxVol;
        });
        if (voiceoverRef.current) {
          voiceoverRef.current.volume = voiceoverVol;
        }
        if (musicRef.current) {
          musicRef.current.volume = musicVol;
        }
        
        video.play().catch(console.error);
        // Start voiceover and music
        if (voiceoverRef.current && voiceoverRef.current.src && voiceoverVol > 0) {
          voiceoverRef.current.play().catch(() => {});
        }
        if (musicRef.current && musicRef.current.src && musicVol > 0) {
          musicRef.current.play().catch(() => {});
        }
        setIsPlaying(true);
      }
    }, [isPlaying, isMuted, volumes]);

    // Auto-play next clip
    useEffect(() => {
      const video = videoRef.current;
      if (video && isPlaying && currentVideoUrl) {
        video.play().catch(console.error);
      }
    }, [currentClipIndex, isPlaying, currentVideoUrl]);

    // Seek
    const handleSeek = useCallback((value: number[]) => {
      const seekTime = value[0];
      
      // Find which clip this time falls into
      let accumulatedTime = 0;
      for (let i = 0; i < videoClips.length; i++) {
        const clipDuration = videoClips[i].length || 0;
        if (seekTime < accumulatedTime + clipDuration) {
          setCurrentClipIndex(i);
          const video = videoRef.current;
          if (video) {
            video.currentTime = seekTime - accumulatedTime;
          }
          setCurrentTime(seekTime);
          syncAudioToTime(seekTime);
          return;
        }
        accumulatedTime += clipDuration;
      }
    }, [videoClips, syncAudioToTime]);

    // Update volume for a specific track
    const updateVolume = useCallback((track: keyof typeof volumes, value: number) => {
      setVolumes(prev => ({ ...prev, [track]: value }));
    }, []);

    // Format time
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // No template
    if (!template) {
      return (
        <div className={cn("flex items-center justify-center bg-black/50 rounded-xl", className)} style={{ height }}>
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
            <p className="text-white/60">No preview data available</p>
          </div>
        </div>
      );
    }

    // No video clips
    if (videoClips.length === 0) {
      return (
        <div className={cn("flex items-center justify-center bg-black/50 rounded-xl", className)} style={{ height }}>
          <div className="flex flex-col items-center gap-3 text-center p-6">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
            <p className="text-white/60">No video clips found in timeline</p>
            <p className="text-xs text-white/40">Generate videos in the Compose phase first</p>
          </div>
        </div>
      );
    }

    return (
      <div className={cn("flex gap-4", className)} style={{ height }}>
        {/* Main Video Player */}
        <div className="flex-1 flex flex-col bg-black rounded-xl overflow-hidden">
          {/* Video Container */}
          <div className="relative flex-1 bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                  <p className="text-white/60">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      if (videoRef.current) videoRef.current.load();
                    }}
                    className="bg-transparent border-cyan-500/30 text-cyan-400"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              src={currentVideoUrl}
              className="absolute inset-0 w-full h-full object-contain bg-black"
              onLoadedData={handleLoadedData}
              onError={handleError}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onClick={togglePlay}
              playsInline
              muted
            />

            {/* Play button overlay */}
            {!isPlaying && !isLoading && !error && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                onClick={togglePlay}
              >
                <div className="w-20 h-20 rounded-full bg-cyan-500/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-cyan-500/30 transition-all group-hover:scale-110">
                  <Play className="w-8 h-8 text-cyan-400 ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar - Fixed at bottom */}
          <div className="flex-shrink-0 bg-[#0a0a0a] border-t border-white/[0.08] px-4 py-3">
            {/* Progress Bar */}
            <div 
              className="relative h-1.5 bg-white/10 rounded-full cursor-pointer mb-3 group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = x / rect.width;
                const seekTime = percent * duration;
                handleSeek([seekTime]);
              }}
            >
              {/* Buffered/Background */}
              <div className="absolute inset-0 bg-white/20 rounded-full" />
              {/* Progress */}
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              {/* Handle */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg transition-transform group-hover:scale-125"
                style={{ left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 7px)` }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              {/* Left: Playback controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSeek([Math.max(0, currentTime - 10)])}
                  className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
                  title="Back 10s"
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
                  onClick={() => handleSeek([Math.min(duration, currentTime + 10)])}
                  className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
                  title="Forward 10s"
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
                <span className="text-cyan-400 font-semibold">{formatTime(currentTime)}</span>
                <span className="text-white/30">/</span>
                <span className="text-white/50">{formatTime(duration)}</span>
              </div>

              {/* Right: Clip info */}
              <div className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-md">
                Clip {currentClipIndex + 1} of {videoClips.length}
              </div>
            </div>
          </div>
        </div>

        {/* Audio Mixer Sidebar */}
        <div className="w-72 flex-shrink-0 bg-[#0d0d0d] rounded-xl border border-white/[0.06] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-slate-900/30">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white/80">Audio Mixer</span>
          </div>

          {/* Mixer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Master Volume */}
            <TrackControl
              icon={<Volume2 className="w-4 h-4" />}
              label="Master"
              color="cyan"
              volume={volumes.master}
              onVolumeChange={(v) => updateVolume('master', v)}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(!isMuted)}
            />

            <div className="h-px bg-white/[0.06]" />

            {/* SFX */}
            <TrackControl
              icon={<Volume2 className="w-3.5 h-3.5" />}
              label={`SFX${sfxClips.length > 0 ? ` (${sfxClips.length})` : ''}`}
              color="amber"
              volume={volumes.sfx}
              onVolumeChange={(v) => updateVolume('sfx', v)}
              disabled={sfxClips.length === 0}
            />

            {/* Voiceover */}
            <TrackControl
              icon={<Mic className="w-3.5 h-3.5" />}
              label="Voiceover"
              color="purple"
              volume={volumes.voiceover}
              onVolumeChange={(v) => updateVolume('voiceover', v)}
              disabled={!voiceoverUrl}
            />

            {/* Music */}
            <TrackControl
              icon={<Music className="w-3.5 h-3.5" />}
              label={musicUrl ? "Music" : "Music (none)"}
              color="pink"
              volume={volumes.music}
              onVolumeChange={(v) => updateVolume('music', v)}
              disabled={!musicUrl}
            />
          </div>
        </div>

        {/* Hidden Audio Elements */}
        {sfxClips.map((clip, index) => (
          <audio
            key={`sfx-${index}`}
            ref={(el) => {
              if (el) {
                sfxRefs.current.set(index, el);
                // Set initial volume immediately
                el.volume = isMuted ? 0 : volumes.sfx * volumes.master;
              } else {
                sfxRefs.current.delete(index);
              }
            }}
            src={clip.asset?.src as string}
            preload="auto"
          />
        ))}
        {voiceoverUrl && (
          <audio 
            ref={voiceoverRef} 
            src={voiceoverUrl} 
            preload="auto"
            onLoadedData={(e) => {
              // Set volume when audio is ready
              const vol = isMuted ? 0 : volumes.voiceover * volumes.master;
              (e.target as HTMLAudioElement).volume = vol;
              console.log('[ShotstackStudio] Voiceover audio loaded, volume set to:', vol);
            }}
          />
        )}
        {musicUrl && (
          <audio 
            ref={musicRef} 
            src={musicUrl} 
            preload="auto" 
            loop
            onLoadedData={(e) => {
              // Set volume when audio is ready
              const vol = isMuted ? 0 : volumes.music * volumes.master;
              (e.target as HTMLAudioElement).volume = vol;
              console.log('[ShotstackStudio] Music audio loaded, volume set to:', vol);
            }}
          />
        )}
      </div>
    );
  }
);

// Track Control Component
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
  color: 'cyan' | 'amber' | 'purple' | 'pink';
  volume: number;
  onVolumeChange: (value: number) => void;
  isMuted?: boolean;
  onMuteToggle?: () => void;
  disabled?: boolean;
}) {
  const colorClasses = {
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-500 to-teal-500',
      text: 'text-cyan-400',
      slider: '[&_[role=slider]]:bg-cyan-500 [&_.bg-primary]:bg-cyan-500',
    },
    amber: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      slider: '[&_[role=slider]]:bg-amber-500 [&_.bg-primary]:bg-amber-500',
    },
    purple: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      slider: '[&_[role=slider]]:bg-purple-500 [&_.bg-primary]:bg-purple-500',
    },
    pink: {
      bg: 'bg-pink-500/20',
      text: 'text-pink-400',
      slider: '[&_[role=slider]]:bg-pink-500 [&_.bg-primary]:bg-pink-500',
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
