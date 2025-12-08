// ═══════════════════════════════════════════════════════════════════════════
// AGENT 2: ASMR Prompt Engineer
// ═══════════════════════════════════════════════════════════════════════════
// Expert AI agent that transforms ideas into cinematic video prompts
// Dynamically adjusts based on video model capabilities (audio support, etc.)

import { callTextModel } from "../../../ai/service";
import { VIDEO_MODEL_CONFIGS } from "../config";
import {
  buildPromptEngineerSystemPrompt,
  buildPromptEngineerUserPrompt,
  parseEngineerOutput,
} from "../prompts/engineer-prompts";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PromptEngineerInput {
  idea: string;                // The ASMR concept/idea
  modelId: string;             // Selected video model ID
  duration: number;            // Video duration in seconds
  aspectRatio: string;         // Aspect ratio (16:9, 9:16, 1:1)
}

export interface PromptEngineerOutput {
  visualPrompt: string;        // Engineered cinematic visual prompt (500-2000 chars)
  soundPrompt?: string;        // Sound design prompt (only if model supports audio)
  cost?: number;               // API cost in USD
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const PROMPT_ENGINEER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",             // Using GPT-4o for precise prompt engineering

};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get model capabilities from config
 */
function getModelCapabilities(modelId: string): {
  supportsAudio: boolean;
  modelName: string;
  maxDuration: number;
} {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  
  if (!config) {
    console.warn(`[prompt-engineer] Unknown model: ${modelId}, using defaults`);
    return {
      supportsAudio: false,
      modelName: modelId,
      maxDuration: 5,
    };
  }

  return {
    supportsAudio: config.hasAudio || false,
    modelName: config.label,
    maxDuration: Math.max(...config.durations),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Engineer a professional video generation prompt
 * 
 * This agent is an expert in:
 * - Cinematic video prompt writing
 * - ASMR visual storytelling
 * - Sound design descriptions (when applicable)
 * - Optimizing prompts for specific AI models
 * 
 * DYNAMIC BEHAVIOR:
 * - If model supports audio → includes detailed sound design in prompt
 * - If model doesn't support audio → focuses purely on visuals
 * - Adjusts prompt style based on duration and aspect ratio
 * 
 * @param input - The idea and model settings
 * @param userId - User ID for tracking
 * @param workspaceId - Workspace ID for tracking
 * @returns Engineered prompt(s) ready for video generation
 */
export async function engineerPrompt(
  input: PromptEngineerInput,
  userId?: string,
  workspaceId?: string
): Promise<PromptEngineerOutput> {
  const { idea, modelId, duration, aspectRatio } = input;

  // Get model capabilities
  const capabilities = getModelCapabilities(modelId);

  // Build dynamic system prompt based on model capabilities
  const systemPrompt = buildPromptEngineerSystemPrompt({
    supportsAudio: capabilities.supportsAudio,
    modelName: capabilities.modelName,
    duration,
    aspectRatio,
  });

  // Build user prompt
  const userPrompt = buildPromptEngineerUserPrompt(idea);

  try {
    console.log(`[prompt-engineer] Engineering prompt for ${modelId} (audio: ${capabilities.supportsAudio})`);
    
    const response = await callTextModel(
      {
        provider: PROMPT_ENGINEER_CONFIG.provider,
        model: PROMPT_ENGINEER_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],

        },
        userId,
        workspaceId,
      },

    );

    const cost = response.usage?.totalCostUsd;
    const rawOutput = response.output.trim();

    // Parse the output (expecting JSON)
    const parsed = parseEngineerOutput(rawOutput, capabilities.supportsAudio);

    console.log(`[prompt-engineer] Generated visual prompt (${parsed.visualPrompt.length} chars)`);
    if (parsed.soundPrompt) {
      console.log(`[prompt-engineer] Generated sound prompt (${parsed.soundPrompt.length} chars)`);
    }

    return {
      visualPrompt: parsed.visualPrompt,
      soundPrompt: parsed.soundPrompt,
      cost,
    };
  } catch (error) {
    console.error("[prompt-engineer] Failed to engineer prompt:", error);
    
    // Fallback: return the original idea as the prompt
    return {
      visualPrompt: idea,
      soundPrompt: capabilities.supportsAudio 
        ? "ASMR quality audio, satisfying sounds, immersive soundscape" 
        : undefined,
    };
  }
}

/**
 * Quick prompt engineering without AI
 * Applies basic enhancements to the idea
 */
export function quickEngineer(
  idea: string,
  supportsAudio: boolean
): PromptEngineerOutput {
  // Add cinematic enhancements
  const visualPrompt = `${idea}, cinematic quality, shallow depth of field, professional lighting, 4K ultra detailed, smooth slow motion, satisfying ASMR visual, high production value`;

  const soundPrompt = supportsAudio
    ? `High-fidelity ASMR audio, crystal clear sound design, immersive binaural recording, satisfying audio triggers`
    : undefined;

  return {
    visualPrompt,
    soundPrompt,
  };
}

