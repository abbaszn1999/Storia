import { useState, useEffect } from "react";
import { BeatDetailsSidebar } from "./beat-details-sidebar";
import { BeatCardVoiceover } from "./beat-card-voiceover";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { CheckCircle2, Mic, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BeatPromptOutput, VoiceoverScriptOutput } from "@/types/commerce";
import type { BeatStatus, BeatGenerationState } from "@/types/commerce";

interface VoiceoverTabProps {
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
  onUpdateVoiceoverScript?: (beatId: string, script: string) => Promise<void>;
  onRecommendVoiceover?: (beatId: string) => Promise<void>;
}

// Format timestamp from seconds to MM:SS
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Sample beat prompts for preview/design purposes
function getSampleBeatPrompts(): BeatPromptOutput {
  return {
    beat_prompts: [
      {
        beatId: 'beat1',
        beatName: 'The Hook',
        sora_prompt: {
          text: 'Sample prompt for beat 1 - The Hook. This is a placeholder prompt for the voiceover tab preview.'
        },
        total_duration: 12,
        audio_guidance: {
          sound_effects: {
            enabled: true,
            preset: 'subtle-mechanical',
            timing_sync: [
              { timestamp: 0.3, description: 'Light sweep whoosh' },
              { timestamp: 2.0, description: 'Mechanical rotation hum' }
            ]
          },
          music: {
            enabled: true,
            preset: 'ambient-electronic',
            mood: 'energetic',
            energy_level: 'high'
          }
        }
      },
      {
        beatId: 'beat2',
        beatName: 'The Transformation',
        sora_prompt: {
          text: 'Sample prompt for beat 2 - The Transformation. This is a placeholder prompt for the voiceover tab preview.'
        },
        total_duration: 12,
        audio_guidance: {
          sound_effects: {
            enabled: true,
            preset: 'subtle-mechanical',
            timing_sync: [
              { timestamp: 1.5, description: 'Feature reveal sound' }
            ]
          },
          music: {
            enabled: true,
            preset: 'ambient-electronic',
            mood: 'exploratory',
            energy_level: 'medium'
          }
        }
      },
      {
        beatId: 'beat3',
        beatName: 'The Payoff',
        sora_prompt: {
          text: 'Sample prompt for beat 3 - The Payoff. This is a placeholder prompt for the voiceover tab preview.'
        },
        total_duration: 12,
        audio_guidance: {
          sound_effects: {
            enabled: true,
            preset: 'subtle-mechanical',
            timing_sync: [
              { timestamp: 0.5, description: 'Final reveal sound' }
            ]
          },
          music: {
            enabled: true,
            preset: 'ambient-electronic',
            mood: 'satisfying',
            energy_level: 'high'
          }
        }
      }
    ]
  };
}

// Sample voiceover scripts for preview/design purposes
function getSampleVoiceoverScripts(): VoiceoverScriptOutput {
  return {
    beat_scripts: [
      {
        beatId: 'beat1',
        voiceoverScript: {
          enabled: true,
          language: 'en',
          tempo: 'normal',
          volume: 'medium',
          dialogue: [
            { timestamp: 0, duration: 3, line: 'Welcome to the future of innovation.', wordCount: 6, emotionalTone: 'confident', pacing: 'normal' },
            { timestamp: 3, duration: 3, line: 'This is where precision meets elegance.', wordCount: 6, emotionalTone: 'sophisticated', pacing: 'normal' },
            { timestamp: 6, duration: 3, line: 'Every detail, crafted to perfection.', wordCount: 5, emotionalTone: 'refined', pacing: 'normal' },
            { timestamp: 9, duration: 3, line: 'Experience the difference.', wordCount: 3, emotionalTone: 'inviting', pacing: 'normal' }
          ],
          totalDuration: 12,
          totalWordCount: 20,
          scriptSummary: 'Opening hook introducing the product with confidence and sophistication.'
        }
      },
      {
        beatId: 'beat2',
        voiceoverScript: {
          enabled: true,
          language: 'en',
          tempo: 'normal',
          volume: 'medium',
          dialogue: [
            { timestamp: 0, duration: 3, line: 'Designed for those who demand excellence.', wordCount: 6, emotionalTone: 'premium', pacing: 'normal' },
            { timestamp: 3, duration: 3, line: 'Built with cutting-edge technology.', wordCount: 5, emotionalTone: 'innovative', pacing: 'normal' },
            { timestamp: 6, duration: 3, line: 'Engineered for performance.', wordCount: 3, emotionalTone: 'powerful', pacing: 'normal' },
            { timestamp: 9, duration: 3, line: 'This is more than a product.', wordCount: 5, emotionalTone: 'meaningful', pacing: 'normal' }
          ],
          totalDuration: 12,
          totalWordCount: 19,
          scriptSummary: 'Transformation beat highlighting product features and engineering excellence.'
        }
      },
      {
        beatId: 'beat3',
        voiceoverScript: {
          enabled: true,
          language: 'en',
          tempo: 'normal',
          volume: 'medium',
          dialogue: [
            { timestamp: 0, duration: 3, line: 'Join thousands of satisfied customers.', wordCount: 5, emotionalTone: 'trustworthy', pacing: 'normal' },
            { timestamp: 3, duration: 3, line: 'Transform your experience today.', wordCount: 4, emotionalTone: 'empowering', pacing: 'normal' },
            { timestamp: 6, duration: 3, line: 'The future is here.', wordCount: 4, emotionalTone: 'forward-looking', pacing: 'normal' },
            { timestamp: 9, duration: 3, line: 'Make it yours.', wordCount: 3, emotionalTone: 'inviting', pacing: 'normal' }
          ],
          totalDuration: 12,
          totalWordCount: 16,
          scriptSummary: 'Payoff beat with call-to-action and customer trust messaging.'
        }
      }
    ],
    fullScript: {
      text: 'Welcome to the future of innovation. This is where precision meets elegance. Every detail, crafted to perfection. Experience the difference. Designed for those who demand excellence. Built with cutting-edge technology. Engineered for performance. This is more than a product. Join thousands of satisfied customers. Transform your experience today. The future is here. Make it yours.',
      totalDuration: 36,
      totalWordCount: 55
    }
  };
}

