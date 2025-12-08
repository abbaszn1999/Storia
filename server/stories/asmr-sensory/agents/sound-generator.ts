// ═══════════════════════════════════════════════════════════════════════════
// ASMR Sound Effects Generator Agent
// ═══════════════════════════════════════════════════════════════════════════
// Generates ASMR sound effects using ElevenLabs Sound Effects API
// Used when video model doesn't support native audio generation

import { callAi } from "../../../ai/service";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SoundGenerationInput {
  /** Sound effect description (e.g., "gentle tapping on glass, soft whispers") */
  soundPrompt: string;
  /** Duration in seconds (should match video duration) */
  duration: number;
  /** Audio intensity 0-100 (maps to prompt_influence 0-1) */
  intensity?: number;
  /** Optional: Category for context-aware sound generation */
  categoryId?: string;
}

export interface SoundGenerationOutput {
  /** Base64 encoded audio data */
  audioBase64: string;
  /** Audio format (mp3 or wav) */
  format: "mp3" | "wav";
  /** Audio data URI for direct playback */
  audioDataUri: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Cost in USD */
  cost?: number;
  /** Error message if failed */
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SOUND_CONFIG = {
  model: "sound-effects",
  provider: "elevenlabs" as const,
  // Map intensity (0-100) to prompt_influence (0-1)
  // Higher influence = sound matches prompt more closely
  intensityToInfluence: (intensity: number) => Math.max(0, Math.min(1, intensity / 100)),
  // Default intensity if not provided
  defaultIntensity: 50,
  // Maximum duration supported
  maxDuration: 22, // ElevenLabs limit
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate ASMR sound effects using ElevenLabs
 * 
 * @param input - Sound generation parameters
 * @param userId - User ID for tracking
 * @param workspaceId - Workspace ID for tracking
 * @returns Generated audio data
 */
export async function generateSound(
  input: SoundGenerationInput,
  userId?: string,
  workspaceId?: string
): Promise<SoundGenerationOutput> {
  const {
    soundPrompt,
    duration,
    intensity = SOUND_CONFIG.defaultIntensity,
  } = input;

  // Validate duration
  const clampedDuration = Math.min(duration, SOUND_CONFIG.maxDuration);
  
  // Build enhanced prompt with ASMR context (independent of categories)
  let enhancedPrompt = soundPrompt;
  
  // Add ASMR quality hints if not already present
  if (!enhancedPrompt.toLowerCase().includes("asmr")) {
    enhancedPrompt = `ASMR quality, ${enhancedPrompt}`;
  }

  // ElevenLabs has a 450 character limit for text
  const MAX_PROMPT_LENGTH = 450;
  if (enhancedPrompt.length > MAX_PROMPT_LENGTH) {
    console.log(`[asmr-sound-generator] Truncating prompt from ${enhancedPrompt.length} to ${MAX_PROMPT_LENGTH} chars`);
    enhancedPrompt = enhancedPrompt.substring(0, MAX_PROMPT_LENGTH - 3) + "...";
  }

  // Calculate prompt influence from intensity
  const promptInfluence = SOUND_CONFIG.intensityToInfluence(intensity);

  console.log("[asmr-sound-generator] Starting sound generation:", {
    promptLength: enhancedPrompt.length,
    duration: clampedDuration,
    intensity,
    promptInfluence,
  });

  try {
    const response = await callAi(
      {
        provider: SOUND_CONFIG.provider,
        model: SOUND_CONFIG.model,
        task: "sound-effects",
        payload: {
          text: enhancedPrompt,
          duration_seconds: clampedDuration,
          prompt_influence: promptInfluence,
        },
        userId,
        workspaceId,
      },
      {
        skipCreditCheck: false,
      }
    );

    // Extract audio data from response
    const output = response.output as {
      audio_base64: string;
      format: string;
      content_type: string;
      size_bytes: number;
    };

    if (!output?.audio_base64) {
      console.error("[asmr-sound-generator] No audio data in response");
      return {
        audioBase64: "",
        format: "mp3",
        audioDataUri: "",
        sizeBytes: 0,
        error: "No audio data received from ElevenLabs",
      };
    }

    const format = output.format === "wav" ? "wav" : "mp3";
    const contentType = format === "wav" ? "audio/wav" : "audio/mpeg";
    const audioDataUri = `data:${contentType};base64,${output.audio_base64}`;

    console.log("[asmr-sound-generator] Sound generated successfully:", {
      format,
      sizeBytes: output.size_bytes,
      cost: response.usage?.totalCostUsd,
    });

    return {
      audioBase64: output.audio_base64,
      format,
      audioDataUri,
      sizeBytes: output.size_bytes,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[asmr-sound-generator] Generation failed:", error);
    return {
      audioBase64: "",
      format: "mp3",
      audioDataUri: "",
      sizeBytes: 0,
      error: error instanceof Error ? error.message : "Sound generation failed",
    };
  }
}

/**
 * Check if sound generation is available
 */
export function isSoundGenerationAvailable(): boolean {
  // Check if ElevenLabs API key is configured
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

/**
 * Get maximum supported duration for sound effects
 */
export function getMaxSoundDuration(): number {
  return SOUND_CONFIG.maxDuration;
}

