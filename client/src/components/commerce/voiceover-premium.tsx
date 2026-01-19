import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause,
  Mic,
  CheckCircle2, 
  Loader2, 
  Lock, 
  Clock,
  Sparkles,
  FileText,
  Volume2,
  RefreshCw,
  Film
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { VOICE_LIBRARY } from "@/constants/voice-library";
import type { BeatPromptOutput, VoiceoverScriptOutput, BeatPrompt } from "@/types/commerce";
import type { BeatStatus, BeatGenerationState } from "@/types/commerce";

interface VoiceoverAudioData {
  audioUrl: string;
  generatedAt?: Date;
  voiceId?: string;
  duration?: number;
}

interface VoiceoverPremiumProps {
  videoId: string;
  beatPrompts?: BeatPromptOutput;
  voiceoverScripts?: VoiceoverScriptOutput;
  beatVideos?: {
    [beatId: string]: {
      videoUrl?: string;
      lastFrameUrl?: string;
      generatedAt?: Date;
    };
  };
  voiceOverEnabled: boolean;
  language?: 'ar' | 'en';
  heroImageUrl?: string;
  voiceActorId?: string | null;
  voiceoverAudios?: {
    [beatId: string]: VoiceoverAudioData;
  };
  onVoiceActorChange?: (voiceId: string | null) => Promise<void>;
  onUpdateVoiceoverScript?: (beatId: string, script: string) => Promise<void>;
  onRecommendVoiceover?: (beatId: string) => Promise<void>;
  onRegenerateVoiceover?: () => Promise<void>;
  onVoiceoverAudioGenerated?: (beatId: string, audioData: VoiceoverAudioData) => void;
}

