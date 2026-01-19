import { useState, useEffect } from "react";
import { BeatCardPremium } from "./beat-card-premium";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Clapperboard, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Film
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BeatPromptOutput, VoiceoverScriptOutput } from "@/types/commerce";
import type { BeatStatus, BeatGenerationState } from "@/types/commerce";

interface BeatStoryboardPremiumProps {
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
  heroImageUrl?: string;
  onBeatGenerate?: (beatId: string) => Promise<any>;
  onBeatRegenerate?: () => void;
  onPromptUpdate?: (beatId: string, newPrompt: string) => Promise<void>;
}

export function BeatStoryboardPremium({
  videoId,
  beatPrompts,
  voiceoverScripts,
  beatVideos = {},
  heroImageUrl,
  onBeatGenerate,
  onBeatRegenerate,
  onPromptUpdate,
}: BeatStoryboardPremiumProps) {
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<BeatGenerationState>({});

  const beats = beatPrompts?.beat_prompts || [];
  const totalBeats = Math.max(beats.length, 3); // Always show at least 3 slots

  // Initialize generation state from beatVideos
  useEffect(() => {
    if (beatVideos && Object.keys(beatVideos).length > 0) {
      const state: BeatGenerationState = {};
      Object.entries(beatVideos).forEach(([beatId, data]) => {
        state[beatId] = {
          status: 'completed',
          videoUrl: data.videoUrl,
          lastFrameUrl: data.lastFrameUrl,
        };
      });
      setGenerationState(state);
    }
  }, [beatVideos]);

  // Auto-select first beat if none selected
  useEffect(() => {
    if (beats.length > 0 && !selectedBeatId) {
      setSelectedBeatId(beats[0].beatId);
    }
  }, [beats, selectedBeatId]);

  const getBeatStatus = (beatId: string): BeatStatus => {
    const state = generationState[beatId];
    if (state) return state.status;
    return 'pending';
  };

  const handleGenerate = async (beatId: string) => {
    if (!onBeatGenerate) return;

    setGenerationState(prev => ({
      ...prev,
      [beatId]: { status: 'generating' },
    }));

    try {
      const result = await onBeatGenerate(beatId);
      
      if (result?.videoUrl) {
        setGenerationState(prev => ({
          ...prev,
          [beatId]: {
            status: 'completed',
            videoUrl: result.videoUrl,
            lastFrameUrl: result.lastFrameUrl,
          },
        }));
      } else {
        // Poll for status if no immediate result
        const pollInterval = setInterval(async () => {
          try {
            const response = await fetch(`/api/social-commerce/videos/${videoId}/beats/${beatId}/status`, {
              credentials: 'include',
            });
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'completed' || data.status === 'failed') {
                clearInterval(pollInterval);
                setGenerationState(prev => ({
                  ...prev,
                  [beatId]: {
                    status: data.status,
                    videoUrl: data.videoUrl,
                    lastFrameUrl: data.lastFrameUrl,
                    error: data.error,
                  },
                }));
              }
            }
          } catch (error) {
            console.error('[BeatStoryboard] Polling error:', error);
          }
        }, 3000);

        // Clear after 10 minutes
        setTimeout(() => clearInterval(pollInterval), 10 * 60 * 1000);
      }
    } catch (error) {
      setGenerationState(prev => ({
        ...prev,
        [beatId]: { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' },
      }));
    }
  };

  const completedCount = beats.filter(b => getBeatStatus(b.beatId) === 'completed').length;
  const progressPercentage = beats.length > 0 ? (completedCount / beats.length) * 100 : 0;
  const allCompleted = beats.length > 0 && completedCount === beats.length;

  // Generate placeholder beats if needed
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
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20"
          >
            <Clapperboard className="h-12 w-12 text-emerald-400" />
          </motion.div>
          <div>
            <p className="text-xl font-bold text-white mb-2">No Beats Available</p>
            <p className="text-sm text-white/50 max-w-xs mx-auto">
              Generate beat prompts from the Script tab to start creating your video scenes
            </p>
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
            {/* Left: Title & Info */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20">
                  <Film className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Beat Storyboard</h1>
                  <p className="text-xs text-white/50">
                    {beats.length} beats • {beats[0]?.total_duration || 12}s each
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Progress */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {allCompleted ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      All Complete
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {completedCount} / {beats.length}
                    </Badge>
                  )}
                </div>
                <div className="w-32">
                  <Progress 
                    value={progressPercentage} 
                    className="h-2 bg-white/10"
                  />
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
                  // Locked placeholder card
                  return (
                    <motion.div
                      key={beat.beatId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      <div className="relative rounded-2xl overflow-hidden bg-zinc-900/50 border border-white/5 opacity-40">
                        <div className="px-5 py-4 bg-gradient-to-br from-zinc-800/30 to-transparent">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-500 font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-zinc-500">Beat {index + 1}</h3>
                              <p className="text-[11px] text-zinc-600">12s duration</p>
                            </div>
                          </div>
                        </div>
                        <div className="aspect-video bg-zinc-900/50 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-xl bg-zinc-800/30 mx-auto mb-2 flex items-center justify-center">
                              <Zap className="h-5 w-5 text-zinc-600" />
                            </div>
                            <p className="text-xs text-zinc-600">Not yet generated</p>
                          </div>
                        </div>
                        <div className="h-10 border-t border-white/5" />
                        <div className="p-4 pt-0">
                          <div className="h-11 rounded-xl bg-zinc-800/30" />
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <BeatCardPremium
                    key={actualBeat.beatId}
                    beat={actualBeat}
                    beatIndex={index + 1}
                    totalBeats={beats.length}
                    status={getBeatStatus(actualBeat.beatId)}
                    heroImageUrl={heroImageUrl}
                    isSelected={selectedBeatId === actualBeat.beatId}
                    onSelect={() => setSelectedBeatId(actualBeat.beatId)}
                    onGenerate={onBeatGenerate ? () => handleGenerate(actualBeat.beatId) : undefined}
                    onPromptUpdate={onPromptUpdate}
                    videoUrl={generationState[actualBeat.beatId]?.videoUrl}
                  />
                );
              })}
            </AnimatePresence>
          </div>

          {/* Additional beats if more than 3 */}
          {beats.length > 3 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {beats.slice(3).map((beat, index) => (
                <BeatCardPremium
                  key={beat.beatId}
                  beat={beat}
                  beatIndex={index + 4}
                  totalBeats={beats.length}
                  status={getBeatStatus(beat.beatId)}
                  heroImageUrl={heroImageUrl}
                  isSelected={selectedBeatId === beat.beatId}
                  onSelect={() => setSelectedBeatId(beat.beatId)}
                  onGenerate={onBeatGenerate ? () => handleGenerate(beat.beatId) : undefined}
                  onPromptUpdate={onPromptUpdate}
                  videoUrl={generationState[beat.beatId]?.videoUrl}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
