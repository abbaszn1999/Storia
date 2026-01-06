/**
 * Type definitions for Social Commerce beat-based storyboard
 */

export type BeatStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'locked';

export interface BeatGenerationState {
  [beatId: string]: {
    status: BeatStatus;
    videoUrl?: string;
    lastFrameUrl?: string;
    error?: string;
    progress?: number;
  };
}

export interface BeatPrompt {
  beatId: 'beat1' | 'beat2' | 'beat3' | 'beat4';
  beatName: string;
  isConnectedToPrevious: boolean;
  sora_prompt: {
    text: string;
  };
  input_image_type: 'hero' | 'previous_frame';
  shots_in_beat: string[];
  total_duration: 8;
  audio_guidance?: {
    // Note: voiceover removed, handled by Agent 5.2 separately
    sound_effects?: {
      enabled: boolean; // true = user-customized, false = agent-generated
      preset: string;
      timing_sync?: Array<{
        timestamp: number;
        description: string;
      }>;
      customInstructions?: string;
    };
    music?: {
      enabled: boolean; // true = user-customized, false = agent-generated
      preset: string;
      mood?: string;
      energy_level?: string;
      customInstructions?: string;
    };
  };
}

export interface VoiceoverScript {
  enabled: boolean;
  language: 'ar' | 'en';
  tempo: string;
  volume: string;
  dialogue: Array<{
    timestamp: number;
    duration: number;
    line: string;
    wordCount: number;
    emotionalTone: string;
    pacing: 'slow' | 'normal' | 'fast';
  }>;
  totalDuration: number;
  totalWordCount: number;
  scriptSummary: string;
}

export interface VoiceoverScriptOutput {
  beat_scripts: Array<{
    beatId: 'beat1' | 'beat2' | 'beat3' | 'beat4';
    voiceoverScript: VoiceoverScript;
  }>;
  fullScript?: {
    text: string;
    totalDuration: number;
    totalWordCount: number;
  };
}

export interface BeatPromptOutput {
  beat_prompts: BeatPrompt[];
  cost?: number;
}