// Audio waveform visualization component
function AudioWaveform({ isPlaying }: { isPlaying: boolean }) {
  const bars = 20;
  return (
    <div className="flex items-end justify-center gap-[2px] h-10">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-emerald-500 to-teal-400"
          initial={{ height: 4 }}
          animate={isPlaying ? {
            height: [4, 16 + Math.random() * 20, 8, 28 + Math.random() * 8, 4],
          } : { height: 4 + (i % 4) * 4 }}
          transition={isPlaying ? {
            duration: 0.4 + Math.random() * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.03,
          } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
}

// Single Beat Voiceover Card - Simplified Design
function VoiceoverCard({
  beat,
  beatIndex,
  totalBeats,
  status,
  videoUrl,
  voiceoverScript,
  voiceoverAudio,
  videoId,
  voiceActorId,
  onUpdateVoiceoverScript,
  onVoiceoverAudioGenerated,
}: {
  beat: BeatPrompt;
  beatIndex: number;
  totalBeats: number;
  status: BeatStatus;
  videoUrl?: string;
  voiceoverScript: string;
  voiceoverAudio?: VoiceoverAudioData | null;
  videoId: string;
  voiceActorId?: string | null;
  onUpdateVoiceoverScript?: (beatId: string, script: string) => Promise<void>;
  onVoiceoverAudioGenerated?: (beatId: string, audioData: VoiceoverAudioData) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [editedScript, setEditedScript] = useState(voiceoverScript);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const hasVideo = isCompleted && videoUrl;
  const hasAudio = !!voiceoverAudio?.audioUrl;

  useEffect(() => {
    setEditedScript(voiceoverScript);
    setHasUnsavedChanges(false);
  }, [voiceoverScript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const getElevenLabsVoiceId = () => {
    const selectedVoice = voiceActorId 
      ? VOICE_LIBRARY.find(v => v.id === voiceActorId) 
      : null;
    return selectedVoice?.elevenLabsVoiceId || undefined;
  };

  // Auto-save script after 1.5s of inactivity
  const handleScriptChange = (newScript: string) => {
    setEditedScript(newScript);
    setHasUnsavedChanges(newScript.trim() !== voiceoverScript.trim());
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Auto-save after 1.5s
    if (newScript.trim() !== voiceoverScript.trim() && onUpdateVoiceoverScript) {
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await onUpdateVoiceoverScript(beat.beatId, newScript);
          setHasUnsavedChanges(false);
        } catch (error) {
          toast({ title: "Error", description: "Failed to save script", variant: "destructive" });
        } finally {
          setIsSaving(false);
        }
      }, 1500);
    }
  };

  const handleGenerateAudio = async (forceRegenerate: boolean = false) => {
    // Use the current edited script (not the original)
    const scriptToUse = editedScript.trim();
    
    if (!scriptToUse || scriptToUse.length === 0) {
      toast({ title: "No Script", description: "Please add a voiceover script first", variant: "destructive" });
      return;
    }

    // Save script first if there are unsaved changes
    if (hasUnsavedChanges && onUpdateVoiceoverScript) {
      try {
        await onUpdateVoiceoverScript(beat.beatId, scriptToUse);
        setHasUnsavedChanges(false);
      } catch (error) {
        toast({ title: "Error", description: "Failed to save script before generating audio", variant: "destructive" });
        return;
      }
    }

    setIsGeneratingAudio(true);
    try {
      const elevenLabsVoiceId = getElevenLabsVoiceId();
      
      // Use /regenerate endpoint if audio already exists OR forceRegenerate is true
      const endpoint = (hasAudio || forceRegenerate) 
        ? '/api/social-commerce/voiceover/regenerate'
        : '/api/social-commerce/voiceover/generate';
      
      console.log('[VoiceoverCard] Calling endpoint:', endpoint, { hasAudio, forceRegenerate, scriptToUse: scriptToUse.substring(0, 50) + '...' });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          beatId: beat.beatId,
          text: scriptToUse, // Use the edited script
          voiceId: elevenLabsVoiceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate voiceover');
      }

      const data = await response.json();
      
      const isRegenerated = data.regenerated || forceRegenerate || hasAudio;
      toast({ 
        title: isRegenerated ? "Audio Regenerated" : "Audio Generated", 
        description: isRegenerated ? "Voiceover regenerated with new script" : "Voiceover audio generated successfully"
      });

      if (onVoiceoverAudioGenerated) {
        onVoiceoverAudioGenerated(beat.beatId, {
          audioUrl: data.audioUrl,
          duration: data.duration,
          generatedAt: new Date(),
          voiceId: elevenLabsVoiceId,
        });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to generate voiceover", variant: "destructive" });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlayAudio = () => {
    if (!voiceoverAudio?.audioUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(voiceoverAudio.audioUrl);
    audioRef.current = audio;

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = true;
    }

    audio.onended = () => {
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
    };

    audio.onerror = () => {
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
      toast({ title: "Playback Error", description: "Failed to play audio", variant: "destructive" });
    };

    audio.play().then(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }).catch(() => {
      toast({ title: "Playback Error", description: "Failed to play audio", variant: "destructive" });
    });

    setIsPlaying(true);
  };

  // Gradient based on beat index
  const gradients = [
    'from-emerald-600/20 via-teal-600/10 to-transparent',
    'from-teal-600/20 via-emerald-600/10 to-transparent', 
    'from-emerald-500/20 via-teal-500/10 to-transparent',
  ];
  
  const borderGradients = [
    'from-emerald-500/50 via-teal-500/30 to-emerald-500/10',
    'from-teal-500/50 via-emerald-500/30 to-teal-500/10',
    'from-emerald-400/50 via-teal-400/30 to-emerald-400/10',
  ];

  const accentColors = [
    { primary: 'text-emerald-400', secondary: 'text-teal-400', bg: 'from-emerald-600 to-teal-600' },
    { primary: 'text-teal-400', secondary: 'text-emerald-400', bg: 'from-teal-600 to-emerald-600' },
    { primary: 'text-emerald-300', secondary: 'text-teal-300', bg: 'from-emerald-600 to-teal-600' },
  ];

  const gradient = gradients[(beatIndex - 1) % 3];
  const borderGradient = borderGradients[(beatIndex - 1) % 3];
  const accent = accentColors[(beatIndex - 1) % 3];

  const wordCount = editedScript.split(' ').filter(w => w.length > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: beatIndex * 0.1 }}
      className={cn("relative group", isLocked && "pointer-events-none")}
    >
      <div className={cn(
        "relative rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-zinc-950/90",
        "backdrop-blur-xl transition-all duration-500",
        isLocked && "opacity-50 grayscale-[30%]"
      )}>
        {/* Animated gradient border */}
        <div className={cn(
          "absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br",
          borderGradient,
          "opacity-60 group-hover:opacity-100 transition-opacity duration-500"
        )}>
          <div className="w-full h-full rounded-2xl bg-zinc-900/95" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className={cn("relative px-5 py-5 bg-gradient-to-br", gradient)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl",
                  "bg-gradient-to-br from-white/15 to-white/5 border border-white/10",
                  "font-bold text-xl", accent.primary
                )}>
                  {beatIndex}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">{beat.beatName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-xs text-white/50">{beat.total_duration}s</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSaving && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Saving...
                  </Badge>
                )}
                {hasAudio && !isSaving && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Audio Ready
                  </Badge>
                )}
              </div>
            </div>

            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="text-center">
                  <Lock className="h-10 w-10 text-zinc-500 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400 font-medium">Beat {beatIndex} of {totalBeats}</p>
                </div>
              </div>
            )}
          </div>

          {/* Video Area */}
          <div className="relative aspect-video bg-black/50 overflow-hidden">
            {hasVideo ? (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                controls
                playsInline
                preload="metadata"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-3 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                    <Film className={cn("h-8 w-8", accent.primary)} />
                  </div>
                  <p className="text-sm text-white/50">Video not ready</p>
                </div>
              </div>
            )}
          </div>

          {/* Script Section - Direct Edit */}
          {!isLocked && (
            <div className="p-5 space-y-4">
              {/* Script Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className={cn("h-4 w-4", accent.primary)} />
                  <span className="text-sm font-semibold text-white">Script</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{editedScript.length} chars</span>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="text-[10px] py-0 h-5 bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                      Unsaved
                    </Badge>
                  )}
                </div>
              </div>

              {/* Editable Script Textarea */}
              <Textarea
                value={editedScript}
                onChange={(e) => handleScriptChange(e.target.value)}
                className={cn(
                  "min-h-[120px] text-sm bg-white/5 border-white/10 text-white/90 resize-none",
                  "focus:border-emerald-500/50 placeholder:text-white/30",
                  beatIndex === 1 ? "focus:border-emerald-500/50" : beatIndex === 2 ? "focus:border-teal-500/50" : "focus:border-emerald-500/50"
                )}
                placeholder="Enter voiceover script..."
              />

              {/* Audio Section */}
              <div className="pt-2 border-t border-white/5">
                {hasAudio ? (
                  <div className="space-y-3">
                    {/* Waveform */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <AudioWaveform isPlaying={isPlaying} />
                    </div>
                    
                    {/* Play & Regenerate Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePlayAudio}
                        className={cn(
                          "flex-1 h-11 text-sm font-medium",
                          isPlaying 
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" 
                            : "bg-white/5 border-white/10 hover:bg-emerald-500/20"
                        )}
                      >
                        {isPlaying ? (
                          <><Pause className="h-4 w-4 mr-2" /> Stop</>
                        ) : (
                          <><Play className="h-4 w-4 mr-2" /> Play with Video</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateAudio(true)}
                        disabled={isGeneratingAudio || !editedScript.trim()}
                        className={cn(
                          "h-11 px-4 text-sm font-medium",
                          "bg-gradient-to-r text-white border-0",
                          accent.bg,
                          "hover:opacity-90 disabled:opacity-50"
                        )}
                      >
                        {isGeneratingAudio ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><RefreshCw className="h-4 w-4 mr-2" /> Regenerate</>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateAudio(false)}
                    disabled={isGeneratingAudio || !editedScript.trim()}
                    className={cn(
                      "w-full h-12 text-sm font-semibold",
                      "bg-gradient-to-r text-white border-0",
                      accent.bg,
                      "hover:opacity-90 disabled:opacity-50"
                    )}
                  >
                    {isGeneratingAudio ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Audio...</>
                    ) : (
                      <><Volume2 className="h-4 w-4 mr-2" /> Generate Audio</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Main Voiceover Premium Tab
export function VoiceoverPremium({
  videoId,
  beatPrompts,
  voiceoverScripts,
  beatVideos = {},
  voiceOverEnabled = false,
  language = 'en',
  heroImageUrl,
  voiceActorId,
  voiceoverAudios = {},
  onVoiceActorChange,
  onUpdateVoiceoverScript,
  onRecommendVoiceover,
  onRegenerateVoiceover,
  onVoiceoverAudioGenerated,
}: VoiceoverPremiumProps) {
  const [generationState, setGenerationState] = useState<BeatGenerationState>({});
  const [localVoiceoverAudios, setLocalVoiceoverAudios] = useState<{ [beatId: string]: VoiceoverAudioData }>(voiceoverAudios);

  useEffect(() => {
    setLocalVoiceoverAudios(voiceoverAudios);
  }, [voiceoverAudios]);

  useEffect(() => {
    if (beatVideos && Object.keys(beatVideos).length > 0) {
      const state: BeatGenerationState = {};
      Object.entries(beatVideos).forEach(([beatId, data]) => {
        state[beatId] = { status: 'completed', videoUrl: data.videoUrl, lastFrameUrl: data.lastFrameUrl };
      });
      setGenerationState(state);
    }
  }, [beatVideos]);

  const handleVoiceoverAudioGenerated = (beatId: string, audioData: VoiceoverAudioData) => {
    setLocalVoiceoverAudios(prev => ({ ...prev, [beatId]: audioData }));
    if (onVoiceoverAudioGenerated) onVoiceoverAudioGenerated(beatId, audioData);
  };

  const displayBeatPrompts = beatPrompts || { beat_prompts: [] };
  const displayVoiceoverScripts = voiceoverScripts || { beat_scripts: [] };
  const beats = displayBeatPrompts.beat_prompts || [];

  const getBeatStatus = (beatId: string): BeatStatus => {
    const state = generationState[beatId];
    if (state) return state.status;
    return 'pending';
  };

  const getBeatVoiceoverScript = (beatId: string): string => {
    const beatScript = displayVoiceoverScripts?.beat_scripts?.find(s => s.beatId === beatId);
    return beatScript?.voiceoverScript?.script || '';
  };

  const completedAudioCount = beats.filter(b => localVoiceoverAudios[b.beatId]?.audioUrl).length;
  const progressPercentage = beats.length > 0 ? (completedAudioCount / beats.length) * 100 : 0;

  // Generate placeholder beats
  const displayBeats = [...beats];
  while (displayBeats.length < 3) {
    displayBeats.push({
      beatId: `placeholder-${displayBeats.length + 1}`,
      beatName: `Beat ${displayBeats.length + 1}`,
      total_duration: 12,
      sora_prompt: { text: '' },
    } as any);
  }

  if (beats.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20"
          >
            <Mic className="h-12 w-12 text-emerald-400" />
          </motion.div>
          <div>
            <p className="text-xl font-bold text-white mb-2">No Beats Available</p>
            <p className="text-sm text-white/50 max-w-xs mx-auto">Generate beat prompts in the Storyboard step first</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-zinc-950 via-zinc-900/95 to-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20">
                  <Mic className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Voiceover</h1>
                  <p className="text-xs text-white/50">{beats.length} beats • {beats[0]?.total_duration || 12}s each</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {completedAudioCount} / {beats.length} Audio
                </Badge>
                <div className="w-32">
                  <Progress value={progressPercentage} className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="h-[calc(100%-88px)] overflow-auto">
        <div className="px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
            <AnimatePresence mode="popLayout">
              {displayBeats.slice(0, 3).map((beat, index) => {
                const isPlaceholder = beat.beatId.startsWith('placeholder');
                const actualBeat = isPlaceholder ? null : beats.find(b => b.beatId === beat.beatId);
                
                if (isPlaceholder || !actualBeat) {
                  return (
                    <motion.div
                      key={beat.beatId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative rounded-2xl overflow-hidden bg-zinc-900/50 border border-white/5 opacity-40"
                    >
                      <div className="px-5 py-5 bg-gradient-to-br from-zinc-800/30 to-transparent">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-500 font-bold text-xl">{index + 1}</div>
                          <div>
                            <h3 className="text-base font-medium text-zinc-500">Beat {index + 1}</h3>
                            <p className="text-xs text-zinc-600">12s duration</p>
                          </div>
                        </div>
                      </div>
                      <div className="aspect-video bg-zinc-900/50" />
                      <div className="h-12 border-t border-white/5" />
                      <div className="p-5"><div className="h-24 rounded-xl bg-zinc-800/30" /></div>
                    </motion.div>
                  );
                }

                return (
                  <VoiceoverCard
                    key={actualBeat.beatId}
                    beat={actualBeat}
                    beatIndex={index + 1}
                    totalBeats={beats.length}
                    status={getBeatStatus(actualBeat.beatId)}
                    videoUrl={generationState[actualBeat.beatId]?.videoUrl}
                    voiceoverScript={getBeatVoiceoverScript(actualBeat.beatId)}
                    voiceoverAudio={localVoiceoverAudios[actualBeat.beatId]}
                    videoId={videoId}
                    voiceActorId={voiceActorId}
                    onUpdateVoiceoverScript={onUpdateVoiceoverScript}
                    onVoiceoverAudioGenerated={handleVoiceoverAudioGenerated}
                  />
                );
              })}
            </AnimatePresence>
          </div>

          {beats.length > 3 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {beats.slice(3).map((beat, index) => (
                <VoiceoverCard
                  key={beat.beatId}
                  beat={beat}
                  beatIndex={index + 4}
                  totalBeats={beats.length}
                  status={getBeatStatus(beat.beatId)}
                  videoUrl={generationState[beat.beatId]?.videoUrl}
                  voiceoverScript={getBeatVoiceoverScript(beat.beatId)}
                  voiceoverAudio={localVoiceoverAudios[beat.beatId]}
                  videoId={videoId}
                  voiceActorId={voiceActorId}
                  onUpdateVoiceoverScript={onUpdateVoiceoverScript}
                  onVoiceoverAudioGenerated={handleVoiceoverAudioGenerated}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
