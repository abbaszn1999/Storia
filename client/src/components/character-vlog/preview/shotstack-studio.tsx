/**
 * Video Preview Component for Character Vlog
 * 
 * Provides video preview with multi-track audio support:
 * - Video playback with proper aspect ratio
 * - Separate volume controls for SFX, Voiceover, Music
 * - Synchronized audio playback
 * 
 * Uses pink/orange theming consistent with Character Vlog mode.
 */

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  Loader2, AlertCircle, RefreshCw, Play, Pause, 
  Volume2, VolumeX, Mic, Music, SlidersHorizontal,
  SkipBack, SkipForward, Info
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
  referenceMode?: '1F' | '2F' | 'AI';
}

export const ShotstackStudio = forwardRef<ShotstackStudioRef, ShotstackStudioProps>(
  function ShotstackStudio({
    template,
    onEditChange,
    className,
    height = '100%',
    initialVolumes,
    referenceMode = '2F',
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
    const videoClips = useMemo(() => {
      const tracks = template?.timeline?.tracks || [];
      
      console.log('[ShotstackStudio] Template received:', {
        hasTemplate: !!template,
        trackCount: tracks.length,
        tracks: tracks.map((t, i) => ({
          index: i,
          clipCount: t.clips?.length || 0,
          clipTypes: t.clips?.map(c => c.asset?.type).join(', '),
        })),
      });
      
      // Video/Image clips - find first track with video OR image clips
      const videoTrack = tracks.find(track => 
        track.clips?.some(clip => 
          clip.asset?.type === 'video' || clip.asset?.type === 'image'
        )
      );
      const clips = videoTrack?.clips?.filter(
        clip => (clip.asset?.type === 'video' || clip.asset?.type === 'image') && clip.asset?.src
      ).sort((a, b) => (a.start || 0) - (b.start || 0)) || [];
      
      console.log('[ShotstackStudio] Extracted clips:', {
        trackCount: tracks.length,
        videoClipCount: clips.filter(c => c.asset?.type === 'video').length,
        imageClipCount: clips.filter(c => c.asset?.type === 'image').length,
        totalClips: clips.length,
        firstClipType: clips[0]?.asset?.type,
        firstClipStart: clips[0]?.start,
        firstClipLength: clips[0]?.length,
      });
      
      return clips;
    }, [template]);

    // SFX clips and audio tracks
    const { sfxClips, voiceoverUrl, musicUrl } = useMemo(() => {
      const tracks = template?.timeline?.tracks || [];
      
      // SFX clips - find audio track with multiple clips (sfx are per-shot)
      const sfxTrack = tracks.find(track => {
        const audioClips = track.clips?.filter(clip => clip.asset?.type === 'audio');
        return audioClips && audioClips.length > 1;
      });
      const sfx = sfxTrack?.clips?.filter(
        clip => clip.asset?.type === 'audio' && clip.asset?.src
      ).sort((a, b) => (a.start || 0) - (b.start || 0)) || [];

      // Voiceover - find audio track with single clip containing 'voiceover' in URL
      const voiceoverTrack = tracks.find(track => {
        const audioClips = track.clips?.filter(clip => clip.asset?.type === 'audio');
        if (!audioClips || audioClips.length !== 1) return false;
        const src = audioClips[0]?.asset?.src as string || '';
        return src.includes('Voice-Over') || src.includes('voiceover') || 
               (src.includes('Voice') && !src.includes('Music'));
      });
      const vo = voiceoverTrack?.clips?.[0]?.asset?.src as string | undefined;

      // Music - find audio track with single clip containing 'music' in URL
      const musicTrack = tracks.find(track => {
        const audioClips = track.clips?.filter(clip => clip.asset?.type === 'audio');
        if (!audioClips || audioClips.length !== 1) return false;
        const src = audioClips[0]?.asset?.src as string || '';
        return src.includes('Music') || src.includes('music') || src.includes('generated_music');
      });
      const music = musicTrack?.clips?.[0]?.asset?.src as string | undefined;
      
      console.log('[ShotstackStudio] Extracted audio tracks:', {
        trackCount: tracks.length,
        videoClipCount: videoClips.length,
        sfxClipCount: sfx.length,
        hasVoiceover: !!vo,
        hasMusic: !!music,
      });
      
      return { sfxClips: sfx, voiceoverUrl: vo, musicUrl: music };
    }, [template, videoClips.length]);

    const currentClip = videoClips[currentClipIndex];
    const currentMediaUrl = currentClip?.asset?.src as string | undefined;
    const isImage = currentClip?.asset?.type === 'image';
    const isVideo = currentClip?.asset?.type === 'video';

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

    // Update audio volumes
    useEffect(() => {
      const effectiveVolume = (trackVolume: number) => 
        isMuted ? 0 : trackVolume * volumes.master;

      const sfxVol = effectiveVolume(volumes.sfx);
      const voiceoverVol = effectiveVolume(volumes.voiceover);
      const musicVol = effectiveVolume(volumes.music);

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

      // Sync voiceover
      const voiceover = voiceoverRef.current;
      if (voiceover && voiceover.src) {
        if (Math.abs(voiceover.currentTime - time) > 0.3) {
          voiceover.currentTime = Math.min(time, voiceover.duration || time);
        }
      }

      // Sync music (loops continuously)
      const music = musicRef.current;
      if (music && music.src && music.duration) {
        const musicPosition = time % music.duration;
        if (Math.abs(music.currentTime - musicPosition) > 0.3) {
          music.currentTime = musicPosition;
        }
      }
    }, [sfxClips, isPlaying]);

    // Handle media load
    useEffect(() => {
      if (currentMediaUrl) {
        setIsLoading(true);
        setError(null);
      }
    }, [currentMediaUrl]);

    const handleLoadedData = useCallback(() => {
      setIsLoading(false);
      setError(null);
    }, []);

    const handleError = useCallback(() => {
      setError('Failed to load media');
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
        sfxRefs.current.forEach(audio => audio.pause());
        [voiceoverRef, musicRef].forEach(ref => {
          if (ref.current) ref.current.pause();
        });
      }
    }, [currentClipIndex, videoClips.length]);

    // Play/Pause all media
    const togglePlay = useCallback(() => {
      const video = videoRef.current;
      
      if (isPlaying) {
        if (video) {
          video.pause();
        }
        sfxRefs.current.forEach(audio => audio.pause());
        [voiceoverRef, musicRef].forEach(ref => {
          if (ref.current) ref.current.pause();
        });
        setIsPlaying(false);
      } else {
        const voiceoverVol = isMuted ? 0 : volumes.voiceover * volumes.master;
        const musicVol = isMuted ? 0 : volumes.music * volumes.master;
        const sfxVol = isMuted ? 0 : volumes.sfx * volumes.master;
        
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
        
        // Only try to play video if it's actually a video clip
        if (video && isVideo) {
          video.play().catch(console.error);
        }
        
        // Start voiceover and music
        if (voiceoverRef.current && voiceoverRef.current.src && voiceoverVol > 0) {
          voiceoverRef.current.play().catch(() => {});
        }
        if (musicRef.current && musicRef.current.src && musicVol > 0) {
          musicRef.current.play().catch(() => {});
        }
        setIsPlaying(true);
      }
    }, [isPlaying, isMuted, volumes, isVideo]);

    // For images: simulate video-like playback with timer
    useEffect(() => {
      if (!isImage || !isPlaying || !currentClip) {
        return;
      }
      
      const startTime = Date.now();
      const clipLength = currentClip.length || 0;
      const clipStartTime = videoClips
        .slice(0, currentClipIndex)
        .reduce((acc, clip) => acc + (clip.length || 0), 0);
      
      let frameCount = 0;
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const newTime = clipStartTime + elapsed;
        
        frameCount++;
        if (frameCount % 5 === 0) {
          setCurrentTime(newTime);
        }
        
        // Sync audio
        if (voiceoverRef.current && voiceoverRef.current.src) {
          const voAudio = voiceoverRef.current;
          if (Math.abs(voAudio.currentTime - newTime) > 0.3) {
            voAudio.currentTime = newTime;
          }
        }
        
        if (musicRef.current && musicRef.current.src) {
          const musicAudio = musicRef.current;
          if (Math.abs(musicAudio.currentTime - newTime) > 0.3) {
            musicAudio.currentTime = newTime;
          }
        }
        
        // Check if clip is finished
        if (elapsed >= clipLength) {
          clearInterval(interval);
          
          if (currentClipIndex < videoClips.length - 1) {
            setCurrentClipIndex(prev => prev + 1);
          } else {
            setIsPlaying(false);
            setCurrentClipIndex(0);
            setCurrentTime(0);
            sfxRefs.current.forEach(audio => audio.pause());
            [voiceoverRef, musicRef].forEach(ref => {
              if (ref.current) ref.current.pause();
            });
          }
        }
      }, 50);
      
      return () => {
        clearInterval(interval);
      };
    }, [isImage, isPlaying, currentClipIndex, videoClips]);

    // Auto-play next clip (for videos)
    useEffect(() => {
      const video = videoRef.current;
      if (video && isPlaying && currentMediaUrl && isVideo) {
        video.play().catch(console.error);
      }
    }, [currentClipIndex, isPlaying, currentMediaUrl, isVideo]);

    // Seek
    const handleSeek = useCallback((value: number[]) => {
      const seekTime = value[0];
      
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

    // No video/image clips
    if (videoClips.length === 0) {
      return (
        <div className={cn("flex items-center justify-center bg-black/50 rounded-xl", className)} style={{ height }}>
          <div className="flex flex-col items-center gap-3 text-center p-6">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
            <p className="text-white/60">No video or image clips found in timeline</p>
            <p className="text-xs text-white/40">Generate images or videos in the Storyboard phase first</p>
          </div>
        </div>
      );
    }

    return (
      <div className={cn("flex gap-4", className)} style={{ height }}>
        {/* Main Video Player */}
        <div className="flex-1 flex flex-col bg-black rounded-xl overflow-hidden">
          {/* 1F Mode Notice - Above video */}
          {isImage && !error && !isLoading && referenceMode === '1F' && (
            <div className="flex-shrink-0 bg-amber-500/95 text-black px-4 py-2.5 text-sm flex items-start gap-3">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Preview Mode: Static Images</p>
                <p className="text-xs text-black/80">
                  Motion effects will be applied in the final exported video.
                </p>
              </div>
            </div>
          )}
          
          {/* Video Container */}
          <div className="relative flex-1 bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <Loader2 className="w-8 h-8 text-[#FF4081] animate-spin" />
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
                    className="bg-transparent border-[#FF4081]/30 text-[#FF4081]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {isImage ? (
              <img
                src={currentMediaUrl}
                className="absolute inset-0 w-full h-full object-contain bg-black"
                onLoad={handleLoadedData}
                onError={handleError}
                onClick={togglePlay}
                alt="Preview"
              />
            ) : (
              <video
                ref={videoRef}
                src={currentMediaUrl}
                className="absolute inset-0 w-full h-full object-contain bg-black"
                onLoadedData={handleLoadedData}
                onError={handleError}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onClick={togglePlay}
                playsInline
                muted
              />
            )}

            {/* Play button overlay */}
            {!isPlaying && !isLoading && !error && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                onClick={togglePlay}
              >
                <div className="w-20 h-20 rounded-full bg-[#FF4081]/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#FF4081]/30 transition-all group-hover:scale-110">
                  <Play className="w-8 h-8 text-[#FF4081] ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
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
              <div className="absolute inset-0 bg-white/20 rounded-full" />
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FF4081] to-[#FF6B4A] rounded-full"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
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
                <span className="text-[#FF4081] font-semibold">{formatTime(currentTime)}</span>
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
            <SlidersHorizontal className="w-4 h-4 text-[#FF4081]" />
            <span className="text-sm font-medium text-white/80">Audio Mixer</span>
          </div>

          {/* Mixer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Master Volume */}
            <TrackControl
              icon={<Volume2 className="w-4 h-4" />}
              label="Master"
              color="pink"
              volume={volumes.master}
              onVolumeChange={(v) => updateVolume('master', v)}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(!isMuted)}
            />

            <div className="h-px bg-white/[0.06]" />

            {/* SFX */}
            <TrackControl
              icon={<Volume2 className="w-3.5 h-3.5" />}
              label={`SFX${sfxClips.length > 0 ? ` (${sfxClips.length})` : ' (none)'}`}
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
              color="orange"
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
              const vol = isMuted ? 0 : volumes.voiceover * volumes.master;
              (e.target as HTMLAudioElement).volume = vol;
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
              const vol = isMuted ? 0 : volumes.music * volumes.master;
              (e.target as HTMLAudioElement).volume = vol;
            }}
          />
        )}
      </div>
    );
  }
);

// Track Control Component with Character Vlog theming
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
  color: 'pink' | 'amber' | 'purple' | 'orange';
  volume: number;
  onVolumeChange: (value: number) => void;
  isMuted?: boolean;
  onMuteToggle?: () => void;
  disabled?: boolean;
}) {
  const colorClasses = {
    pink: {
      bg: 'bg-gradient-to-br from-[#FF4081] to-[#FF6B4A]',
      text: 'text-[#FF4081]',
      slider: '[&_[role=slider]]:bg-[#FF4081] [&_.bg-primary]:bg-[#FF4081]',
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
    orange: {
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      slider: '[&_[role=slider]]:bg-orange-500 [&_.bg-primary]:bg-orange-500',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={cn("space-y-2", disabled && "opacity-40")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            color === 'pink' ? classes.bg : `${classes.bg} border border-${color}-500/30`
          )}>
            <span className={color === 'pink' ? 'text-white' : classes.text}>{icon}</span>
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
