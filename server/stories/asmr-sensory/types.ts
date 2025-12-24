// ASMR / Sensory Template Types

// ═══════════════════════════════════════════════════════════════════════════
// LOOP TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Loop multiplier: 1 = no loop, 2/4/6 = repeat video that many times */
export type LoopMultiplier = 1 | 2 | 4 | 6;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Request to enhance a user's prompt with AI
 */
export interface EnhancePromptRequest {
  /** User's basic visual description */
  prompt: string;
  /** Selected ASMR category (food, triggers, nature, crafts, unboxing) */
  categoryId?: string;
  /** Selected materials for context */
  materials?: string[];
}

/**
 * Request to generate an ASMR video
 */
export interface ASMRGenerateRequest {
  /** Selected ASMR category */
  categoryId?: string;
  /** Visual prompt (can be enhanced or raw) */
  visualPrompt: string;
  /** Sound description for ElevenLabs (optional - used when model doesn't support audio) */
  soundPrompt?: string;
  /** Audio intensity 0-100 (affects prompt_influence in ElevenLabs) */
  audioIntensity?: number;
  /** Selected materials */
  materials?: string[];
  /** Video model ID (default: seedance-1.0-pro) */
  modelId: string;
  /** Aspect ratio */
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9" | "9:21" | "7:4" | "4:7";
  /** Resolution */
  resolution: "360p" | "480p" | "540p" | "720p" | "768p" | "1080p" | "1440p" | "2160p";
  /** Duration in seconds */
  duration: number;
  /** Optional: First frame image URL for I2V */
  firstFrameImage?: string;
  /** Optional: Last frame image URL */
  lastFrameImage?: string;
  /** Loop multiplier: 1 = no loop, 2/4/6 = repeat video that many times */
  loopMultiplier?: LoopMultiplier;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Response from prompt enhancement
 */
export interface EnhancePromptResponse {
  /** Enhanced visual prompt */
  enhancedPrompt: string;
  /** Suggested sound prompt based on category */
  suggestedSoundPrompt?: string;
  /** Cost of the enhancement */
  cost?: number;
}

/** Audio source type */
export type AudioSource = "model" | "elevenlabs" | "merged";

/**
 * Response from video generation request
 * Note: Runware adapter waits internally, so response often includes completed video
 */
export interface ASMRGenerateResponse {
  /** Unique task ID for tracking (may be empty if completed immediately) */
  taskId: string;
  /** Current status - often "completed" directly */
  status: ASMRTaskStatus;
  /** Video URL when completed */
  videoUrl?: string;
  /** Audio URL when generated separately (ElevenLabs) - null if model has native audio */
  audioUrl?: string;
  /** Source of audio: "model" (native) or "elevenlabs" (generated separately) */
  audioSource?: AudioSource;
  /** Actual cost from Runware + ElevenLabs (via includeCost: true) */
  cost?: number;
  /** Error message if failed */
  error?: string;
}

/**
 * Task status for async video generation
 */
export type ASMRTaskStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/**
 * Response for checking task status
 */
export interface ASMRTaskStatusResponse {
  taskId: string;
  status: ASMRTaskStatus;
  progress?: number;
  videoUrl?: string;
  cost?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// MODEL CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

// Re-export VideoModelConfig from the shared config
export type { VideoModelConfig, AspectRatio, Resolution } from "../../ai/config/video-models";

/**
 * Dimension mapping for video generation
 */
export interface VideoDimensions {
  width: number;
  height: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY TYPES (mirrors frontend)
// ═══════════════════════════════════════════════════════════════════════════

export interface ASMRCategory {
  id: string;
  name: string;
  description: string;
  suggestedVisualPrompt: string;
  suggestedSoundPrompt: string;
  materials: string[];
}

export interface ASMRMaterial {
  id: string;
  name: string;
  category: string;
  soundHint: string;
}
