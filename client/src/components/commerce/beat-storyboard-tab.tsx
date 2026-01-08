import { useState, useEffect } from "react";
import { BeatDetailsSidebar } from "./beat-details-sidebar";
import { BeatCardStoryboard } from "./beat-card-storyboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Sparkles, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BeatPromptOutput, VoiceoverScriptOutput } from "@/types/commerce";
import type { BeatStatus, BeatGenerationState } from "@/types/commerce";

// Sample data for preview/design purposes
function getSampleBeatPrompts(): BeatPromptOutput {
  return {
    beat_prompts: [
      {
        beatId: 'beat1',
        beatName: 'The Ignition',
        isConnectedToPrevious: false,
        sora_prompt: {
          text: `═══════════════════════════════════════════════════════════════════════════════
EXCLUSIONS (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════
NO TEXT. NO WATERMARK. NO READABLE LOGOS/TRADEMARKS. NO BRAND MARKS ON PRODUCT OR CLOTHING. NO DEAD MOMENTS: every beat must include camera motion + visible action.

NEGATIVE INSTRUCTIONS (DO NOT):
- DO NOT warp, smear, redraw, or stylize the product
- DO NOT add random extra parts or elements
- DO NOT create unrealistic physics or impossible motion
- DO NOT use excessive motion blur (use "tasteful motion blur" only)
- DO NOT create distortion before transitions (seamless transitions only)

═══════════════════════════════════════════════════════════════════════════════
REFERENCE IMAGE LOCK (CRITICAL — MUST FOLLOW)
═══════════════════════════════════════════════════════════════════════════════
Use the provided hero product image as the exact identity anchor. Keep the SAME:
- Product proportions: Sleek rectangular form, 2:1 aspect ratio
- Material finish: Brushed aluminum with matte texture
- Color accuracy: Silver-gray (#C0C0C0) with subtle blue undertones
- Surface texture: Fine horizontal grain, consistent across all surfaces
- Logo placement: None (unbranded product)

CONSISTENCY ANCHORS:
- Maintain exact product geometry throughout all camera movements
- Preserve material reflectivity and surface detail
- Keep lighting response consistent with aluminum properties

═══════════════════════════════════════════════════════════════════════════════
PHYSICS & MATERIAL RULES (must be believable)
═══════════════════════════════════════════════════════════════════════════════
PRODUCT PHYSICS:
- Material: Brushed aluminum, medium mass (objectMass: 65/100)
- Motion: Gravity-driven with realistic inertia
- Surface interaction: Light reflects smoothly, no warping
- Mass behavior: Moderate weight, smooth rotation, natural deceleration

ENVIRONMENT PHYSICS:
- Atmospheric effects: Clean studio air, minimal particles
- Particle behavior: Realistic dust motes in light beams
- Lighting response: Aluminum reflects cool-toned light sources

VISUAL METAPHOR INTEGRATION:
- Origin Metaphor: "Precision Engineered" — embodies mechanical precision and industrial elegance
- Metaphor Elements: Clean lines, geometric precision, structured movement

═══════════════════════════════════════════════════════════════════════════════
TIMELINE (8.0 seconds total — continuous motion, high energy)
═══════════════════════════════════════════════════════════════════════════════
NARRATIVE CONTEXT:
- Beat Position: beat1 — Hook/Opening moment
- Story Momentum: Establishes product presence with dynamic energy
- Emotional Arc: Confidence and precision

[0.0-0.3] "EXTREME MACRO HOOK" — "Product edge glints in dramatic light"
Emotional Tone: Raw intensity, confident
Composition: Extreme close-up on product edge, rule of thirds
Camera: Slow push-in with micro drift, premium stabilization
Action: Light sweeps across brushed aluminum surface, revealing texture detail
Sound Sync: Subtle whoosh as light passes
Transition: Smooth fade to wider view

[0.3-2.0] "THE REVEAL" — "Product rotates into frame with cinematic grace"
Emotional Tone: Regal, elegant
Composition: Medium shot, product centered
Camera: Orbital rotation around product, 180-degree arc, smooth deceleration
Action: Product rotates on axis, catching light from multiple angles
Sound Sync: Low mechanical hum
Transition: Seamless continuation

[2.0-4.5] "FEATURE FOCUS" — "Hero feature highlighted in dramatic lighting"
Emotional Tone: Contemplative, focused
Composition: Close-up on primary feature
Camera: Slow zoom-in with shallow depth of field
Action: Focus shifts to key product feature, background blurs
Sound Sync: Focus ring sound (subtle)
Transition: Pull focus to next element

[4.5-6.5] "DYNAMIC MOVEMENT" — "Product moves with kinetic energy"
Emotional Tone: Energetic, dynamic
Composition: Wide shot, product in motion
Camera: Tracking shot following product movement
Action: Product glides smoothly through frame, maintaining orientation
Sound Sync: Smooth mechanical glide
Transition: Momentum carries into final moment

[6.5-8.0] "FINAL FRAME LOCK" — "Product settles in perfect composition"
Emotional Tone: Satisfying, complete
Composition: Medium shot, product centered, clean background
Camera: Static frame, slight push-in for emphasis
Action: Product comes to rest, final light catch on surface
Sound Sync: Subtle settling sound
Transition: Clean hold for handover (if connected)

═══════════════════════════════════════════════════════════════════════════════
STYLE PARAMETERS
═══════════════════════════════════════════════════════════════════════════════
Visual Preset: Minimal Luxury
Cinematic Style: Clean, modern, high-end product photography aesthetic
Color Grading: Cool tones, desaturated, high contrast
Film Grain: Subtle, fine grain (35mm film simulation)
Motion Blur: Tasteful, natural (not excessive)

═══════════════════════════════════════════════════════════════════════════════
LIGHTING & COLOR
═══════════════════════════════════════════════════════════════════════════════
Primary Light: Soft key light from upper left, cool white (5600K)
Fill Light: Subtle fill from right, 30% intensity
Rim Light: Edge light from behind, creates separation
Color Temperature: Cool/neutral (5600K-6000K)
Atmospheric Density: Low (clean studio environment)
Color Palette: Silver-gray, cool white, subtle blue accents

═══════════════════════════════════════════════════════════════════════════════
AUDIO & SOUND DESIGN
═══════════════════════════════════════════════════════════════════════════════
Voiceover: Cinematic narration, English, normal tempo, medium volume
Sound Effects: Subtle mechanical sounds, product movement, light sweeps
Music: Ambient electronic, minimal, high-energy, builds throughout beat

═══════════════════════════════════════════════════════════════════════════════
CHARACTER INTERACTION
═══════════════════════════════════════════════════════════════════════════════
No human elements in this beat. Product-focused composition.

═══════════════════════════════════════════════════════════════════════════════
FINAL FRAME REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
For connected beats: Final frame must show product cleanly and clearly visible, centered composition, ready for seamless continuation in next beat.`
        },
        input_image_type: 'hero',
        shots_in_beat: ['shot_001', 'shot_002', 'shot_003'],
        total_duration: 8,
        audio_guidance: {
          // Note: voiceover handled by Agent 5.2 separately
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
        isConnectedToPrevious: true,
        sora_prompt: {
          text: `═══════════════════════════════════════════════════════════════════════════════
EXCLUSIONS (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════
NO TEXT. NO WATERMARK. NO READABLE LOGOS/TRADEMARKS. NO BRAND MARKS ON PRODUCT OR CLOTHING. NO DEAD MOMENTS: every beat must include camera motion + visible action.

NEGATIVE INSTRUCTIONS (DO NOT):
- DO NOT warp, smear, redraw, or stylize the product
- DO NOT add random extra parts or elements
- DO NOT create unrealistic physics or impossible motion
- DO NOT use excessive motion blur (use "tasteful motion blur" only)
- DO NOT create distortion before transitions (seamless transitions only)

═══════════════════════════════════════════════════════════════════════════════
REFERENCE IMAGE LOCK (CRITICAL — MUST FOLLOW)
═══════════════════════════════════════════════════════════════════════════════
Use the previous beat's final frame as the starting point. Maintain continuity:
- Product position: Continue from exact final frame position of beat1
- Product orientation: Seamless continuation, no jump cuts
- Lighting continuity: Match previous beat's lighting setup
- Camera position: Smooth continuation from previous beat's final camera position

CONSISTENCY ANCHORS:
- Product must appear identical to previous beat (same proportions, material, color)
- Maintain exact product geometry throughout all camera movements
- Preserve material reflectivity and surface detail
- Keep lighting response consistent with aluminum properties

═══════════════════════════════════════════════════════════════════════════════
PHYSICS & MATERIAL RULES (must be believable)
═══════════════════════════════════════════════════════════════════════════════
PRODUCT PHYSICS:
- Material: Brushed aluminum, medium mass (objectMass: 65/100)
- Motion: Gravity-driven with realistic inertia, smooth continuation from previous beat
- Surface interaction: Light reflects smoothly, no warping
- Mass behavior: Moderate weight, smooth rotation, natural deceleration

ENVIRONMENT PHYSICS:
- Atmospheric effects: Clean studio air, minimal particles (identical to beat1)
- Particle behavior: Realistic dust motes in light beams (consistent with beat1)
- Lighting response: Aluminum reflects cool-toned light sources (same as beat1)

VISUAL METAPHOR INTEGRATION:
- Origin Metaphor: "Precision Engineered" — embodies mechanical precision and industrial elegance
- Metaphor Elements: Clean lines, geometric precision, structured movement

═══════════════════════════════════════════════════════════════════════════════
TIMELINE (8.0 seconds total — continuous motion, high energy)
═══════════════════════════════════════════════════════════════════════════════
NARRATIVE CONTEXT:
- Beat Position: beat2 — Transformation/Development moment
- Story Momentum: Builds on beat1's foundation, introduces new perspective
- Emotional Arc: Evolution from confidence to exploration

[0.0-0.1] "SEAMLESS CONTINUATION" — "Product continues from previous beat's final frame"
Emotional Tone: Smooth transition, no interruption
Composition: Exact continuation from beat1's final frame
Camera: Maintains previous camera position, begins slow pull-back
Action: Product remains in same position, camera begins movement
Sound Sync: Continuation of previous beat's audio
Transition: Seamless, no break in motion

[0.1-2.5] "EXPANSIVE REVEAL" — "Camera pulls back to reveal full product context"
Emotional Tone: Expansive, revealing
Composition: Wide shot, product in environment
Camera: Smooth pull-back with slight upward tilt, reveals environment
Action: Product stays centered as camera reveals surrounding space
Sound Sync: Ambient build-up
Transition: Smooth continuation

[2.5-5.0] "FEATURE EXPLORATION" — "Camera orbits product, highlighting different angles"
Emotional Tone: Exploratory, detailed
Composition: Medium shot, dynamic angles
Camera: 360-degree orbital rotation, varying height
Action: Product rotates slowly, different features come into focus
Sound Sync: Mechanical rotation, subtle
Transition: Smooth arc movement

[5.0-7.0] "DYNAMIC TRANSITION" — "Product moves through space with energy"
Emotional Tone: Dynamic, energetic
Composition: Tracking shot, product in motion
Camera: Dolly-in following product movement
Action: Product glides through frame, maintaining orientation
Sound Sync: Smooth mechanical glide, energy build
Transition: Momentum carries forward

[7.0-8.0] "FINAL FRAME LOCK" — "Product settles in new composition"
Emotional Tone: Satisfying, complete
Composition: Medium shot, product centered, clean background
Camera: Static frame, slight push-in for emphasis
Action: Product comes to rest, final light catch on surface
Sound Sync: Subtle settling sound
Transition: Clean hold for handover (if connected)

═══════════════════════════════════════════════════════════════════════════════
STYLE PARAMETERS
═══════════════════════════════════════════════════════════════════════════════
Visual Preset: Minimal Luxury (identical to beat1)
Cinematic Style: Clean, modern, high-end product photography aesthetic (same as beat1)
Color Grading: Cool tones, desaturated, high contrast (consistent with beat1)
Film Grain: Subtle, fine grain (35mm film simulation) (same as beat1)
Motion Blur: Tasteful, natural (not excessive) (consistent with beat1)

═══════════════════════════════════════════════════════════════════════════════
LIGHTING & COLOR
═══════════════════════════════════════════════════════════════════════════════
Primary Light: Soft key light from upper left, cool white (5600K) (identical to beat1)
Fill Light: Subtle fill from right, 30% intensity (same as beat1)
Rim Light: Edge light from behind, creates separation (consistent with beat1)
Color Temperature: Cool/neutral (5600K-6000K) (same as beat1)
Atmospheric Density: Low (clean studio environment) (identical to beat1)
Color Palette: Silver-gray, cool white, subtle blue accents (consistent with beat1)

═══════════════════════════════════════════════════════════════════════════════
AUDIO & SOUND DESIGN
═══════════════════════════════════════════════════════════════════════════════
Voiceover: Cinematic narration, English, normal tempo, medium volume (self-contained, not referencing beat1)
Sound Effects: Subtle mechanical sounds, product movement, light sweeps (identical description to beat1 for consistency)
Music: Ambient electronic, minimal, high-energy, builds throughout beat (same description as beat1 for consistency)

═══════════════════════════════════════════════════════════════════════════════
CHARACTER INTERACTION
═══════════════════════════════════════════════════════════════════════════════
No human elements in this beat. Product-focused composition.

═══════════════════════════════════════════════════════════════════════════════
FINAL FRAME REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
For connected beats: Final frame must show product cleanly and clearly visible, centered composition, ready for seamless continuation in next beat.`
        },
        input_image_type: 'previous_frame',
        shots_in_beat: ['shot_004', 'shot_005', 'shot_006'],
        total_duration: 8,
        audio_guidance: {
          // Note: voiceover handled by Agent 5.2 separately
          sound_effects: {
            enabled: true,
            preset: 'subtle-mechanical',
            timing_sync: [
              { timestamp: 2.5, description: 'Orbital rotation sound' },
              { timestamp: 5.0, description: 'Smooth glide' }
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
        beatId: 'beat3',
        beatName: 'The Payoff',
        isConnectedToPrevious: true,
        sora_prompt: {
          text: `═══════════════════════════════════════════════════════════════════════════════
EXCLUSIONS (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════
NO TEXT. NO WATERMARK. NO READABLE LOGOS/TRADEMARKS. NO BRAND MARKS ON PRODUCT OR CLOTHING.

REFERENCE IMAGE LOCK (CRITICAL — MUST FOLLOW)
Use the previous beat's final frame as the starting point. Maintain continuity with exact product position and orientation.

PHYSICS & MATERIAL RULES
Product: Medium mass, gravity-driven motion, smooth continuation from previous beat.

TIMELINE (8.0 seconds total)
[0.0-0.1] Seamless continuation from beat2
[0.1-3.0] Dramatic reveal - Product showcased in new perspective
[3.0-6.0] Feature demonstration - Key features highlighted
[6.0-8.0] Final composition - Product in perfect showcase position

STYLE PARAMETERS
Visual Preset: Minimal Luxury (consistent with previous beats)

LIGHTING & COLOR
Primary Light: Soft key light, cool white (5600K) (identical to previous beats)
Color Palette: Silver-gray, cool white, subtle blue accents

AUDIO & SOUND DESIGN
Voiceover: Cinematic narration, English, normal tempo
Sound Effects: Subtle mechanical sounds
Music: Ambient electronic, minimal, high-energy

FINAL FRAME REQUIREMENTS
Final frame shows product cleanly and clearly visible, centered composition.`
        },
        input_image_type: 'previous_frame',
        shots_in_beat: ['shot_007', 'shot_008', 'shot_009'],
        total_duration: 8,
        audio_guidance: {
          // Note: voiceover handled by Agent 5.2 separately
          sound_effects: {
            enabled: true,
            preset: 'subtle-mechanical'
          },
          music: {
            enabled: true,
            preset: 'ambient-electronic',
            mood: 'energetic',
            energy_level: 'high'
          }
        }
      }
    ],
    cost: 0.15
  };
}

interface BeatStoryboardTabProps {
  videoId: string;
  workspaceId: string;
  beatPrompts?: BeatPromptOutput;
  voiceoverScripts?: VoiceoverScriptOutput;
  heroImageUrl?: string;
  onBeatGenerate: (beatId: string) => Promise<void>;
  onBeatRegenerate?: (beatId: string) => Promise<void>;
  onNext?: () => void;
  onBeatPromptsUpdate?: (updatedBeatPrompts: BeatPromptOutput) => Promise<void>;
  isCreating?: boolean; // Loading state for Agent 5.1
}

export function BeatStoryboardTab({
  videoId,
  workspaceId,
  beatPrompts,
  voiceoverScripts,
  heroImageUrl,
  onBeatGenerate,
  onBeatRegenerate,
  onNext,
  onBeatPromptsUpdate,
  isCreating = false,
}: BeatStoryboardTabProps) {
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<BeatGenerationState>({});
  const { toast } = useToast();

  // Use sample data if no real data available (for preview/design purposes)
  // Don't show sample data if Agent 5.1 is currently running
  const [displayBeatPrompts, setDisplayBeatPrompts] = useState<BeatPromptOutput>(beatPrompts || getSampleBeatPrompts());
  const isSampleData = !beatPrompts && !isCreating;

  // Update displayBeatPrompts when beatPrompts prop changes
  useEffect(() => {
    if (beatPrompts) {
      setDisplayBeatPrompts(beatPrompts);
    }
  }, [beatPrompts]);

  // Initialize selected beat to first beat if available
  useEffect(() => {
    if (displayBeatPrompts?.beat_prompts && displayBeatPrompts.beat_prompts.length > 0 && !selectedBeatId) {
      setSelectedBeatId(displayBeatPrompts.beat_prompts[0].beatId);
    }
  }, [displayBeatPrompts, selectedBeatId]);

  // Load generation state from database on mount
  useEffect(() => {
    const loadGenerationState = async () => {
      try {
        const response = await fetch(`/api/social-commerce/videos/${videoId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const video = await response.json();
          // Check step3Data first (new structure), then step5Data (backward compatibility)
          const step3Data = video.step3Data;
          const step5Data = video.step5Data;
          const beatVideos = step3Data?.beatVideos || step5Data?.beatVideos;
          
          if (beatVideos) {
            const state: BeatGenerationState = {};
            Object.entries(beatVideos).forEach(([beatId, data]: [string, any]) => {
              state[beatId] = {
                status: 'completed',
                videoUrl: data.videoUrl,
                lastFrameUrl: data.lastFrameUrl,
              };
            });
            setGenerationState(state);
          }
        }
      } catch (error) {
        console.error('[BeatStoryboard] Failed to load generation state:', error);
      }
    };

    if (videoId && videoId !== 'new') {
      loadGenerationState();
    }
  }, [videoId]);

  // Listen for status updates from polling
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

  const beats = displayBeatPrompts?.beat_prompts || [];

  const getBeatStatus = (beatId: string): BeatStatus => {
    const state = generationState[beatId];
    if (state) return state.status;
    
    // Check if locked
    const beat = beats.find(b => b.beatId === beatId);
    if (beat?.isConnectedToPrevious) {
      const previousBeat = beats.find((b, index) => {
        const currentIndex = beats.indexOf(beat);
        return index === currentIndex - 1;
      });
      
      if (previousBeat) {
        const previousStatus = generationState[previousBeat.beatId]?.status;
        if (previousStatus !== 'completed') {
          return 'locked';
        }
      }
    }
    
    return 'pending';
  };

  const selectedBeat = beats.find(b => b.beatId === selectedBeatId) || null;
  const selectedStatus = selectedBeatId ? getBeatStatus(selectedBeatId) : 'pending';
  const selectedState = selectedBeatId ? generationState[selectedBeatId] : undefined;

  const handlePromptUpdate = async (beatId: string, newPrompt: string) => {
    // Update local beats array
    const updatedBeats = beats.map(b => 
      b.beatId === beatId 
        ? { ...b, sora_prompt: { ...b.sora_prompt, text: newPrompt } }
        : b
    );
    
    // Create updated beatPrompts object
    const updatedBeatPrompts: BeatPromptOutput = {
      ...displayBeatPrompts,
      beat_prompts: updatedBeats,
    };
    
    // Update local state immediately for responsive UI
    setDisplayBeatPrompts(updatedBeatPrompts);
    
    // If onBeatPromptsUpdate is provided, use it
    if (onBeatPromptsUpdate) {
      await onBeatPromptsUpdate(updatedBeatPrompts);
    } else {
      // Otherwise, save directly to backend
      try {
        const response = await fetch(`/api/social-commerce/videos/${videoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            step3Data: {
              beatPrompts: updatedBeatPrompts,
              voiceoverScripts: voiceoverScripts,
            },
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          // Revert on error
          setDisplayBeatPrompts(displayBeatPrompts);
          throw new Error(error.details || error.error || 'Failed to save prompt');
        }
      } catch (error) {
        // Revert on error
        setDisplayBeatPrompts(displayBeatPrompts);
        throw error;
      }
    }
  };

  const handleGenerate = async (beatId?: string) => {
    const targetBeatId = beatId || selectedBeatId;
    if (!targetBeatId) return;

    // Show message if using sample data
    if (isSampleData) {
      toast({
        title: "Sample Data",
        description: "Generate prompts first to create real beats",
        variant: "default",
      });
      return;
    }

    const status = getBeatStatus(targetBeatId);
    if (status === 'locked') {
      toast({
        title: "Beat Locked",
        description: "Complete the previous connected beat first",
        variant: "destructive",
      });
      return;
    }

    // Update state to generating immediately
    setGenerationState(prev => ({
      ...prev,
      [targetBeatId]: {
        ...prev[targetBeatId],
        status: 'generating',
      },
    }));

    try {
      await onBeatGenerate(targetBeatId);
      
      // Poll for status updates
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/social-commerce/videos/${videoId}/beats/${targetBeatId}/status`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'completed' || data.status === 'failed') {
              clearInterval(pollInterval);
              setGenerationState(prev => ({
                ...prev,
                [targetBeatId]: {
                  status: data.status,
                  videoUrl: data.videoUrl,
                  lastFrameUrl: data.lastFrameUrl,
                  error: data.error,
                },
              }));
              window.dispatchEvent(new CustomEvent('beat-status-updated', { 
                detail: { beatId: targetBeatId, status: data.status, videoUrl: data.videoUrl, lastFrameUrl: data.lastFrameUrl, error: data.error } 
              }));
            }
          }
        } catch (error) {
          console.error('[BeatStoryboard] Failed to check status:', error);
        }
      }, 3000); // Poll every 3 seconds

      // Clear interval after 5 minutes (safety timeout)
      setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
    } catch (error) {
      setGenerationState(prev => ({
        ...prev,
        [targetBeatId]: {
          ...prev[targetBeatId],
          status: 'failed',
          error: error instanceof Error ? error.message : 'Generation failed',
        },
      }));
      
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Failed to generate beat',
        variant: "destructive",
      });
    }
  };

  const handleRetry = async () => {
    if (selectedBeatId) {
      await handleGenerate(selectedBeatId);
    }
  };

  const allBeatsCompleted = beats.length > 0 && beats.every(beat => {
    const status = getBeatStatus(beat.beatId);
    return status === 'completed';
  });

  const completedCount = beats.filter(b => getBeatStatus(b.beatId) === 'completed').length;
  const progressPercentage = beats.length > 0 ? (completedCount / beats.length) * 100 : 0;

  if (beats.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-background via-background to-muted/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">No beats available</p>
            <p className="text-sm text-muted-foreground">
              Generate prompts first to see beats
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
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Beat Storyboard</h1>
                  <p className="text-xs text-muted-foreground">
                    {beats.length} beat{beats.length !== 1 ? 's' : ''} • {beats[0]?.total_duration || 8}s each
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
        {/* Loading Indicator - Show when Agent 5.1 is running */}
        {isCreating && (
          <div className="border-t border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-2.5">
            <div className="flex items-center gap-2.5 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="font-semibold text-primary">Generating Prompts</span>
              <span className="text-primary/80">
                Agent 5.1 is generating beat prompts. Please wait...
              </span>
            </div>
          </div>
        )}
        {/* Preview Mode - Only show when not loading and no real data */}
        {isSampleData && !isCreating && (
          <div className="border-t border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent px-6 py-2.5">
            <div className="flex items-center gap-2.5 text-xs">
              <div className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-500" />
              <span className="font-semibold text-yellow-700 dark:text-yellow-400">Preview Mode</span>
              <span className="text-yellow-600/80 dark:text-yellow-400/80">
                Showing sample data. Generate prompts to see your actual beats.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-background/50 via-background/30 to-muted/5">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-8">
            {beats.map((beat) => {
              const beatStatus = getBeatStatus(beat.beatId);
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
                          onGenerate={beatStatus !== 'locked' && beatStatus !== 'generating' ? () => handleGenerate(beat.beatId) : undefined}
                          onRegenerate={beatStatus === 'completed' && onBeatRegenerate ? () => {
                            setSelectedBeatId(beat.beatId);
                            handleRetry();
                          } : undefined}
                        />
                      </div>

                      {/* Right: Single Shot Card for this Beat */}
                      <div className="flex-1">
                        <BeatCardStoryboard
                          beat={beat}
                          status={beatStatus}
                          heroImageUrl={heroImageUrl}
                          isSelected={selectedBeatId === beat.beatId}
                          onSelect={() => setSelectedBeatId(beat.beatId)}
                          onGenerate={beatStatus !== 'locked' && beatStatus !== 'generating' ? () => {
                            setSelectedBeatId(beat.beatId);
                            handleGenerate(beat.beatId);
                          } : undefined}
                          onPromptUpdate={handlePromptUpdate}
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