export function VoiceoverTab({
  videoId,
  beatPrompts,
  voiceoverScripts,
  beatVideos = {},
  voiceOverEnabled = false,
  language = 'en',
  heroImageUrl,
  onUpdateVoiceoverScript,
  onRecommendVoiceover,
}: VoiceoverTabProps) {
  // Debug: Log function call FIRST - even before useState
  console.log('[VoiceoverTab] FUNCTION CALLED - Component is rendering!', {
    videoId,
    hasBeatPrompts: !!beatPrompts,
    hasVoiceoverScripts: !!voiceoverScripts,
    voiceOverEnabled,
    beatPromptsKeys: beatPrompts ? Object.keys(beatPrompts) : [],
  });

  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<BeatGenerationState>({});
  const { toast } = useToast();

  // Always use sample data if real data is not available
  const displayBeatPrompts = beatPrompts || getSampleBeatPrompts();
  const displayVoiceoverScripts = voiceoverScripts || getSampleVoiceoverScripts();
  const beats = displayBeatPrompts.beat_prompts || [];

  // Debug: Log data after processing
  console.log('[VoiceoverTab] Data processed', {
    hasDisplayBeatPrompts: !!displayBeatPrompts,
    beatsCount: beats.length,
    beats: beats.map(b => ({ beatId: b.beatId, beatName: b.beatName })),
    hasDisplayVoiceoverScripts: !!displayVoiceoverScripts,
    voiceoverScriptsCount: displayVoiceoverScripts?.beat_scripts?.length || 0,
  });

  // Debug logging
  useEffect(() => {
    console.log('[VoiceoverTab] Data check:', {
      hasBeatPrompts: !!beatPrompts,
      hasDisplayBeatPrompts: !!displayBeatPrompts,
      beatsCount: beats.length,
      beats: beats.map(b => ({ beatId: b.beatId, beatName: b.beatName })),
      hasDisplayVoiceoverScripts: !!displayVoiceoverScripts,
      voiceoverScriptsCount: displayVoiceoverScripts?.beat_scripts?.length || 0,
    });
  }, [beatPrompts, displayBeatPrompts, beats, displayVoiceoverScripts]);

  // Load generation state from beatVideos prop and database
  useEffect(() => {
    const loadGenerationState = async () => {
      try {
        // First, use beatVideos prop if available
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
          return;
        }

        // Otherwise, load from database
        if (videoId && videoId !== 'new') {
          const response = await fetch(`/api/social-commerce/videos/${videoId}`, {
            credentials: 'include',
          });
          if (response.ok) {
            const video = await response.json();
            const step3Data = video.step3Data;
            const step5Data = video.step5Data;
            const videos = step3Data?.beatVideos || step5Data?.beatVideos;
            
            if (videos) {
              const state: BeatGenerationState = {};
              Object.entries(videos).forEach(([beatId, data]: [string, any]) => {
                state[beatId] = {
                  status: 'completed',
                  videoUrl: data.videoUrl,
                  lastFrameUrl: data.lastFrameUrl,
                };
              });
              setGenerationState(state);
            }
          }
        }
      } catch (error) {
        console.error('[VoiceoverTab] Failed to load generation state:', error);
      }
    };

    loadGenerationState();
  }, [videoId, beatVideos]);

  // Listen for status updates from polling (if videos are being generated)
  useEffect(() => {
    const handleStatusUpdate = (event: CustomEvent) => {
      const { beatId, status, videoUrl, lastFrameUrl, error } = event.detail;
      setGenerationState(prev => ({
        ...prev,
        [beatId]: {
          ...prev[beatId],
          status,
          videoUrl,
          lastFrameUrl,
          error,
        },
      }));
    };

    window.addEventListener('beat-status-updated', handleStatusUpdate as EventListener);
    return () => {
      window.removeEventListener('beat-status-updated', handleStatusUpdate as EventListener);
    };
  }, []);

  // Initialize selected beat to first beat if available
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

  // Get voiceover script for a beat from voiceoverScripts (use displayVoiceoverScripts which includes sample data)
  const getBeatVoiceoverScript = (beatId: string): string => {
    const beatScript = displayVoiceoverScripts?.beat_scripts?.find(s => s.beatId === beatId);
    if (beatScript?.voiceoverScript?.dialogue) {
      // Format dialogue array into readable script
      return beatScript.voiceoverScript.dialogue
        .map(d => `[${formatTimestamp(d.timestamp)}-${formatTimestamp(d.timestamp + d.duration)}] "${d.line}"`)
        .join('\n');
    }
    // Return empty string if no script found
    return '';
  };

  const allBeatsCompleted = beats.length > 0 && beats.every(beat => {
    const status = getBeatStatus(beat.beatId);
    return status === 'completed';
  });

  const completedCount = beats.filter(b => getBeatStatus(b.beatId) === 'completed').length;
  const progressPercentage = beats.length > 0 ? (completedCount / beats.length) * 100 : 0;

  // Always show content with sample data - we always have sample data as fallback
  // If beats is still empty (shouldn't happen), show a fallback message
  if (beats.length === 0) {
    console.error('[VoiceoverTab] ERROR: beats array is empty even with sample data fallback!', {
      beatPrompts,
      displayBeatPrompts,
      sampleData: getSampleBeatPrompts(),
    });
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-background via-background to-muted/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
            <Mic className="h-10 w-10 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">No beats available</p>
            <p className="text-sm text-muted-foreground">
              Please check the browser console for debugging information
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-background via-background to-muted/5">
      {/* Sticky Header with Progress */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Mic className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Voiceover</h1>
                  <p className="text-xs text-muted-foreground">
                    {beats.length} beat{beats.length !== 1 ? 's' : ''} • {beats[0]?.total_duration || 12}s each
                  </p>
                </div>
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={cn(
                    "h-4 w-4",
                    allBeatsCompleted ? "text-green-500" : "text-muted-foreground"
                  )} />
                  <span className="text-sm font-medium">
                    {completedCount} / {beats.length} completed
                  </span>
                </div>
                <div className="w-32">
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-background/50 via-background/30 to-muted/5">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-8">
            {beats.map((beat) => {
              const beatStatus = getBeatStatus(beat.beatId);
              const voiceoverScript = getBeatVoiceoverScript(beat.beatId);
              
              return (
                <Card key={beat.beatId} className="bg-white/[0.02] border-white/[0.06]">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Left: Beat Details (w-72) */}
                      <div className="w-72 shrink-0">
                        <BeatDetailsSidebar
                          beat={beat}
                          status={beatStatus}
                          generationState={generationState}
                          onGenerate={undefined} // No generate button in voiceover tab
                          onRegenerate={undefined} // No regenerate button in voiceover tab
                        />
                      </div>

                      {/* Right: Voiceover Card for this Beat */}
                      <div className="flex-1">
                        <BeatCardVoiceover
                          beat={beat}
                          status={beatStatus}
                          heroImageUrl={heroImageUrl}
                          isSelected={selectedBeatId === beat.beatId}
                          onSelect={() => setSelectedBeatId(beat.beatId)}
                          onGenerate={undefined} // No generate button in voiceover tab
                          videoUrl={generationState[beat.beatId]?.videoUrl}
                          onRegenerate={undefined} // No regenerate button in voiceover tab
                          voiceoverScript={voiceoverScript}
                          onUpdateVoiceoverScript={onUpdateVoiceoverScript}
                          onRecommendVoiceover={onRecommendVoiceover}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
